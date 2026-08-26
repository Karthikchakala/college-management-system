import { Router } from 'express';
import {
  getHealth,
  getDatabaseHealth,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getTestProtected,
} from '../controllers/general.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Unauthenticated health endpoints
router.get('/health', getHealth);
router.get('/health/database', getDatabaseHealth);

// Authenticated test endpoint (mapped for API Gateway verification)
router.get('/test', authenticate, getTestProtected);

// Authenticated notification endpoints
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.post('/notifications/read-all', authenticate, markAllNotificationsRead);

export default router;
