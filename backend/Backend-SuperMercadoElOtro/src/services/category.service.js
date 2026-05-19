import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const mapCategory = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description,
  isActive: category.is_active,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

export const listCategories = async ({ includeInactive }, requesterProfile) => {
  const canSeeInactive = ['admin', 'sales_manager'].includes(requesterProfile?.role);
  let query = supabaseAdmin.from('categories').select('*').order('name', { ascending: true });

  if (!includeInactive || !canSeeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data.map(mapCategory);
};

export const createCategory = async (payload) => {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .ilike('name', payload.name)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new AppError(existingError.message, 400);
  }

  if (existing) {
    throw new AppError('Ya existe una categoria con ese nombre', 409);
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return mapCategory(data);
};

export const updateCategory = async (id, payload) => {
  const updatePayload = {};

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Categoria no encontrada', 400);
  }

  return mapCategory(data);
};

export const deactivateCategory = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'Categoria no encontrada', 400);
  }

  return mapCategory(data);
};
