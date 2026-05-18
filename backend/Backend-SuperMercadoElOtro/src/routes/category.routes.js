import { Router } from 'express';
import {
  createCategoryController,
  deactivateCategoryController,
  listCategoriesController,
  updateCategoryController,
} from '../controllers/category.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import { attachProfileIfAuthenticated, requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', optionalAuthMiddleware, attachProfileIfAuthenticated, listCategoriesController);
router.use(authMiddleware);
router.post('/', requireRole('admin'), createCategoryController);
router.patch('/:id', requireRole('admin'), updateCategoryController);
router.delete('/:id', requireRole('admin'), deactivateCategoryController);

export default router;
