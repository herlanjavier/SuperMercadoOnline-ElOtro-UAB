import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { buildReceiptData } from './receipt.service.js';

const mapProfile = (profile) =>
  profile
    ? {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        ci: profile.ci,
        phone: profile.phone,
      }
    : null;

const mapOrderSummary = (order) =>
  order
    ? {
        id: order.id,
        status: order.status,
        total: Number(order.total || 0),
        createdAt: order.created_at,
      }
    : null;

const mapSaleItem = (item) => ({
  id: item.id,
  productId: item.product_id,
  productName: item.product_name,
  quantity: item.quantity,
  unitPrice: Number(item.unit_price),
  subtotal: Number(item.subtotal),
});

const mapSale = (sale, context) => ({
  id: sale.id,
  orderId: sale.order_id,
  customerId: sale.customer_id,
  customer: mapProfile(context.profiles.get(sale.customer_id)),
  soldBy: sale.sold_by,
  seller: mapProfile(context.profiles.get(sale.sold_by)),
  order: mapOrderSummary(context.orders.get(sale.order_id)),
  receiptNumber: sale.receipt_number,
  total: Number(sale.total),
  soldAt: sale.sold_at,
  items: context.itemsBySaleId.get(sale.id) || [],
  createdAt: sale.created_at,
});

const getProfilesByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, ci, phone')
    .in('id', uniqueIds);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((profile) => [profile.id, profile]));
};

const getOrdersByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('orders').select('*').in('id', uniqueIds);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((order) => [order.id, order]));
};

const getItemsBySaleIds = async (ids) => {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('sale_items').select('*').in('sale_id', ids);

  if (error) throw new AppError(error.message, 400);

  const map = new Map();
  for (const item of data) {
    const items = map.get(item.sale_id) || [];
    items.push(mapSaleItem(item));
    map.set(item.sale_id, items);
  }

  return map;
};

const hydrateSales = async (sales) => {
  const profiles = await getProfilesByIds(sales.flatMap((sale) => [sale.customer_id, sale.sold_by]));
  const orders = await getOrdersByIds(sales.map((sale) => sale.order_id));
  const itemsBySaleId = await getItemsBySaleIds(sales.map((sale) => sale.id));

  return sales.map((sale) => mapSale(sale, { profiles, orders, itemsBySaleId }));
};

const validateSaleAccess = (sale, requester) => {
  if (requester.role === 'customer' && sale.customerId !== requester.id) {
    throw new AppError('No tienes permiso para ver esta venta', 403);
  }
};

export const listSales = async (filters) => {
  let customerIds = null;

  if (filters.search) {
    const term = `%${filters.search}%`;
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`first_name.ilike.${term},last_name.ilike.${term},ci.ilike.${term},phone.ilike.${term}`);

    if (error) throw new AppError(error.message, 400);
    customerIds = profiles.map((profile) => profile.id);
  }

  let query = supabaseAdmin.from('sales').select('*').order('sold_at', { ascending: false });

  if (filters.from) query = query.gte('sold_at', new Date(filters.from).toISOString());
  if (filters.to) query = query.lte('sold_at', new Date(filters.to).toISOString());
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.soldBy) query = query.eq('sold_by', filters.soldBy);

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      customerIds?.length
        ? `receipt_number.ilike.${term},customer_id.in.(${customerIds.join(',')})`
        : `receipt_number.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 400);
  return hydrateSales(data);
};

export const getSaleById = async (id, requester) => {
  const { data, error } = await supabaseAdmin.from('sales').select('*').eq('id', id).single();

  if (error || !data) throw new AppError('Venta no encontrada', 404);

  const [sale] = await hydrateSales([data]);
  validateSaleAccess(sale, requester);
  return sale;
};

export const getSaleByOrderId = async (orderId, requester) => {
  const { data, error } = await supabaseAdmin.from('sales').select('*').eq('order_id', orderId).single();

  if (error || !data) throw new AppError('No existe venta para este pedido', 404);

  const [sale] = await hydrateSales([data]);
  validateSaleAccess(sale, requester);
  return sale;
};

export const getSaleReceipt = async (id, requester) => {
  const sale = await getSaleById(id, requester);
  return buildReceiptData(sale);
};
