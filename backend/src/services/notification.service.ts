import prisma from '../config/db';
import { NotificationType } from '@prisma/client';

export interface NotificationService {
  sendNotification(userId: string, title: string, message: string, type: NotificationType): Promise<any>;
  markAsRead(notificationId: string, userId: string): Promise<any>;
  markAllAsRead(userId: string): Promise<any>;
  getNotifications(userId: string, unreadOnly?: boolean): Promise<any[]>;
}

export class DatabaseNotificationService implements NotificationService {
  async sendNotification(userId: string, title: string, message: string, type: NotificationType): Promise<any> {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getNotifications(userId: string, unreadOnly = false): Promise<any[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const notificationService: NotificationService = new DatabaseNotificationService();
