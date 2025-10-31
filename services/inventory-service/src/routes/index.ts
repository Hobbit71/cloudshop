import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { InventoryController } from '../controllers/inventory.controller';
import { ReservationController } from '../controllers/reservation.controller';
import { TransferController } from '../controllers/transfer.controller';
import { createInventoryRoutes } from './inventory.routes';
import { createReservationRoutes } from './reservation.routes';
import { createTransferRoutes } from './transfer.routes';

export const createRoutes = (
  inventoryController: InventoryController,
  reservationController: ReservationController,
  transferController: TransferController
): Router => {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    healthController.check(req, res);
  });

  // API routes
  const apiRouter = Router();

  // Inventory routes
  apiRouter.use('/inventory', createInventoryRoutes(inventoryController));

  // Reservation routes
  apiRouter.use('/inventory/reserve', createReservationRoutes(reservationController));

  // Transfer routes
  apiRouter.use('/inventory/transfer', createTransferRoutes(transferController));

  router.use('/api/v1', apiRouter);

  return router;
};

