import { Router } from 'express';
import {
  addSupplierProductsController,
  createSupplierController,
  deactivateSupplierController,
  getSupplierByIdController,
  listSuppliersController,
  removeSupplierProductController,
  restoreSupplierController,
  updateSupplierController,
} from '../controllers/supplier.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', listSuppliersController);
router.post('/', createSupplierController);
router.patch('/:id/restore', restoreSupplierController);
router.post('/:id/products', addSupplierProductsController);
router.delete('/:id/products/:productId', removeSupplierProductController);
router.get('/:id', getSupplierByIdController);
router.patch('/:id', updateSupplierController);
router.delete('/:id', deactivateSupplierController);

export default router;
