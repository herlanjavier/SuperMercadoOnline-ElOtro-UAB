import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { canTransitionOrderStatus } from '../utils/orderStatus.js';
import { calculateItemSubtotal, calculateOrderTotal } from '../utils/orderTotals.js';
import { ensureBusinessIsOpen } from './business-hour.service.js';
import {
  createSignedUrlForPaymentProof,
  deletePaymentProof,
  uploadPaymentProof,
} from './storage.service.js';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pendiente de pago' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'ready_for_pickup', label: 'Listo para recoger' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const FAKE_QR_IMAGES = [
  '/assets/qr/fake-qr-1.png',
  '/assets/qr/fake-qr-1.png',
  '/assets/qr/fake-qr-1.png',
];

const generatePaymentQrCode = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `QR-${date}-${random}`;
};

const getRandomFakeQrImage = () => FAKE_QR_IMAGES[Math.floor(Math.random() * FAKE_QR_IMAGES.length)];

const mapProfile = (profile) =>
  profile
    ? {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        ci: profile.ci,
        phone: profile.phone,
        address: profile.address,
        addressReference: profile.address_reference,
      }
    : null;

const mapOrderItem = (item, product) => ({
  id: item.id,
  productId: item.product_id,
  productName: product?.name || item.product_name || null,
  quantity: item.quantity,
  unitPrice: Number(item.unit_price),
  subtotal: Number(item.subtotal),
});

const mapOrder = (order, items = [], profiles = new Map(), products = new Map()) => ({
  id: order.id,
  customerId: order.customer_id,
  customer: mapProfile(profiles.get(order.customer_id)),
  status: order.status,
  subtotal: Number(order.subtotal),
  total: Number(order.total),
  deliveryAddress: order.delivery_address,
  deliveryReference: order.delivery_reference,
  paymentQrCode: order.payment_qr_code,
  paymentQrImageUrl: order.payment_qr_image_url,
  paymentProofUrl: order.payment_proof_url,
  paymentProofPath: order.payment_proof_path,
  paymentProofMimeType: order.payment_proof_mime_type,
  paymentProofUploadedAt: order.payment_proof_uploaded_at,
  paymentNotes: order.payment_notes,
  items: items.map((item) => mapOrderItem(item, products.get(item.product_id))),
  confirmedBy: order.confirmed_by,
  confirmedAt: order.confirmed_at,
  deliveredAt: order.delivered_at,
  deliveryPersonFirstName: order.delivery_person_first_name,
  deliveryPersonLastName: order.delivery_person_last_name,
  deliveryPersonCi: order.delivery_person_ci,
  deliveryPersonVehicleType: order.delivery_person_vehicle_type,
  deliveryPersonPlate: order.delivery_person_plate,
  deliveryPersonPhone: order.delivery_person_phone,
  deliveryPerson: order.delivery_person_first_name
    ? {
        firstName: order.delivery_person_first_name,
        lastName: order.delivery_person_last_name,
        ci: order.delivery_person_ci,
        vehicleType: order.delivery_person_vehicle_type,
        plate: order.delivery_person_plate,
        phone: order.delivery_person_phone,
      }
    : null,
  cancelledAt: order.cancelled_at,
  createdAt: order.created_at,
  updatedAt: order.updated_at,
});

const normalizeItems = (items) => {
  const itemMap = new Map();

  for (const item of items) {
    itemMap.set(item.productId, (itemMap.get(item.productId) || 0) + item.quantity);
  }

  return [...itemMap.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

const getProfilesByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, ci, phone, address, address_reference, is_active')
    .in('id', uniqueIds);

  if (error) {
    throw new AppError(error.message, 400);
  }

  return new Map(data.map((profile) => [profile.id, profile]));
};

const getProductsByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('products').select('*').in('id', uniqueIds);

  if (error) {
    throw new AppError(error.message, 400);
  }

  return new Map(data.map((product) => [product.id, product]));
};

const getOrderItemsByOrderIds = async (orderIds) => {
  if (orderIds.length === 0) return { itemsByOrderId: new Map(), products: new Map() };

  const { data: items, error } = await supabaseAdmin.from('order_items').select('*').in('order_id', orderIds);

  if (error) {
    throw new AppError(error.message, 400);
  }

  const products = await getProductsByIds(items.map((item) => item.product_id));
  const itemsByOrderId = new Map();

  for (const item of items) {
    const orderItems = itemsByOrderId.get(item.order_id) || [];
    orderItems.push(item);
    itemsByOrderId.set(item.order_id, orderItems);
  }

  return { itemsByOrderId, products };
};

