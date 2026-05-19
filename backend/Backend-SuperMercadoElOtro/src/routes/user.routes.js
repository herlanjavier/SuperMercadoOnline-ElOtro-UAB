import { Router } from 'express';
import {
  createSalesManagerController,
  deactivateUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/sales-managers', requireRole('admin'), createSalesManagerController);
router.get('/', requireRole('admin'), listUsersController);
router.get('/:id', requireRole('admin', 'sales_manager', 'customer'), getUserByIdController);
router.patch('/:id', requireRole('admin', 'sales_manager', 'customer'), updateUserController);
router.patch('/:id/deactivate', requireRole('admin'), deactivateUserController);

export default router;
