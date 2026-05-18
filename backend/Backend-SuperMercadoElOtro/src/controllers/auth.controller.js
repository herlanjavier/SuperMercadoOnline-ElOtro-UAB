import {
  getCurrentUser,
  login,
  logout,
  registerCustomer,
} from '../services/auth.service.js';
import { loginSchema, registerCustomerSchema } from '../validators/auth.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
};

export const registerCustomerController = asyncHandler(async (req, res) => {
  const payload = registerCustomerSchema.parse(req.body);
  const data = await registerCustomer(payload);

  res.status(201).json({ ok: true, data });
});

export const loginController = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const data = await login(payload);

  res.status(200).json({ ok: true, data });
});

export const logoutController = asyncHandler(async (req, res) => {
  const data = await logout(getBearerToken(req));

  res.status(200).json({ ok: true, data });
});

export const meController = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.user);

  res.status(200).json({ ok: true, data });
});
