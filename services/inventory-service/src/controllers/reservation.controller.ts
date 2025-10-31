import { Response } from 'express';
import { ExpressRequest } from '../types';
import { ReservationService } from '../services/reservation.service';

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  async createReservation(req: ExpressRequest, res: Response): Promise<void> {
    const reservation = await this.reservationService.createReservation(req.body);

    res.status(201).json({
      message: 'Stock reserved successfully',
      data: reservation,
    });
  }

  async confirmReservation(req: ExpressRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const reservation = await this.reservationService.confirmReservation(id);

    res.json({
      message: 'Reservation confirmed successfully',
      data: reservation,
    });
  }

  async releaseReservation(req: ExpressRequest, res: Response): Promise<void> {
    const { id } = req.params;

    await this.reservationService.releaseReservation(id);

    res.json({
      message: 'Reservation released successfully',
    });
  }
}

