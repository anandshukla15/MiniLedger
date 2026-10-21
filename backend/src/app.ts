import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import { LoanController } from './controllers/loan.controller';
import { authenticateToken } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

export const createApp = (): Application => {
  const app: Application = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Static files for uploaded receipt photos
  app.use('/uploads', express.static(config.uploadDir));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'MiniLedger API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);

  // Direct summary endpoint alias: /api/summary
  app.get('/api/summary', authenticateToken, LoanController.getSummary);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
