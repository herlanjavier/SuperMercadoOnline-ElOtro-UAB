import {
  createSalesManager,
  deactivateUser,
  getUserById,
  listUsers,
  updateUser,
} from '../services/user.service.js';
import {
  createSalesManagerSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getRequester = (req) => ({
  user: req.user,
  profile: req.profile,
});

export const createSalesManagerController = asyncHandler(async (req, res) => {
  const payload = createSalesManagerSchema.parse(req.body);
  const data = await createSalesManager(payload);

  res.status(201).json({ ok: true, data });
});

export const listUsersController = asyncHandler(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const data = await listUsers(query);

  res.status(200).json({ ok: true, data });
});

export const getUserByIdController = asyncHandler(async (req, res) => {
  const data = await getUserById(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const updateUserController = asyncHandler(async (req, res) => {
  const payload = updateUserSchema.parse(req.body);
  const data = await updateUser(req.params.id, payload, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const deactivateUserController = asyncHandler(async (req, res) => {
  const data = await deactivateUser(req.params.id, req.user.id);

  res.status(200).json({ ok: true, data });
});
