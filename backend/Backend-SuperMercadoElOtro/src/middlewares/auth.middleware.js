import { supabasePublic } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token de autenticacion requerido', 401);
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabasePublic.auth.getUser(token);

  if (error || !data?.user) {
    throw new AppError('Token de autenticacion invalido', 401);
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    aud: data.user.aud,
    role: data.user.role,
  };

  next();
});

export const optionalAuthMiddleware = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabasePublic.auth.getUser(token);

  if (error || !data?.user) {
    next();
    return;
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    aud: data.user.aud,
    role: data.user.role,
  };

  next();
});
