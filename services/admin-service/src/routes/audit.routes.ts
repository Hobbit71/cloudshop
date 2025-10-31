import { Router, Request, Response } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    auditController.getAuditLogs(req as any, res);
  }
);

router.get(
  '/stats',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    auditController.getAuditStats(req as any, res);
  }
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    auditController.getAuditLog(req as any, res);
  }
);

export default router;

