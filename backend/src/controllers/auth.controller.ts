import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authService } from '../services/auth.service';
import { cognitoService } from '../services/cognito.service';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const linkCognitoSchema = z.object({
  body: z.object({
    idToken: z.string().min(10, 'idToken must be a valid JWT string'),
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

export const linkCognitoAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      throw new AppError('idToken is required for Cognito account linking', 400, 'BAD_REQUEST');
    }

    // Cryptographically verify Cognito token using CognitoJwtVerifier
    const cognitoUser = await cognitoService.verifyCognitoToken(idToken);

    if (!cognitoUser.email) {
      throw new AppError('Cognito token is missing verified email claim', 400, 'MISSING_EMAIL_CLAIM');
    }

    if (!cognitoUser.emailVerified) {
      throw new AppError('Cognito email must be verified before account linking', 403, 'EMAIL_NOT_VERIFIED');
    }

    // Check if this sub is already linked to a user
    const existingUserWithSub = await prisma.user.findUnique({
      where: { cognitoSub: cognitoUser.sub },
    });

    if (existingUserWithSub) {
      return res.status(200).json({
        success: true,
        message: 'Cognito identity is already linked to user profile',
        data: {
          userId: existingUserWithSub.id,
          email: existingUserWithSub.email,
          role: existingUserWithSub.role,
        },
      });
    }

    // Find candidates by verified email
    const matchingUsers = await prisma.user.findMany({
      where: { email: cognitoUser.email },
    });

    if (matchingUsers.length === 0) {
      throw new AppError('No matching application user record found for this verified email', 404, 'USER_NOT_FOUND');
    }

    if (matchingUsers.length > 1) {
      throw new AppError('Multiple candidate user records found with matching email', 409, 'AMBIGUOUS_USER_MATCH');
    }

    const targetUser = matchingUsers[0];

    if (targetUser.cognitoSub !== null) {
      throw new AppError('This user record is already linked to a different Cognito identity', 409, 'ALREADY_LINKED');
    }

    if (targetUser.status !== 'ACTIVE') {
      throw new AppError('Target user account is inactive', 403, 'INACTIVE_USER');
    }

    // Perform atomic linking
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { cognitoSub: cognitoUser.sub },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'COGNITO_IDENTITY_LINKED',
        resource: 'User',
        resourceId: updatedUser.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cognito identity successfully linked to user profile',
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

