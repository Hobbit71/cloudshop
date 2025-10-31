import { Response } from 'express';
import { ExpressRequest } from '../types';
import { InventoryService } from '../services/inventory.service';
import { NotFoundError } from '../utils/errors';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  async getInventory(req: ExpressRequest, res: Response): Promise<void> {
    const { product_id } = req.params;
    const warehouse_id = req.query.warehouse_id as string | undefined;

    const inventory = await this.inventoryService.getInventory(product_id, warehouse_id);

    if (inventory.length === 0) {
      throw new NotFoundError('Inventory not found');
    }

    res.json({
      message: 'Inventory retrieved successfully',
      data: inventory.length === 1 ? inventory[0] : inventory,
    });
  }

  async getInventoryByBarcode(req: ExpressRequest, res: Response): Promise<void> {
    const { barcode } = req.params;

    const inventory = await this.inventoryService.getInventoryByBarcode(barcode);

    if (!inventory) {
      throw new NotFoundError('Inventory not found for barcode');
    }

    res.json({
      message: 'Inventory retrieved successfully',
      data: inventory,
    });
  }

  async updateInventory(req: ExpressRequest, res: Response): Promise<void> {
    const { product_id } = req.params;
    const warehouse_id = req.query.warehouse_id as string | undefined;

    if (!warehouse_id) {
      res.status(400).json({
        error: {
          message: 'warehouse_id query parameter is required',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        },
      });
      return;
    }

    const inventory = await this.inventoryService.updateInventory(
      product_id,
      warehouse_id,
      req.body
    );

    res.json({
      message: 'Inventory updated successfully',
      data: inventory,
    });
  }

  async getLowStock(req: ExpressRequest, res: Response): Promise<void> {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string, 10)
      : undefined;
    const warehouse_id = req.query.warehouse_id as string | undefined;

    const lowStockItems = await this.inventoryService.getLowStockItems(threshold, warehouse_id);

    res.json({
      message: 'Low stock items retrieved successfully',
      data: lowStockItems,
      count: lowStockItems.length,
    });
  }
}

