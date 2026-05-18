import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { getStockStatus } from './product.service.js';

const mapProductSummary = (product) =>
  product
    ? {
        id: product.id,
        name: product.name,
      }
    : null;

const mapSupplierSummary = (supplier) =>
  supplier
    ? {
        id: supplier.id,
        name: supplier.name,
      }
    : null;

const mapProfileSummary = (profile) =>
  profile
    ? {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
      }
    : null;

const mapInventoryEntry = (entry) => ({
  id: entry.id,
  productId: entry.product_id,
  product: mapProductSummary(entry.product),
  supplierId: entry.supplier_id,
  supplier: mapSupplierSummary(entry.supplier),
  quantityReceived: entry.quantity_received,
  expectedQuantity: entry.expected_quantity,
  quantityDifference: entry.quantity_difference,
  totalCost: Number(entry.total_cost || 0),
  receivedAt: entry.received_at,
  registeredBy: mapProfileSummary(entry.registeredBy),
  notes: entry.notes,
  createdAt: entry.created_at,
});

const mapProductInventory = (product) => ({
  id: product.id,
  name: product.name,
  price: Number(product.price || 0),
  stock: product.stock,
  minStock: product.min_stock,
  criticalStock: product.critical_stock,
  isActive: product.is_active,
  stockStatus: getStockStatus(product),
});

const mapNotification = (notification) => ({
  id: notification.id,
  productId: notification.product_id,
  product: mapProductSummary(notification.product),
  type: notification.alert_type,
  message: notification.message,
  stockAtAlert: notification.stock_at_alert,
  isRead: notification.is_read,
  createdAt: notification.created_at,
});

const getProductsByIds = async (productIds) => {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('products').select('id, name').in('id', ids);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((product) => [product.id, product]));
};

const getSuppliersByIds = async (supplierIds) => {
  const ids = [...new Set(supplierIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('suppliers').select('id, name').in('id', ids);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((supplier) => [supplier.id, supplier]));
};

const getProfilesByIds = async (profileIds) => {
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('profiles').select('id, first_name, last_name').in('id', ids);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((profile) => [profile.id, profile]));
};

const hydrateEntries = async (entries) => {
  const products = await getProductsByIds(entries.map((entry) => entry.product_id));
  const suppliers = await getSuppliersByIds(entries.map((entry) => entry.supplier_id));
  const profiles = await getProfilesByIds(entries.map((entry) => entry.registered_by));

  return entries.map((entry) => ({
    ...entry,
    product: products.get(entry.product_id) || null,
    supplier: suppliers.get(entry.supplier_id) || null,
    registeredBy: profiles.get(entry.registered_by) || null,
  }));
};

export const listInventoryEntries = async (filters) => {
  let query = supabaseAdmin.from('inventory_entries').select('*').order('received_at', { ascending: false });

  if (filters.productId) query = query.eq('product_id', filters.productId);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);

  if (filters.date) {
    const start = new Date(filters.date);
    if (Number.isNaN(start.getTime())) throw new AppError('La fecha no es valida', 400);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte('received_at', start.toISOString()).lt('received_at', end.toISOString());
  }

  if (filters.from) query = query.gte('received_at', new Date(filters.from).toISOString());
  if (filters.to) query = query.lte('received_at', new Date(filters.to).toISOString());

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 400);

  let entries = await hydrateEntries(data);

  if (filters.search) {
    const term = filters.search.toLowerCase();
    entries = entries.filter((entry) =>
      [entry.product?.name, entry.supplier?.name, entry.notes].some((value) => value?.toLowerCase().includes(term)),
    );
  }

  return entries.map(mapInventoryEntry);
};

export const getInventoryEntryById = async (id) => {
  const { data, error } = await supabaseAdmin.from('inventory_entries').select('*').eq('id', id).single();

  if (error || !data) throw new AppError('Entrada de inventario no encontrada', 404);

  const [entry] = await hydrateEntries([data]);
  return mapInventoryEntry(entry);
};

const getActiveProduct = async (productId) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError('Producto no encontrado o inactivo', 400);
  return data;
};

const getActiveSupplier = async (supplierId) => {
  if (!supplierId) return null;

  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError('Proveedor no encontrado o inactivo', 400);
  return data;
};

