import { Router } from 'express';
import {
  createInventoryEntryController,
  getInventoryEntryByIdController,
  getInventorySummaryController,
  listInventoryEntriesController,
  listLowStockNotificationsController,
  listLowStockProductsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from '../controllers/inventory.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/entries', requireRole('admin', 'sales_manager'), listInventoryEntriesController);
router.get('/entries/:id', requireRole('admin', 'sales_manager'), getInventoryEntryByIdController);
router.post('/entries', requireRole('admin'), createInventoryEntryController);
router.get('/summary', requireRole('admin', 'sales_manager'), getInventorySummaryController);
router.get('/low-stock', requireRole('admin', 'sales_manager'), listLowStockProductsController);
router.get('/notifications', requireRole('admin'), listLowStockNotificationsController);
router.patch('/notifications/read-all', requireRole('admin'), markAllNotificationsAsReadController);
router.patch('/notifications/:id/read', requireRole('admin'), markNotificationAsReadController);

export default router;
