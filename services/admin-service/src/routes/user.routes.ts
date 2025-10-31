import { Router, Request, Response } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';
import {
  createUserValidation,
  updateUserValidation,
} from '../middleware/validator.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  createUserValidation,
  (req: Request, res: Response) => {
    userController.createUser(req as any, res);
  }
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    userController.getUsers(req as any, res);
  }
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    userController.getUser(req as any, res);
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  updateUserValidation,
  (req: Request, res: Response) => {
    userController.updateUser(req as any, res);
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => {
    userController.deleteUser(req as any, res);
  }
);

export default router;