export const createOrUpdateLowStockNotification = async (product) => {
  const status = getStockStatus(product);

  if (!['out_of_stock', 'critical', 'low'].includes(status)) {
    return null;
  }

  const alertType = status === 'low' ? 'low' : 'critical';
  const message =
    alertType === 'critical'
      ? `El producto ${product.name} esta en stock critico. Stock actual: ${product.stock}`
      : `El producto ${product.name} tiene stock bajo. Stock actual: ${product.stock}`;

  const { data: existing, error: findError } = await supabaseAdmin
    .from('low_stock_notifications')
    .select('*')
    .eq('product_id', product.id)
    .eq('alert_type', alertType)
    .eq('is_read', false)
    .maybeSingle();

  if (findError) throw new AppError(findError.message, 400);

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('low_stock_notifications')
      .update({
        stock_at_alert: product.stock,
        message,
        created_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('low_stock_notifications')
    .insert({
      product_id: product.id,
      alert_type: alertType,
      stock_at_alert: product.stock,
      message,
      is_read: false,
    })
    .select('*')
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
};

export const createInventoryEntry = async (payload, registeredBy) => {
  await getActiveProduct(payload.productId);
  await getActiveSupplier(payload.supplierId);

  const { data: entry, error } = await supabaseAdmin
    .from('inventory_entries')
    .insert({
      product_id: payload.productId,
      supplier_id: payload.supplierId ?? null,
      quantity_received: payload.quantityReceived,
      expected_quantity: payload.expectedQuantity ?? null,
      total_cost: payload.totalCost ?? 0,
      received_at: payload.receivedAt ?? new Date().toISOString(),
      registered_by: registeredBy,
      notes: payload.notes ?? null,
    })
    .select('*')
    .single();

  if (error) throw new AppError(error.message, 400);

  const { data: updatedProduct, error: productError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', payload.productId)
    .single();

  if (productError || !updatedProduct) throw new AppError('No se pudo consultar el producto actualizado', 400);

  await createOrUpdateLowStockNotification(updatedProduct);

  const [hydratedEntry] = await hydrateEntries([entry]);

  return {
    entry: mapInventoryEntry(hydratedEntry),
    product: mapProductInventory(updatedProduct),
  };
};

export const getInventorySummary = async () => {
  const { data, error } = await supabaseAdmin.from('products').select('id, price, stock, min_stock, critical_stock, is_active');

  if (error) throw new AppError(error.message, 400);

  return data.reduce(
    (summary, product) => {
      const stock = product.stock || 0;
      const price = Number(product.price || 0);
      const status = getStockStatus(product);

      summary.totalProducts += 1;
      summary.totalCurrentStock += stock;
      summary.totalInventoryValue += stock * price;

      if (product.is_active) summary.activeProducts += 1;
      else summary.inactiveProducts += 1;

      if (status === 'out_of_stock') summary.outOfStockProducts += 1;
      if (status === 'low') summary.lowStockProducts += 1;
      if (status === 'critical') summary.criticalStockProducts += 1;

      return summary;
    },
    {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
      criticalStockProducts: 0,
      totalCurrentStock: 0,
      totalInventoryValue: 0,
    },
  );
};

export const listLowStockProducts = async ({ type, includeOutOfStock }) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('stock', { ascending: true });

  if (error) throw new AppError(error.message, 400);

  return data
    .map(mapProductInventory)
    .filter((product) => {
      if (includeOutOfStock === false && product.stockStatus === 'out_of_stock') return false;
      if (type === 'critical') return ['critical', 'out_of_stock'].includes(product.stockStatus);
      return ['low', 'critical', 'out_of_stock'].includes(product.stockStatus);
    });
};

export const listLowStockNotifications = async ({ isRead, type }) => {
  let query = supabaseAdmin.from('low_stock_notifications').select('*').order('created_at', { ascending: false });

  if (isRead !== undefined) query = query.eq('is_read', isRead);
  if (type) query = query.eq('alert_type', type);

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 400);

  const products = await getProductsByIds(data.map((notification) => notification.product_id));

  return data.map((notification) =>
    mapNotification({
      ...notification,
      product: products.get(notification.product_id) || null,
    }),
  );
};

export const markNotificationAsRead = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('low_stock_notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw new AppError(error?.message || 'Notificacion no encontrada', 400);

  const products = await getProductsByIds([data.product_id]);
  return mapNotification({ ...data, product: products.get(data.product_id) || null });
};

export const markAllNotificationsAsRead = async () => {
  const { data, error } = await supabaseAdmin
    .from('low_stock_notifications')
    .update({ is_read: true })
    .eq('is_read', false)
    .select('*');

  if (error) throw new AppError(error.message, 400);

  return {
    updated: data.length,
  };
};
