import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const mapSupplier = (supplier, products = []) => ({
  id: supplier.id,
  name: supplier.name,
  phone: supplier.phone,
  description: supplier.description,
  isActive: supplier.is_active,
  products,
  createdAt: supplier.created_at,
  updatedAt: supplier.updated_at,
});

const mapProductSummary = (product) => ({
  id: product.id,
  name: product.name,
});

const mapInventoryEntrySummary = (entry) => ({
  id: entry.id,
  productId: entry.product_id,
  supplierId: entry.supplier_id,
  quantityReceived: entry.quantity_received,
  expectedQuantity: entry.expected_quantity,
  quantityDifference: entry.quantity_difference,
  totalCost: Number(entry.total_cost || 0),
  receivedAt: entry.received_at,
  notes: entry.notes,
});

const getSupplierProductsMap = async (supplierIds) => {
  if (supplierIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('supplier_products')
    .select('supplier_id, products(id, name)')
    .in('supplier_id', supplierIds);

  if (error) {
    throw new AppError(error.message, 400);
  }

  const map = new Map();

  for (const row of data) {
    const products = map.get(row.supplier_id) || [];
    if (row.products) products.push(mapProductSummary(row.products));
    map.set(row.supplier_id, products);
  }

  return map;
};

const validateProductsExist = async (productIds = []) => {
  if (productIds.length === 0) return;

  const { data, error } = await supabaseAdmin.from('products').select('id').in('id', productIds);

  if (error) {
    throw new AppError(error.message, 400);
  }

  if (data.length !== productIds.length) {
    throw new AppError('Uno o mas productos no existen', 400);
  }
};

const replaceSupplierProducts = async (supplierId, productIds = []) => {
  await validateProductsExist(productIds);

  const { error: deleteError } = await supabaseAdmin.from('supplier_products').delete().eq('supplier_id', supplierId);

  if (deleteError) {
    throw new AppError(deleteError.message, 400);
  }

  if (productIds.length === 0) return;

  const rows = productIds.map((productId) => ({
    supplier_id: supplierId,
    product_id: productId,
  }));

  const { error } = await supabaseAdmin.from('supplier_products').upsert(rows, {
    onConflict: 'supplier_id,product_id',
    ignoreDuplicates: true,
  });

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const listSuppliers = async ({ search, includeInactive }) => {
  let query = supabaseAdmin.from('suppliers').select('*').order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},phone.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  const productsMap = await getSupplierProductsMap(data.map((supplier) => supplier.id));

  return data.map((supplier) => mapSupplier(supplier, productsMap.get(supplier.id) || []));
};

export const getSupplierById = async (id) => {
  const { data: supplier, error } = await supabaseAdmin.from('suppliers').select('*').eq('id', id).single();

  if (error || !supplier) {
    throw new AppError('Proveedor no encontrado', 404);
  }

  const productsMap = await getSupplierProductsMap([id]);
  const { data: entries, error: entriesError } = await supabaseAdmin
    .from('inventory_entries')
    .select('*')
    .eq('supplier_id', id)
    .order('received_at', { ascending: false })
    .limit(10);

  if (entriesError) {
    throw new AppError(entriesError.message, 400);
  }

  return {
    ...mapSupplier(supplier, productsMap.get(id) || []),
    latestInventoryEntries: entries.map(mapInventoryEntrySummary),
  };
};

export const createSupplier = async (payload) => {
  const productIds = payload.productIds || [];
  await validateProductsExist(productIds);

  const { data: supplier, error } = await supabaseAdmin
    .from('suppliers')
    .insert({
      name: payload.name,
      phone: payload.phone ?? null,
      description: payload.description ?? null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  if (productIds.length > 0) {
    await replaceSupplierProducts(supplier.id, productIds);
  }

  return getSupplierById(supplier.id);
};

export const updateSupplier = async (id, payload) => {
  const updatePayload = {};

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.phone !== undefined) updatePayload.phone = payload.phone;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabaseAdmin.from('suppliers').update(updatePayload).eq('id', id).select('id').single();

    if (error) {
      throw new AppError(error.message, 400);
    }
  } else {
    await getSupplierById(id);
  }

  if (payload.productIds !== undefined) {
    await replaceSupplierProducts(id, payload.productIds);
  }

  return getSupplierById(id);
};

export const deactivateSupplier = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Proveedor no encontrado', 400);
  }

  const productsMap = await getSupplierProductsMap([id]);
  return mapSupplier(data, productsMap.get(id) || []);
};

export const restoreSupplier = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .update({ is_active: true })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Proveedor no encontrado', 400);
  }

  const productsMap = await getSupplierProductsMap([id]);
  return mapSupplier(data, productsMap.get(id) || []);
};

export const addSupplierProducts = async (supplierId, productIds) => {
  await getSupplierById(supplierId);
  await validateProductsExist(productIds);

  const rows = productIds.map((productId) => ({
    supplier_id: supplierId,
    product_id: productId,
  }));

  const { error } = await supabaseAdmin.from('supplier_products').upsert(rows, {
    onConflict: 'supplier_id,product_id',
    ignoreDuplicates: true,
  });

  if (error) {
    throw new AppError(error.message, 400);
  }

  return getSupplierById(supplierId);
};

export const removeSupplierProduct = async (supplierId, productId) => {
  const { error } = await supabaseAdmin
    .from('supplier_products')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('product_id', productId);

  if (error) {
    throw new AppError(error.message, 400);
  }

  return getSupplierById(supplierId);
};
