import logger from '../config/logger';
import { getPool } from '../config/database';
import { TransferRepository } from './repository/transfer.repository';
import { InventoryService } from './inventory.service';
import { TransferInventoryRequest, Transfer } from '../types';
import { NotFoundError, ValidationError, InsufficientStockError } from '../utils/errors';
import { SocketService } from './socket.service';

export class TransferService {
  private transferRepo: TransferRepository;
  private inventoryService: InventoryService;

  constructor(inventoryService: InventoryService, _socketService: SocketService) {
    this.transferRepo = new TransferRepository(getPool());
    this.inventoryService = inventoryService;
  }

  async createTransfer(data: TransferInventoryRequest): Promise<Transfer> {
    if (data.from_warehouse_id === data.to_warehouse_id) {
      throw new ValidationError('Source and destination warehouses cannot be the same');
    }

    // Check if source warehouse has enough stock
    const sourceInventory = await this.inventoryService.getInventory(
      data.product_id,
      data.from_warehouse_id
    );

    if (sourceInventory.length === 0 || sourceInventory[0].available_quantity < data.quantity) {
      throw new InsufficientStockError(
        'Insufficient stock in source warehouse for transfer'
      );
    }

    const transfer = await this.transferRepo.create({
      product_id: data.product_id,
      from_warehouse_id: data.from_warehouse_id,
      to_warehouse_id: data.to_warehouse_id,
      quantity: data.quantity,
      requested_by: data.requested_by,
      notes: data.notes,
    });

    logger.info('Transfer created', {
      transfer_id: transfer.id,
      product_id: data.product_id,
      quantity: data.quantity,
    });

    return transfer;
  }

  async startTransfer(transferId: string): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    
    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new ValidationError('Transfer is not in pending status');
    }

    // Reserve stock from source warehouse
    await this.inventoryService.reserveStock(
      transfer.product_id,
      transfer.from_warehouse_id,
      transfer.quantity
    );

    const updated = await this.transferRepo.updateStatus(transferId, 'in_transit');

    logger.info('Transfer started', { transfer_id: transferId });

    return updated;
  }

  async completeTransfer(transferId: string): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    
    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    if (transfer.status !== 'in_transit') {
      throw new ValidationError('Transfer is not in transit');
    }

    // Release from source warehouse (quantity was already reserved)
    await this.inventoryService.releaseReservation(
      transfer.product_id,
      transfer.from_warehouse_id,
      transfer.quantity
    );

    // Add to destination warehouse
    try {
      const destInventory = await this.inventoryService.getInventory(
        transfer.product_id,
        transfer.to_warehouse_id
      );

      if (destInventory.length > 0) {
        await this.inventoryService.updateInventory(
          transfer.product_id,
          transfer.to_warehouse_id,
          { quantity: destInventory[0].quantity + transfer.quantity }
        );
      } else {
        // Create inventory if it doesn't exist
        await this.inventoryService.createInventory({
          product_id: transfer.product_id,
          warehouse_id: transfer.to_warehouse_id,
          quantity: transfer.quantity,
        });
      }
    } catch (error) {
      // If destination update fails, reserve again in source
      await this.inventoryService.reserveStock(
        transfer.product_id,
        transfer.from_warehouse_id,
        transfer.quantity
      );
      throw error;
    }

    const updated = await this.transferRepo.updateStatus(transferId, 'completed');

    logger.info('Transfer completed', { transfer_id: transferId });

    return updated;
  }

  async cancelTransfer(transferId: string): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    
    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    if (transfer.status === 'completed') {
      throw new ValidationError('Cannot cancel a completed transfer');
    }

    // If in transit, release the reserved stock
    if (transfer.status === 'in_transit') {
      await this.inventoryService.releaseReservation(
        transfer.product_id,
        transfer.from_warehouse_id,
        transfer.quantity
      );
    }

    const updated = await this.transferRepo.updateStatus(transferId, 'cancelled');

    logger.info('Transfer cancelled', { transfer_id: transferId });

    return updated;
  }
}

