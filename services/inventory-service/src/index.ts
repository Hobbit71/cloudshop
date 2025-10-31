import express, { Express } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { createPool } from './config/database';
import { createRedisClient } from './config/redis';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { createRoutes } from './routes';
import { InventoryService } from './services/inventory.service';
import { ReservationService } from './services/reservation.service';
import { TransferService } from './services/transfer.service';
import { SocketService } from './services/socket.service';
import { InventoryController } from './controllers/inventory.controller';
import { ReservationController } from './controllers/reservation.controller';
import { TransferController } from './controllers/transfer.controller';

const app: Express = express();
const httpServer: HTTPServer = createServer(app);

// Initialize Socket.io service
const socketService = new SocketService();
socketService.initialize(httpServer);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Initialize services
const inventoryService = new InventoryService(socketService);
const reservationService = new ReservationService(inventoryService, socketService);
const transferService = new TransferService(inventoryService, socketService);

// Initialize controllers
const inventoryController = new InventoryController(inventoryService);
const reservationController = new ReservationController(reservationService);
const transferController = new TransferController(transferService);

// Routes
app.use(
  '/',
  createRoutes(inventoryController, reservationController, transferController)
);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    createPool({
      ...config.database,
      database: config.database.name,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for connection

    // Initialize Redis
    logger.info('Initializing Redis connection...');
    await createRedisClient(config.redis);

    // Start cleanup interval for expired reservations (every 5 minutes)
    setInterval(async () => {
      try {
        await reservationService.releaseExpiredReservations();
      } catch (error) {
        logger.error('Failed to release expired reservations', error);
      }
    }, 5 * 60 * 1000);

    // Start server
    httpServer.listen(config.port, config.host, () => {
      logger.info(`Inventory service listening on ${config.host}:${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Socket.io server initialized`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');

  try {
    const { closePool } = await import('./config/database');
    const { closeRedisClient } = await import('./config/redis');

    await closePool();
    await closeRedisClient();

    httpServer.close(() => {
      logger.info('Shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;

