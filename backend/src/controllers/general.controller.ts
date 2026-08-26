import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { notificationService } from '../services/notification.service';
import { AppError } from '../middleware/error.middleware';

export const getHealth = (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'cloudcampus-backend',
    timestamp: new Date().toISOString(),
  });
};

export const getTestProtected = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Cognito authenticated test route verified',
  });
};

export const getDatabaseHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Perform simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    });
  } catch (error) {
    next(new AppError('Database connection failed', 500, 'DATABASE_UNAVAILABLE'));
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.getNotifications(userId, unreadOnly);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    await notificationService.markAsRead(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
