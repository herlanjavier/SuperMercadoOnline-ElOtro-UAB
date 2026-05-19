import { Router } from 'express';
import {
  getSaleByIdController,
  getSaleByOrderIdController,
  getSaleReceiptController,
  getSaleReceiptPdfController,
  listSalesController,
} from '../controllers/sale.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('admin', 'sales_manager'), listSalesController);
router.get('/order/:orderId', requireRole('admin', 'sales_manager', 'customer'), getSaleByOrderIdController);
router.get('/:id/receipt/pdf', requireRole('admin', 'sales_manager', 'customer'), getSaleReceiptPdfController);
router.get('/:id/receipt', requireRole('admin', 'sales_manager', 'customer'), getSaleReceiptController);
router.get('/:id', requireRole('admin', 'sales_manager', 'customer'), getSaleByIdController);

export default router;