const hydrateOrders = async (orders) => {
  const { itemsByOrderId, products } = await getOrderItemsByOrderIds(orders.map((order) => order.id));
  const profileIds = orders.flatMap((order) => [order.customer_id]);
  const profiles = await getProfilesByIds(profileIds);

  return orders.map((order) => mapOrder(order, itemsByOrderId.get(order.id) || [], profiles, products));
};

const applyOrderDateFilters = (query, filters) => {
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.from) query = query.gte('created_at', new Date(filters.from).toISOString());
  if (filters.to) query = query.lte('created_at', new Date(filters.to).toISOString());
  return query;
};

const validateCustomerProfile = async (customerId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', customerId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new AppError('Perfil de cliente no encontrado o inactivo', 400);
  }

  return data;
};

const validateProductsAndBuildItems = async (items) => {
  const products = await getProductsByIds(items.map((item) => item.productId));

  if (products.size !== items.length) {
    throw new AppError('Producto no encontrado', 400);
  }

  return items.map((item) => {
    const product = products.get(item.productId);

    if (!product.is_active) {
      throw new AppError(`Producto inactivo: ${product.name}`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para ${product.name}`, 400);
    }

    const unitPrice = Number(product.price);
    const subtotal = calculateItemSubtotal({ quantity: item.quantity, unitPrice });

    return {
      product,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });
};

export const createOrder = async (payload, customerId) => {
  await ensureBusinessIsOpen();

  const profile = await validateCustomerProfile(customerId);
  const items = normalizeItems(payload.items);
  const builtItems = await validateProductsAndBuildItems(items);
  const subtotal = calculateOrderTotal(builtItems);
  const total = subtotal;
  const deliveryAddress = payload.deliveryAddress || profile.address;
  const deliveryReference = payload.deliveryReference || profile.address_reference || null;

  if (!deliveryAddress) {
    throw new AppError('Debes indicar una direccion de entrega', 400);
  }

  let createdOrder = null;

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId,
        status: 'pending_payment',
        subtotal,
        total,
        delivery_address: deliveryAddress,
        delivery_reference: deliveryReference,
        payment_qr_code: generatePaymentQrCode(),
        payment_qr_image_url: getRandomFakeQrImage(),
      })
      .select('*')
      .single();

    if (orderError) {
      throw new AppError(orderError.message, 400);
    }

    createdOrder = order;

    const itemRows = builtItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemRows);

    if (itemsError) {
      throw new AppError(itemsError.message, 400);
    }

    return getOrderById(order.id, { id: customerId, role: 'customer' });
  } catch (error) {
    if (createdOrder?.id) {
      await supabaseAdmin.from('orders').delete().eq('id', createdOrder.id).catch(() => {});
    }

    throw error;
  }
};

export const listMyOrders = async (filters, customerId) => {
  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  query = applyOrderDateFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  return hydrateOrders(data);
};

export const listOrders = async (filters) => {
  let customerIds = null;

  if (filters.search) {
    const term = `%${filters.search}%`;
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`first_name.ilike.${term},last_name.ilike.${term},ci.ilike.${term},phone.ilike.${term}`);

    if (profileError) {
      throw new AppError(profileError.message, 400);
    }

    customerIds = profiles.map((profile) => profile.id);

    if (customerIds.length === 0) return [];
  }

  let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  query = applyOrderDateFilters(query, filters);

  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (customerIds) query = query.in('customer_id', customerIds);

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  return hydrateOrders(data);
};

export const getOrderById = async (id, requester) => {
  const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (error || !data) {
    throw new AppError('Pedido no encontrado', 404);
  }

  if (requester.role === 'customer' && data.customer_id !== requester.id) {
    throw new AppError('No tienes permiso para ver este pedido', 403);
  }

  const [order] = await hydrateOrders([data]);
  return order;
};

export const cancelOrder = async (id, requester) => {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (error || !order) {
    throw new AppError('Pedido no encontrado', 404);
  }

  if (requester.role === 'customer' && order.customer_id !== requester.id) {
    throw new AppError('No tienes permiso para cancelar este pedido', 403);
  }

  if (order.status === 'cancelled') {
    throw new AppError('El pedido ya esta cancelado', 400);
  }

  if (order.status === 'delivered') {
    throw new AppError('El pedido no puede cancelarse en su estado actual', 400);
  }

  if (['confirmed', 'ready_for_pickup'].includes(order.status)) {
    throw new AppError('No se puede cancelar un pedido confirmado desde este endpoint todavia.', 400);
  }

  const allowedStatuses = requester.role === 'customer' ? ['pending_payment'] : ['pending_payment', 'confirmed'];

  if (!allowedStatuses.includes(order.status)) {
    throw new AppError('El pedido no puede cancelarse en su estado actual', 400);
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError || !data) {
    throw new AppError(updateError?.message || 'No se pudo cancelar el pedido', 400);
  }

  const [mappedOrder] = await hydrateOrders([data]);
  return mappedOrder;
};

export const getOrderStatusOptions = () => ORDER_STATUS_OPTIONS;

export const updateOrderStatus = async (id, newStatus) => {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (error || !order) {
    throw new AppError('Pedido no encontrado', 404);
  }

  if (order.status === 'delivered') {
    throw new AppError('No se puede cambiar el estado de un pedido entregado', 400);
  }

  if (order.status === 'cancelled') {
    throw new AppError('No se puede cambiar el estado de un pedido cancelado', 400);
  }

  if (order.status === 'pending_payment' && newStatus === 'confirmed') {
    throw new AppError('Para confirmar pago debe usarse el endpoint de confirmacion QR', 400);
  }

  if (!canTransitionOrderStatus(order.status, newStatus)) {
    throw new AppError('Estado de pedido no permitido', 400);
  }

  if (['confirmed', 'ready_for_pickup'].includes(order.status) && newStatus === 'cancelled') {
    throw new AppError('No se puede cancelar un pedido confirmado desde este endpoint todavia.', 400);
  }

  const updatePayload = { status: newStatus };

  if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString();
  if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

  const { data, error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError || !data) {
    throw new AppError(updateError?.message || 'No se pudo actualizar el estado del pedido', 400);
  }

  const [mappedOrder] = await hydrateOrders([data]);
  return mappedOrder;
};

export const updateDeliveryPerson = async (id, payload) => {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (error || !order) {
    throw new AppError('Pedido no encontrado', 404);
  }

  if (['cancelled', 'delivered'].includes(order.status)) {
    throw new AppError('No se puede registrar repartidor en un pedido cancelado o entregado', 400);
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      delivery_person_first_name: payload.firstName,
      delivery_person_last_name: payload.lastName,
      delivery_person_ci: payload.ci ?? null,
      delivery_person_vehicle_type: payload.vehicleType ?? null,
      delivery_person_plate: payload.plate ?? null,
      delivery_person_phone: payload.phone ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError || !data) {
    throw new AppError(updateError?.message || 'No se pudo actualizar el repartidor del pedido', 400);
  }

  const [mappedOrder] = await hydrateOrders([data]);
  return mappedOrder;
};

const getRawOrderById = async (id) => {
  const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();

  if (error || !data) {
    throw new AppError('Pedido no encontrado', 404);
  }

  return data;
};

const ensureCanAccessOrder = (order, requester) => {
  if (requester.role === 'customer' && order.customer_id !== requester.id) {
    throw new AppError('No tienes permiso para ver este pedido', 403);
  }
};

export const uploadOrderPaymentProof = async (id, file, requester) => {
  const order = await getRawOrderById(id);

  if (requester.role !== 'customer' || order.customer_id !== requester.id) {
    throw new AppError('Solo el cliente del pedido puede subir comprobante.', 403);
  }

  if (order.status !== 'pending_payment') {
    throw new AppError('Solo puedes subir comprobante si el pedido esta pendiente de pago.', 400);
  }

  const uploaded = await uploadPaymentProof(file, id);
  const uploadedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      payment_proof_url: null,
      payment_proof_path: uploaded.path,
      payment_proof_mime_type: uploaded.mimeType,
      payment_proof_uploaded_at: uploadedAt,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    await deletePaymentProof(uploaded.path).catch(() => null);
    throw new AppError(error?.message || 'No se pudo guardar el comprobante.', 400);
  }

  if (order.payment_proof_path) {
    await deletePaymentProof(order.payment_proof_path).catch(() => null);
  }

  return {
    id: data.id,
    status: data.status,
    paymentProofPath: data.payment_proof_path,
    paymentProofMimeType: data.payment_proof_mime_type,
    paymentProofUploadedAt: data.payment_proof_uploaded_at,
  };
};

export const getOrderPaymentProof = async (id, requester) => {
  const order = await getRawOrderById(id);
  ensureCanAccessOrder(order, requester);

  if (!order.payment_proof_path) {
    throw new AppError('El pedido aun no tiene comprobante de pago.', 400);
  }

  return {
    url: await createSignedUrlForPaymentProof(order.payment_proof_path),
    mimeType: order.payment_proof_mime_type,
    uploadedAt: order.payment_proof_uploaded_at,
  };
};
