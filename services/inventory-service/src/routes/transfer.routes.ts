import { Router, Request, Response } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.middleware';

const router = Router();

export const createTransferRoutes = (controller: TransferController) => {
  // POST /api/v1/inventory/transfer
  router.post(
    '/',
    [
      body('product_id').isUUID().withMessage('product_id must be a valid UUID'),
      body('from_warehouse_id').isUUID().withMessage('from_warehouse_id must be a valid UUID'),
      body('to_warehouse_id').isUUID().withMessage('to_warehouse_id must be a valid UUID'),
      body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
      body('requested_by').optional().isUUID().withMessage('requested_by must be a valid UUID'),
      body('notes').optional().isString(),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.createTransfer(req as any, res);
    }
  );

  // POST /api/v1/inventory/transfer/{id}/start
  router.post(
    '/:id/start',
    [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.startTransfer(req as any, res);
    }
  );

  // POST /api/v1/inventory/transfer/{id}/complete
  router.post(
    '/:id/complete',
    [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.completeTransfer(req as any, res);
    }
  );

  // POST /api/v1/inventory/transfer/{id}/cancel
  router.post(
    '/:id/cancel',
    [
      param('id').isUUID().withMessage('id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.cancelTransfer(req as any, res);
    }
  );

  return router;
};

