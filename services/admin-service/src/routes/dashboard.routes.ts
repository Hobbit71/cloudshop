import { Router, Request, Response } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';

const router = Router();

router.get(
  '/metrics',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    dashboardController.getMetrics(req as any, res);
  }
);

export default router;

