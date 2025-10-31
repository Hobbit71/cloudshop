import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post('/register', registerValidation, (req, res) => {
  authController.register(req as any, res);
});

router.post('/login', loginValidation, (req, res) => {
  authController.login(req as any, res);
});

router.post('/logout', authenticate, (req, res) => {
  authController.logout(req as any, res);
});

router.post('/logout-all', authenticate, (req, res) => {
  authController.logoutAll(req as any, res);
});

router.post('/refresh-token', refreshTokenValidation, (req, res) => {
  authController.refreshToken(req as any, res);
});

router.get('/profile', authenticate, (req, res) => {
  authController.getProfile(req as any, res);
});

export default router;

