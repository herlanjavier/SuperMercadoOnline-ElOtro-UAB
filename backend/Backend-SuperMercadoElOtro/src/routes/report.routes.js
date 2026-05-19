import { Router } from 'express';
import {
  getDashboardSummaryController,
  getInventoryReportController,
  getInventoryReportPdfController,
  getSalesByDayReportController,
  getSalesReportController,
  getSalesReportPdfController,
  getTopProductsReportController,
} from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/sales', getSalesReportController);
router.get('/sales/pdf', getSalesReportPdfController);
router.get('/inventory', getInventoryReportController);
router.get('/inventory/pdf', getInventoryReportPdfController);
router.get('/dashboard-summary', getDashboardSummaryController);
router.get('/top-products', getTopProductsReportController);
router.get('/sales-by-day', getSalesByDayReportController);

export default router;
