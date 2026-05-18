import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const loadProfileByUserId = async (userId) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AppError('Perfil de usuario no encontrado', 403);
  }

  if (profile.is_active === false) {
    throw new AppError('El usuario se encuentra desactivado', 403);
  }

  return profile;
};

export const attachProfileIfAuthenticated = asyncHandler(async (req, _res, next) => {
  if (!req.user?.id) {
    next();
    return;
  }

  req.profile = await loadProfileByUserId(req.user.id);
  next();
});

export const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const profile = req.profile || await loadProfileByUserId(req.user.id);

    if (!roles.includes(profile.role)) {
      throw new AppError('No tienes permisos para realizar esta accion', 403);
    }

    req.profile = profile;
    next();
  });
