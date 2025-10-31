import { Router } from 'express';
import { mfaController } from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  mfaSetupValidation,
  mfaVerifyValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post('/setup', authenticate, mfaSetupValidation, (req, res) => {
  mfaController.setup(req as any, res);
});

router.post('/verify', authenticate, mfaVerifyValidation, (req, res) => {
  mfaController.verify(req as any, res);
});

router.post('/disable', authenticate, (req, res) => {
  mfaController.disable(req as any, res);
});

router.get('/status', authenticate, (req, res) => {
  mfaController.status(req as any, res);
});

export default router;

