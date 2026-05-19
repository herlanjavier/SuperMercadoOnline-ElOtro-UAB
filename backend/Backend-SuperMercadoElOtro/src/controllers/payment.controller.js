import { confirmQrPayment, getPaymentStatus } from '../services/payment.service.js';
import { confirmQrPaymentSchema } from '../validators/payment.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getRequester = (req) => ({
  id: req.user.id,
  role: req.profile.role,
});

export const confirmQrPaymentController = asyncHandler(async (req, res) => {
  const payload = confirmQrPaymentSchema.parse(req.body);
  const data = await confirmQrPayment(req.params.orderId, req.user.id, payload);

  res.status(200).json({ ok: true, data });
});

export const getPaymentStatusController = asyncHandler(async (req, res) => {
  const data = await getPaymentStatus(req.params.orderId, getRequester(req));

  res.status(200).json({ ok: true, data });
});
