import { Router, Request, Response } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.middleware';

const router = Router();

export const createInventoryRoutes = (controller: InventoryController) => {
  // GET /api/v1/inventory/{product_id}
  router.get(
    '/:product_id',
    [
      param('product_id').isUUID().withMessage('product_id must be a valid UUID'),
      query('warehouse_id').optional().isUUID().withMessage('warehouse_id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.getInventory(req as any, res);
    }
  );

  // GET /api/v1/inventory/barcode/{barcode}
  router.get(
    '/barcode/:barcode',
    [
      param('barcode').notEmpty().withMessage('barcode is required'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.getInventoryByBarcode(req as any, res);
    }
  );

  // PUT /api/v1/inventory/{product_id}
  router.put(
    '/:product_id',
    [
      param('product_id').isUUID().withMessage('product_id must be a valid UUID'),
      query('warehouse_id').isUUID().withMessage('warehouse_id query parameter is required'),
      body('quantity').optional().isInt({ min: 0 }).withMessage('quantity must be a non-negative integer'),
      body('barcode').optional().isString(),
      body('location').optional().isString(),
      body('reorder_point').optional().isInt({ min: 0 }).withMessage('reorder_point must be a non-negative integer'),
      body('max_stock').optional().isInt({ min: 0 }).withMessage('max_stock must be a non-negative integer'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.updateInventory(req as any, res);
    }
  );

  // GET /api/v1/inventory/low-stock
  router.get(
    '/low-stock',
    [
      query('threshold').optional().isInt({ min: 0 }).withMessage('threshold must be a non-negative integer'),
      query('warehouse_id').optional().isUUID().withMessage('warehouse_id must be a valid UUID'),
      validate,
    ],
    (req: Request, res: Response) => {
      controller.getLowStock(req as any, res);
    }
  );

  return router;
};

