import { Router, Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post('/register', registerValidation, (req: Request, res: Response) => {
  authController.register(req as any, res);
});

router.post('/login', loginValidation, (req: Request, res: Response) => {
  authController.login(req as any, res);
});

router.post('/logout', authenticate, (req: Request, res: Response) => {
  authController.logout(req as any, res);
});

router.post('/logout-all', authenticate, (req: Request, res: Response) => {
  authController.logoutAll(req as any, res);
});

router.post('/refresh-token', refreshTokenValidation, (req: Request, res: Response) => {
  authController.refreshToken(req as any, res);
});

router.get('/profile', authenticate, (req: Request, res: Response) => {
  authController.getProfile(req as any, res);
});

export default router;

