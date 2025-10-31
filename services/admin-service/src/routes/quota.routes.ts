import { Router, Request, Response } from 'express';
import { quotaController } from '../controllers/quota.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';
import {
  createQuotaValidation,
  updateQuotaValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  createQuotaValidation,
  (req: Request, res: Response) => {
    quotaController.createQuota(req as any, res);
  }
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    quotaController.getQuotas(req as any, res);
  }
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    quotaController.getQuota(req as any, res);
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  updateQuotaValidation,
  (req: Request, res: Response) => {
    quotaController.updateQuota(req as any, res);
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    quotaController.deleteQuota(req as any, res);
  }
);

export default router;

