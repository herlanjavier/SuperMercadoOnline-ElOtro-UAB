import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrderPaymentProof,
  getOrderStatusOptions,
  listMyOrders,
  listOrders,
  uploadOrderPaymentProof,
  updateDeliveryPerson,
  updateOrderStatus,
} from '../services/order.service.js';
import {
  getCurrentBusinessHourStatus,
  listBusinessHours,
  updateBusinessHour,
} from '../services/business-hour.service.js';
import {
  adminOrderQuerySchema,
  createOrderSchema,
  dayOfWeekSchema,
  deliveryPersonSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
  updateBusinessHourSchema,
} from '../validators/order.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getRequester = (req) => ({
  id: req.user.id,
  role: req.profile.role,
});

export const createOrderController = asyncHandler(async (req, res) => {
  const payload = createOrderSchema.parse(req.body);
  const data = await createOrder(payload, req.user.id);

  res.status(201).json({ ok: true, data });
});

export const listMyOrdersController = asyncHandler(async (req, res) => {
  const query = orderQuerySchema.parse(req.query);
  const data = await listMyOrders(query, req.user.id);

  res.status(200).json({ ok: true, data });
});

export const listOrdersController = asyncHandler(async (req, res) => {
  const query = adminOrderQuerySchema.parse(req.query);
  const data = await listOrders(query);

  res.status(200).json({ ok: true, data });
});

export const getOrderByIdController = asyncHandler(async (req, res) => {
  const data = await getOrderById(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const uploadOrderPaymentProofController = asyncHandler(async (req, res) => {
  const data = await uploadOrderPaymentProof(req.params.id, req.file, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const getOrderPaymentProofController = asyncHandler(async (req, res) => {
  const data = await getOrderPaymentProof(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const cancelOrderController = asyncHandler(async (req, res) => {
  const data = await cancelOrder(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const getOrderStatusOptionsController = asyncHandler(async (_req, res) => {
  res.status(200).json({ ok: true, data: getOrderStatusOptions() });
});

export const getCurrentBusinessHourStatusController = asyncHandler(async (_req, res) => {
  const data = await getCurrentBusinessHourStatus();

  res.status(200).json({ ok: true, data });
});

export const listBusinessHoursController = asyncHandler(async (_req, res) => {
  const data = await listBusinessHours();

  res.status(200).json({ ok: true, data });
});

export const updateBusinessHourController = asyncHandler(async (req, res) => {
  const dayOfWeek = dayOfWeekSchema.parse(req.params.dayOfWeek);
  const payload = updateBusinessHourSchema.parse(req.body);
  const data = await updateBusinessHour(dayOfWeek, payload);

  res.status(200).json({ ok: true, data });
});

export const updateOrderStatusController = asyncHandler(async (req, res) => {
  const payload = updateOrderStatusSchema.parse(req.body);
  const data = await updateOrderStatus(req.params.id, payload.status);

  res.status(200).json({ ok: true, data });
});

export const updateDeliveryPersonController = asyncHandler(async (req, res) => {
  const payload = deliveryPersonSchema.parse(req.body);
  const data = await updateDeliveryPerson(req.params.id, payload);

  res.status(200).json({ ok: true, data });
});
