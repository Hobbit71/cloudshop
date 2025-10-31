import { Router, Request, Response } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.middleware';

const router = Router();

export const createReservationRoutes = (controller: ReservationController) => {
  // POST /api/v1/inventory/reserve
  router.post(
    '/',
    [
      body('product_id').isUUID().withMessage('product_id must be a valid UUID'),
      body('warehouse_id').isUUID().withMessage('warehouse_id must be a valid UUID'),
      body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
      body('order_id').optional().isUUID().withMessage('order_id must be a valid UUID'),
      body('session_id').optional().isString(),
      body('expires_in').optional().isInt({ min: 1 }).withMessage('expires_in must be a positive integer'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.createReservation(req as any, res);
    }
  );

  // POST /api/v1/inventory/reserve/{id}/confirm
  router.post(
    '/:id/confirm',
    [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.confirmReservation(req as any, res);
    }
  );

  // POST /api/v1/inventory/reserve/{id}/release
  router.post(
    '/:id/release',
    [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.releaseReservation(req as any, res);
    }
  );

  return router;
};

