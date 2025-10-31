import { Router, Request, Response } from 'express';
import { healthController } from '../controllers/health.controller';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import merchantRoutes from './merchant.routes';
import configRoutes from './config.routes';
import auditRoutes from './audit.routes';
import quotaRoutes from './quota.routes';

const router = Router();

// Health check (no auth required)
router.get('/health', (req: Request, res: Response) => {
  healthController.check(req, res);
});

// API routes
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/merchants', merchantRoutes);
router.use('/config', configRoutes);
router.use('/audit', auditRoutes);
router.use('/quotas', quotaRoutes);

export default router;

