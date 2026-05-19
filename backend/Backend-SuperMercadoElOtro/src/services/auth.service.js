import { supabaseAdmin, supabasePublic } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const profileSelect = '*';

const toProfilePayload = (data, role = 'customer') => ({
  email: data.email,
  first_name: data.firstName,
  last_name: data.lastName,
  ci: data.ci ?? null,
  phone: data.phone ?? null,
  address: data.address ?? null,
  address_reference: data.addressReference ?? null,
  role,
  profile_completed: true,
  is_active: true,
});

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const registerCustomer = async (payload) => {
  const { data, error } = await supabasePublic.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        role: 'customer',
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
    },
  });

  if (error) {
    throw new AppError(error.message, 400);
  }

  if (!data?.user) {
    throw new AppError('No se pudo crear el usuario', 400);
  }

  const profilePayload = toProfilePayload(payload, 'customer');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: data.user.id, ...profilePayload }, { onConflict: 'id' })
    .select(profileSelect)
    .single();

  if (profileError) {
    throw new AppError(profileError.message, 400);
  }

  return {
    user: sanitizeUser(data.user),
    profile,
  };
};

export const login = async ({ email, password }) => {
  const { data, error } = await supabasePublic.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user || !data?.session) {
    throw new AppError('Credenciales invalidas', 401);
  }

  const profile = await getProfileByUserId(data.user.id);

  if (profile.is_active === false) {
    throw new AppError('El usuario se encuentra desactivado', 403);
  }

  return {
    session: data.session,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: sanitizeUser(data.user),
    profile,
  };
};

export const logout = async (token) => {
  if (token) {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      return { message: 'Sesion cerrada localmente', remoteRevoked: false };
    }
  }

  return { message: 'Sesion cerrada correctamente', remoteRevoked: Boolean(token) };
};

export const getProfileByUserId = async (userId) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(profileSelect)
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AppError('Perfil de usuario no encontrado', 404);
  }

  return profile;
};

export const getCurrentUser = async (user) => {
  const profile = await getProfileByUserId(user.id);

  return {
    user,
    profile,
  };
};
