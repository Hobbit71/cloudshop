import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../config/logger';
import { config } from '../config';
import { InventoryItem, LowStockAlert } from '../types';

export class SocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.socketio.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      // Subscribe to product inventory updates
      socket.on('subscribe:inventory', (data: { product_id: string; warehouse_id?: string }) => {
        if (data.warehouse_id) {
          socket.join(`inventory:${data.product_id}:${data.warehouse_id}`);
        } else {
          socket.join(`inventory:${data.product_id}`);
        }
        logger.debug('Client subscribed to inventory updates', {
          socketId: socket.id,
          product_id: data.product_id,
          warehouse_id: data.warehouse_id,
        });
      });

      // Subscribe to low stock alerts
      socket.on('subscribe:low-stock', (data?: { warehouse_id?: string }) => {
        if (data?.warehouse_id) {
          socket.join(`low-stock:${data.warehouse_id}`);
        } else {
          socket.join('low-stock:all');
        }
        logger.debug('Client subscribed to low stock alerts', {
          socketId: socket.id,
          warehouse_id: data?.warehouse_id,
        });
      });
    });

    logger.info('Socket.io server initialized');
  }

  emitInventoryUpdate(inventory: InventoryItem): void {
    if (!this.io) return;

    // Emit to specific product/warehouse room
    this.io.to(`inventory:${inventory.product_id}:${inventory.warehouse_id}`).emit(
      'inventory:update',
      inventory
    );

    // Emit to product room (all warehouses)
    this.io.to(`inventory:${inventory.product_id}`).emit('inventory:update', inventory);
  }

  emitLowStockAlert(alert: Omit<LowStockAlert, 'id' | 'created_at' | 'updated_at'>): void {
    if (!this.io) return;

    // Emit to specific warehouse room
    this.io.to(`low-stock:${alert.warehouse_id}`).emit('low-stock:alert', alert);

    // Emit to all low stock subscribers
    this.io.to('low-stock:all').emit('low-stock:alert', alert);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

