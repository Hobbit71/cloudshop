import logger from '../config/logger';
import { getPool } from '../config/database';
import { ReservationRepository } from './repository/reservation.repository';
import { InventoryService } from './inventory.service';
import { config } from '../config';
import { ReserveInventoryRequest, Reservation } from '../types';
import { NotFoundError, ValidationError, InsufficientStockError } from '../utils/errors';
import { SocketService } from './socket.service';

export class ReservationService {
  private reservationRepo: ReservationRepository;
  private inventoryService: InventoryService;

  constructor(inventoryService: InventoryService, _socketService: SocketService) {
    this.reservationRepo = new ReservationRepository(getPool());
    this.inventoryService = inventoryService;
  }

  async createReservation(data: ReserveInventoryRequest): Promise<Reservation> {
    const expiresIn = data.expires_in || config.inventory.reservationTtl;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Reserve stock in inventory
    try {
      await this.inventoryService.reserveStock(
        data.product_id,
        data.warehouse_id,
        data.quantity
      );
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw error;
      }
      throw new InsufficientStockError('Failed to reserve stock');
    }

    // Create reservation record
    const reservation = await this.reservationRepo.create({
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      quantity: data.quantity,
      order_id: data.order_id,
      session_id: data.session_id,
      expires_at: expiresAt,
    });

    logger.info('Stock reservation created', {
      reservation_id: reservation.id,
      product_id: data.product_id,
      quantity: data.quantity,
    });

    return reservation;
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepo.findById(reservationId);
    
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'pending') {
      throw new ValidationError('Reservation is not in pending status');
    }

    const updated = await this.reservationRepo.updateStatus(reservationId, 'confirmed');

    logger.info('Reservation confirmed', { reservation_id: reservationId });

    return updated;
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepo.findById(reservationId);
    
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status === 'released') {
      return; // Already released
    }

    // Release stock back to inventory
    await this.inventoryService.releaseReservation(
      reservation.product_id,
      reservation.warehouse_id,
      reservation.quantity
    );

    // Update reservation status
    await this.reservationRepo.updateStatus(reservationId, 'released');

    logger.info('Reservation released', { reservation_id: reservationId });
  }

  async releaseExpiredReservations(): Promise<number> {
    const expired = await this.reservationRepo.findExpired();
    let releasedCount = 0;

    for (const reservation of expired) {
      try {
        await this.releaseReservation(reservation.id);
        await this.reservationRepo.updateStatus(reservation.id, 'expired');
        releasedCount++;
      } catch (error) {
        logger.error('Failed to release expired reservation', {
          reservation_id: reservation.id,
          error,
        });
      }
    }

    logger.info('Expired reservations released', { count: releasedCount });

    return releasedCount;
  }

  async releaseByOrderId(orderId: string): Promise<void> {
    const reservations = await this.reservationRepo.findByOrderId(orderId);

    for (const reservation of reservations) {
      await this.releaseReservation(reservation.id);
    }
  }

  async releaseBySessionId(sessionId: string): Promise<void> {
    const reservations = await this.reservationRepo.findBySessionId(sessionId);

    for (const reservation of reservations) {
      await this.releaseReservation(reservation.id);
    }
  }
}

