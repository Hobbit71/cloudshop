import { Response } from 'express';
import { ExpressRequest } from '../types';
import { TransferService } from '../services/transfer.service';

export class TransferController {
  constructor(private transferService: TransferService) {}

  async createTransfer(req: ExpressRequest, res: Response): Promise<void> {
    const transfer = await this.transferService.createTransfer(req.body);

    res.status(201).json({
      message: 'Transfer created successfully',
      data: transfer,
    });
  }

  async startTransfer(req: ExpressRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const transfer = await this.transferService.startTransfer(id);

    res.json({
      message: 'Transfer started successfully',
      data: transfer,
    });
  }

  async completeTransfer(req: ExpressRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const transfer = await this.transferService.completeTransfer(id);

    res.json({
      message: 'Transfer completed successfully',
      data: transfer,
    });
  }

  async cancelTransfer(req: ExpressRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const transfer = await this.transferService.cancelTransfer(id);

    res.json({
      message: 'Transfer cancelled successfully',
      data: transfer,
    });
  }
}

