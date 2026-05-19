import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const profileSelect = '*';

const toProfilePayload = (data, role = 'sales_manager') => ({
  email: data.email,
  first_name: data.firstName,
  last_name: data.lastName,
  ci: data.ci ?? null,
  phone: data.phone ?? null,
  address: data.address ?? null,
  role,
  profile_completed: true,
  is_active: true,
});

const toUpdatePayload = (data, isAdmin) => {
  const payload = {};

  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.ci !== undefined) payload.ci = data.ci;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.address !== undefined) payload.address = data.address;
  if (data.addressReference !== undefined) payload.address_reference = data.addressReference;

  if (isAdmin && data.isActive !== undefined) payload.is_active = data.isActive;
  if (isAdmin && data.is_active !== undefined) payload.is_active = data.is_active;

  return payload;
};

const sanitizeAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const isProfileCompleted = (profile) =>
  Boolean(profile.first_name && profile.last_name && profile.ci && profile.phone && profile.address);

export const createSalesManager = async (payload) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      role: 'sales_manager',
      first_name: payload.firstName,
      last_name: payload.lastName,
    },
  });

  if (error || !data?.user) {
    throw new AppError(error?.message || 'No se pudo crear el usuario', 400);
  }

  const profilePayload = toProfilePayload(payload, 'sales_manager');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: data.user.id, ...profilePayload }, { onConflict: 'id' })
    .select(profileSelect)
    .single();

  if (profileError) {
    throw new AppError(profileError.message, 400);
  }

  return {
    user: sanitizeAuthUser(data.user),
    profile,
  };
};

export const listUsers = async ({ role, search, isActive }) => {
  let query = supabaseAdmin.from('profiles').select(profileSelect).order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (search) {
    const term = `%${search}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},ci.ilike.${term},phone.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data;
};

export const getUserById = async (id, requester) => {
  if (requester.profile.role !== 'admin' && requester.user.id !== id) {
    throw new AppError('No tienes permisos para ver este usuario', 403);
  }

  const { data, error } = await supabaseAdmin.from('profiles').select(profileSelect).eq('id', id).single();

  if (error || !data) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return data;
};

export const updateUser = async (id, payload, requester) => {
  const isAdmin = requester.profile.role === 'admin';

  if (!isAdmin && requester.user.id !== id) {
    throw new AppError('No tienes permisos para actualizar este usuario', 403);
  }

  if (!isAdmin && (payload.role !== undefined || payload.is_active !== undefined || payload.isActive !== undefined)) {
    throw new AppError('No tienes permisos para actualizar rol o estado', 403);
  }

  const updatePayload = toUpdatePayload(payload, isAdmin);

  if (isAdmin && payload.role !== undefined) {
    if (payload.role === 'admin') {
      throw new AppError('No se permite promover usuarios a admin desde este endpoint', 403);
    }

    updatePayload.role = payload.role;
  }

  const currentProfile = await getUserById(id, requester);
  const mergedProfile = { ...currentProfile, ...updatePayload };

  if (isProfileCompleted(mergedProfile)) {
    updatePayload.profile_completed = true;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)
    .select(profileSelect)
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'No se pudo actualizar el usuario', 400);
  }

  return data;
};

export const deactivateUser = async (id, currentUserId) => {
  if (id === currentUserId) {
    throw new AppError('No puedes desactivar tu propio usuario', 400);
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)
    .select(profileSelect)
    .single();

  if (error || !data) {
    throw new AppError(error?.message || 'No se pudo desactivar el usuario', 400);
  }

  return data;
};
