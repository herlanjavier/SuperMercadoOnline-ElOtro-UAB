import { Router } from 'express';
import multer from 'multer';
import {
  cancelOrderController,
  createOrderController,
  getCurrentBusinessHourStatusController,
  getOrderByIdController,
  getOrderPaymentProofController,
  getOrderStatusOptionsController,
  listBusinessHoursController,
  listMyOrdersController,
  listOrdersController,
  uploadOrderPaymentProofController,
  updateDeliveryPersonController,
  updateBusinessHourController,
  updateOrderStatusController,
} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { AppError } from '../utils/AppError.js';

const allowedPaymentProofTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedPaymentProofTypes.includes(file.mimetype)) {
      cb(new AppError('El archivo debe ser imagen o PDF.', 400));
      return;
    }

    cb(null, true);
  },
});

const router = Router();

router.use(authMiddleware);

router.get('/status-options', requireRole('admin', 'sales_manager', 'customer'), getOrderStatusOptionsController);
router.get(
  '/business-hours/current-status',
  requireRole('admin', 'sales_manager', 'customer'),
  getCurrentBusinessHourStatusController,
);
router.get('/business-hours', requireRole('admin', 'sales_manager', 'customer'), listBusinessHoursController);
router.patch('/business-hours/:dayOfWeek', requireRole('admin'), updateBusinessHourController);

router.post('/', requireRole('customer'), createOrderController);
router.get('/my', requireRole('customer'), listMyOrdersController);
router.get('/', requireRole('admin', 'sales_manager'), listOrdersController);
router.post('/:id/payment-proof', requireRole('customer'), paymentProofUpload.single('proof'), uploadOrderPaymentProofController);
router.get('/:id/payment-proof', requireRole('admin', 'sales_manager', 'customer'), getOrderPaymentProofController);
router.patch('/:id/status', requireRole('admin', 'sales_manager'), updateOrderStatusController);
router.patch('/:id/delivery-person', requireRole('admin', 'sales_manager'), updateDeliveryPersonController);
router.patch('/:id/cancel', requireRole('admin', 'sales_manager', 'customer'), cancelOrderController);
router.get('/:id', requireRole('admin', 'sales_manager', 'customer'), getOrderByIdController);

export default router;
