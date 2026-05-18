import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import healthRoutes from './health.routes.js';
import inventoryRoutes from './inventory.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import productRoutes from './product.routes.js';
import reportRoutes from './report.routes.js';
import saleRoutes from './sale.routes.js';
import supplierRoutes from './supplier.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);

export default router;
