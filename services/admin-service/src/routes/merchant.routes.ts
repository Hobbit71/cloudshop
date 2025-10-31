import { Router, Request, Response } from 'express';
import { merchantController } from '../controllers/merchant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin, requireModerator } from '../middleware/authorization.middleware';
import {
  createMerchantValidation,
  updateMerchantValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  createMerchantValidation,
  (req: Request, res: Response) => {
    merchantController.createMerchant(req as any, res);
  }
);

router.get(
  '/',
  authenticate,
  requireModerator,
  (req: Request, res: Response) => {
    merchantController.getMerchants(req as any, res);
  }
);

router.get(
  '/:id',
  authenticate,
  requireModerator,
  (req: Request, res: Response) => {
    merchantController.getMerchant(req as any, res);
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  updateMerchantValidation,
  (req: Request, res: Response) => {
    merchantController.updateMerchant(req as any, res);
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    merchantController.deleteMerchant(req as any, res);
  }
);

export default router;

