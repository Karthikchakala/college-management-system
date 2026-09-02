import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from './config/swagger';
import prisma, { initDatabase } from './config/db';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import facultyRoutes from './routes/faculty.routes';
import generalRoutes from './routes/general.routes';
import { getHealth } from './controllers/general.controller';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

const app = express();

// Trust proxy for API Gateway / Reverse Proxy forwarded headers
app.set('trust proxy', true);

// Secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com',
  'http://cloudcampus-frontend-production.s3-website.us-east-1.amazonaws.com',
];

const envAllowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or local dev/test requests without origin
    if (!origin || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    try {
      const parsedUrl = new URL(origin);
      if (
        parsedUrl.hostname.endsWith('.cloudfront.net') ||
        parsedUrl.hostname.endsWith('.s3-website-us-east-1.amazonaws.com') ||
        parsedUrl.hostname.endsWith('.s3-website.us-east-1.amazonaws.com')
      ) {
        return callback(null, true);
      }
    } catch (_) {}
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Request-Id'],
}));

// CloudWatch structured logging
app.use(requestLogger);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Direct root health endpoint for API Gateway / Load Balancer / Monitoring
app.get('/health', getHealth);

// Static file serving for local development uploads
if (process.env.NODE_ENV !== 'production' && process.env.STORAGE_PROVIDER !== 's3') {
  app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
}

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api', generalRoutes);

// Fallback Page Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Listen Handler with graceful shutdown
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('[CloudCampus Server] Resolving database credentials from AWS Secrets Manager...');
      }
      await initDatabase();
      if (process.env.NODE_ENV === 'production') {
        console.log('[CloudCampus Server] Database credentials resolved successfully.');
      }

      const server = app.listen(PORT, HOST, () => {
        console.log(`[CloudCampus Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
        console.log(`[CloudCampus Server] Health endpoint available at http://${HOST}:${PORT}/health`);
      });

      // Graceful Shutdown on SIGTERM/SIGINT
      const gracefulShutdown = async (signal: string) => {
        console.log(`[CloudCampus Server] Received ${signal}. Starting graceful shutdown...`);
        server.close(async () => {
          console.log('[CloudCampus Server] HTTP server closed.');
          try {
            await prisma.$disconnect();
            console.log('[CloudCampus Server] Prisma database connection closed.');
          } catch (dbError) {
            console.error('[CloudCampus Server] Error disconnecting database:', dbError);
          }
          process.exit(0);
        });

        // Force shutdown after 10s if connections linger
        setTimeout(() => {
          console.error('[CloudCampus Server] Forcefully shutting down due to timeout.');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (startupError: any) {
      console.error('[CloudCampus Server] Startup initialization failed:', startupError.message);
      process.exit(1);
    }
  })();
}

export default app;
