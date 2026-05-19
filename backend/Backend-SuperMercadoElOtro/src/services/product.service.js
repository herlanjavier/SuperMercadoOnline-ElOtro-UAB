import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { getStockStatus } from '../utils/stockStatus.js';
import { deleteProductImage, uploadProductImage } from './storage.service.js';

const productSelect = '*, categories(id, name)';
export { getStockStatus };

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: Number(product.price),
  stock: product.stock,
  minStock: product.min_stock,
  criticalStock: product.critical_stock,
  expirationDate: product.expiration_date,
  imageUrl: product.image_url,
  imagePath: product.image_path,
  isActive: product.is_active,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
  category: product.categories
    ? {
        id: product.categories.id,
        name: product.categories.name,
      }
    : null,
  stockStatus: getStockStatus(product),
});

const toProductPayload = (payload) => {
  const data = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.categoryId !== undefined) data.category_id = payload.categoryId;
  if (payload.price !== undefined) data.price = payload.price;
  if (payload.stock !== undefined) data.stock = payload.stock;
  if (payload.minStock !== undefined) data.min_stock = payload.minStock;
  if (payload.criticalStock !== undefined) data.critical_stock = payload.criticalStock;
  if (payload.expirationDate !== undefined) data.expiration_date = payload.expirationDate;
  if (payload.isActive !== undefined) data.is_active = payload.isActive;

  return data;
};

const applyProductFilters = (query, filters, requesterProfile) => {
  const canSeeInactive = ['admin', 'sales_manager'].includes(requesterProfile?.role);

  if (!filters.includeInactive || !canSeeInactive) {
    query = query.eq('is_active', true);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.onlyAvailable) {
    query = query.gt('stock', 0);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  return query;
};

export const listProducts = async (filters, requesterProfile) => {
  const canUseStockFilters = ['admin', 'sales_manager'].includes(requesterProfile?.role);
  let query = supabaseAdmin.from('products').select(productSelect).order('created_at', { ascending: false });
  query = applyProductFilters(query, filters, requesterProfile);

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  let products = data;

  if (filters.lowStock && canUseStockFilters) {
    products = products.filter((product) => product.stock <= product.min_stock);
  }

  if (filters.criticalStock && canUseStockFilters) {
    products = products.filter((product) => product.stock <= product.critical_stock);
  }

  return products.map(mapProduct);
};

export const getProductById = async (id, requesterProfile) => {
  let query = supabaseAdmin.from('products').select(productSelect).eq('id', id);

  if (!['admin', 'sales_manager'].includes(requesterProfile?.role)) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new AppError('Producto no encontrado', 404);
  }

  return mapProduct(data);
};

export const createProduct = async (payload, file) => {
  let uploadedImage = null;

  try {
    uploadedImage = await uploadProductImage(file);

    const productPayload = {
      ...toProductPayload(payload),
      is_active: true,
      image_url: uploadedImage?.publicUrl ?? null,
      image_path: uploadedImage?.path ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productPayload)
      .select(productSelect)
      .single();

    if (error) {
      throw new AppError(error.message, 400);
    }

    return mapProduct(data);
  } catch (error) {
    if (uploadedImage?.path) {
      await deleteProductImage(uploadedImage.path).catch(() => {});
    }

    throw error;
  }
};

export const updateProduct = async (id, payload, file) => {
  const { data: currentProduct, error: currentError } = await supabaseAdmin
    .from('products')
    .select(productSelect)
    .eq('id', id)
    .single();

  if (currentError || !currentProduct) {
    throw new AppError('Producto no encontrado', 404);
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadProductImage(file);

    const updatePayload = toProductPayload(payload);

    if (uploadedImage) {
      updatePayload.image_url = uploadedImage.publicUrl;
      updatePayload.image_path = uploadedImage.path;
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select(productSelect)
      .single();

    if (error || !data) {
      throw new AppError(error?.message || 'No se pudo actualizar el producto', 400);
    }

    if (uploadedImage && currentProduct.image_path) {
      await deleteProductImage(currentProduct.image_path).catch(() => {});
    }

    return mapProduct(data);
  } catch (error) {
    if (uploadedImage?.path) {
      await deleteProductImage(uploadedImage.path).catch(() => {});
    }

    throw error;
  }
};

export const deactivateProduct = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .select(productSelect)
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Producto no encontrado', 400);
  }

  return mapProduct(data);
};

export const restoreProduct = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ is_active: true })
    .eq('id', id)
    .select(productSelect)
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Producto no encontrado', 400);
  }

  return mapProduct(data);
};

export const removeProductImage = async (id) => {
  const { data: currentProduct, error: currentError } = await supabaseAdmin
    .from('products')
    .select(productSelect)
    .eq('id', id)
    .single();

  if (currentError || !currentProduct) {
    throw new AppError('Producto no encontrado', 404);
  }

  if (!currentProduct.image_path) {
    throw new AppError('El producto no tiene imagen para eliminar', 400);
  }

  await deleteProductImage(currentProduct.image_path);

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ image_url: null, image_path: null })
    .eq('id', id)
    .select(productSelect)
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'No se pudo actualizar el producto', 400);
  }

  return mapProduct(data);
};
