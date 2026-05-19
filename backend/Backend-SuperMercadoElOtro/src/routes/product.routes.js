import { Router } from 'express';
import multer from 'multer';
import {
  createProductController,
  deactivateProductController,
  getProductByIdController,
  listProductsController,
  removeProductImageController,
  restoreProductController,
  updateProductController,
} from '../controllers/product.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import { attachProfileIfAuthenticated, requireRole } from '../middlewares/role.middleware.js';
import { AppError } from '../utils/AppError.js';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      cb(new AppError('Solo se permiten imagenes JPEG, PNG o WEBP', 400));
      return;
    }

    cb(null, true);
  },
});

const router = Router();

router.get('/', optionalAuthMiddleware, attachProfileIfAuthenticated, listProductsController);
router.get('/:id', optionalAuthMiddleware, attachProfileIfAuthenticated, getProductByIdController);
router.use(authMiddleware);
router.post('/', requireRole('admin'), upload.single('image'), createProductController);
router.patch('/:id', requireRole('admin'), upload.single('image'), updateProductController);
router.delete('/:id', requireRole('admin'), deactivateProductController);
router.patch('/:id/restore', requireRole('admin'), restoreProductController);
router.delete('/:id/image', requireRole('admin'), removeProductImageController);

export default router;
