import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import automationRoutes from './routes/automation.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import legalRoutes from './routes/legal.routes.js';
import consentRoutes from './routes/consent.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import staffRoutes from './routes/staff.routes.js';
import { openApiSpec } from './lib/openapi.js';
import { initPassport } from './lib/passport.js';
import passport from 'passport';

// Initialize automation event listeners
import './lib/events.js';

dotenv.config();

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check (before rate limiter so monitoring/readiness probes always work)
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  });

  // Rate limiting
  if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    });
    app.use('/api/', limiter);
  }

  // Stripe webhook needs raw body — register before JSON parser
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize passport for social login
  initPassport();
  app.use(passport.initialize());

  // Serve uploaded files
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KitchenAsty API Documentation',
  }));

  // OpenAPI spec endpoint
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/automation-rules', automationRoutes);
  app.use('/api/loyalty', loyaltyRoutes);
  app.use('/api/legal', legalRoutes);
  app.use('/api/consent', consentRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/staff', staffRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
    });
  });

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
  });

  return app;
}
