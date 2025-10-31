import { Router } from 'express';
import authRoutes from './auth.routes';
import mfaRoutes from './mfa.routes';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  healthController.check(req, res);
});

// Auth routes
router.use('/auth', authRoutes);

// MFA routes
router.use('/auth/mfa', mfaRoutes);

export default router;

