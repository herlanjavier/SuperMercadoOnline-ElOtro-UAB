import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  registerCustomerController,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register-customer', registerCustomerController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/me', authMiddleware, meController);

export default router;
