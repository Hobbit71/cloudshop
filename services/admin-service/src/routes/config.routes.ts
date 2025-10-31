import { Router, Request, Response } from 'express';
import { configController } from '../controllers/config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';
import {
  createConfigValidation,
  updateConfigValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  createConfigValidation,
  (req: Request, res: Response) => {
    configController.createConfig(req as any, res);
  }
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    configController.getConfigs(req as any, res);
  }
);

router.get(
  '/:key',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    configController.getConfig(req as any, res);
  }
);

router.put(
  '/:key',
  authenticate,
  requireAdmin,
  updateConfigValidation,
  (req: Request, res: Response) => {
    configController.updateConfig(req as any, res);
  }
);

router.delete(
  '/:key',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    configController.deleteConfig(req as any, res);
  }
);

export default router;

