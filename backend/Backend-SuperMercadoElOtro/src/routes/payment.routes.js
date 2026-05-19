import { Router } from 'express';
import {
  confirmQrPaymentController,
  getPaymentStatusController,
} from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.patch('/orders/:orderId/confirm-qr', requireRole('admin', 'sales_manager'), confirmQrPaymentController);
router.get('/orders/:orderId/status', requireRole('admin', 'sales_manager', 'customer'), getPaymentStatusController);

export default router;
