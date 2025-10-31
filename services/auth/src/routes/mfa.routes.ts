import { Router, Request, Response } from 'express';
import { mfaController } from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  mfaSetupValidation,
  mfaVerifyValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post('/setup', authenticate, mfaSetupValidation, (req: Request, res: Response) => {
  mfaController.setup(req as any, res);
});

router.post('/verify', authenticate, mfaVerifyValidation, (req: Request, res: Response) => {
  mfaController.verify(req as any, res);
});

router.post('/disable', authenticate, (req: Request, res: Response) => {
  mfaController.disable(req as any, res);
});

router.get('/status', authenticate, (req: Request, res: Response) => {
  mfaController.status(req as any, res);
});

export default router;

