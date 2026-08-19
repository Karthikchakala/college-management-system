import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        faculty: true,
      },
    });

    if (!user || user.status === 'INACTIVE') {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'User',
        resourceId: user.id,
      },
    });

    // Determine target profile detail
    let name = 'Admin User';
    let profileId = null;
    if (user.role === 'STUDENT' && user.student) {
      name = `${user.student.firstName} ${user.student.lastName}`;
      profileId = user.student.id;
    } else if (user.role === 'FACULTY' && user.faculty) {
      name = `${user.faculty.firstName} ${user.faculty.lastName}`;
      profileId = user.faculty.id;
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          profileId,
          email: user.email,
          role: user.role,
          name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not found in request', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        student: {
          include: { department: true },
        },
        faculty: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
