import logger from '../config/logger';
import { getPool } from '../config/database';
import { getRedisClient } from '../config/redis';
import { InventoryRepository } from './repository/inventory.repository';
import { LowStockAlertRepository } from './repository/lowstock.repository';
import {
  InventoryItem,
  CreateInventoryRequest,
  UpdateInventoryRequest,
} from '../types';
import { NotFoundError, InsufficientStockError, ValidationError } from '../utils/errors';
import { SocketService } from './socket.service';

export class InventoryService {
  private inventoryRepo: InventoryRepository;
  private lowStockRepo: LowStockAlertRepository;
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    this.inventoryRepo = new InventoryRepository(getPool());
    this.lowStockRepo = new LowStockAlertRepository(getPool());
    this.socketService = socketService;
  }

  async getInventory(productId: string, warehouseId?: string): Promise<InventoryItem[]> {
    if (warehouseId) {
      const item = await this.inventoryRepo.findByProductAndWarehouse(productId, warehouseId);
      return item ? [item] : [];
    }
    return await this.inventoryRepo.findByProductId(productId);
  }

  async getInventoryByBarcode(barcode: string): Promise<InventoryItem | null> {
    return await this.inventoryRepo.findByBarcode(barcode);
  }

  async createInventory(data: CreateInventoryRequest): Promise<InventoryItem> {
    // Check if inventory already exists
    const existing = await this.inventoryRepo.findByProductAndWarehouse(
      data.product_id,
      data.warehouse_id
    );

    if (existing) {
      throw new ValidationError('Inventory already exists for this product and warehouse');
    }

    const inventory = await this.inventoryRepo.create(data);

    // Add history entry
    await this.inventoryRepo.addHistory({
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      quantity: data.quantity,
      change_type: 'restock',
      quantity_change: data.quantity,
      notes: 'Initial inventory creation',
    });

    // Check for low stock
    await this.checkLowStock(data.product_id, data.warehouse_id);

    // Emit real-time update
    this.socketService.emitInventoryUpdate(inventory);

    // Update Redis cache
    await this.updateCache(inventory);

    return inventory;
  }

  async updateInventory(
    productId: string,
    warehouseId: string,
    data: UpdateInventoryRequest
  ): Promise<InventoryItem> {
    const existing = await this.inventoryRepo.findByProductAndWarehouse(productId, warehouseId);
    
    if (!existing) {
      throw new NotFoundError('Inventory item not found');
    }

    const oldQuantity = existing.quantity;
    const inventory = await this.inventoryRepo.update(productId, warehouseId, data);

    // Add history entry if quantity changed
    if (data.quantity !== undefined && data.quantity !== oldQuantity) {
      const quantityChange = data.quantity - oldQuantity;
      await this.inventoryRepo.addHistory({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: data.quantity,
        change_type: 'adjustment',
        quantity_change: quantityChange,
        notes: `Manual inventory adjustment`,
      });
    }

    // Check for low stock
    await this.checkLowStock(productId, warehouseId);

    // Emit real-time update
    this.socketService.emitInventoryUpdate(inventory);

    // Update Redis cache
    await this.updateCache(inventory);

    return inventory;
  }

  async reserveStock(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<InventoryItem> {
    try {
      const inventory = await this.inventoryRepo.reserveStock(
        productId,
        warehouseId,
        quantity
      );

      // Add history entry
      await this.inventoryRepo.addHistory({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: inventory.quantity,
        change_type: 'reservation',
        quantity_change: -quantity,
        notes: `Stock reserved: ${quantity} units`,
      });

      // Emit real-time update
      this.socketService.emitInventoryUpdate(inventory);

      // Update Redis cache
      await this.updateCache(inventory);

      return inventory;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new InsufficientStockError('Insufficient stock available for reservation');
      }
      throw error;
    }
  }

  async releaseReservation(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<InventoryItem> {
    const inventory = await this.inventoryRepo.releaseReservation(
      productId,
      warehouseId,
      quantity
    );

    // Add history entry
    await this.inventoryRepo.addHistory({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: inventory.quantity,
      change_type: 'release',
      quantity_change: quantity,
      notes: `Reservation released: ${quantity} units`,
    });

    // Emit real-time update
    this.socketService.emitInventoryUpdate(inventory);

    // Update Redis cache
    await this.updateCache(inventory);

    return inventory;
  }

  async getLowStockItems(threshold?: number, warehouseId?: string): Promise<InventoryItem[]> {
    return await this.inventoryRepo.getLowStockItems(threshold, warehouseId);
  }

  private async checkLowStock(productId: string, warehouseId: string): Promise<void> {
    const inventory = await this.inventoryRepo.findByProductAndWarehouse(productId, warehouseId);
    
    if (!inventory) return;

    if (inventory.available_quantity <= inventory.reorder_point) {
      // Check if alert already exists
      const alerts = await this.lowStockRepo.findActive(warehouseId);
      const existingAlert = alerts.find(
        (a) => a.product_id === productId && a.warehouse_id === warehouseId
      );

      if (!existingAlert) {
        await this.lowStockRepo.create({
          product_id: productId,
          warehouse_id: warehouseId,
          current_quantity: inventory.available_quantity,
          reorder_point: inventory.reorder_point,
        });

        // Emit low stock alert
        this.socketService.emitLowStockAlert({
          product_id: productId,
          warehouse_id: warehouseId,
          current_quantity: inventory.available_quantity,
          reorder_point: inventory.reorder_point,
        });
      }
    }
  }

  private async updateCache(inventory: InventoryItem): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `inventory:${inventory.product_id}:${inventory.warehouse_id}`;
      await redis.setEx(key, 3600, JSON.stringify(inventory)); // Cache for 1 hour
    } catch (error) {
      logger.warn('Failed to update Redis cache', error);
    }
  }
}

