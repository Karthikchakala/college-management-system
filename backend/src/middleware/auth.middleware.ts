import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authService, TokenPayload } from '../services/auth.service';
import { cognitoService, CognitoVerifiedUser } from '../services/cognito.service';

// Extend Express Request interface to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token is missing or invalid',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    let authenticatedUser: TokenPayload | null = null;

    // 1. Attempt Cryptographic Cognito Token Verification
    try {
      const cognitoUser: CognitoVerifiedUser = await cognitoService.verifyCognitoToken(token);
      
      // Step A: Look up user by cognitoSub directly
      let user = await prisma.user.findUnique({
        where: { cognitoSub: cognitoUser.sub },
      });

      // Step B: Secure Identity Linking if cognitoSub is not yet linked
      if (!user) {
        // Secure linking requirements:
        // - email must be present
        // - emailVerified must be true
        if (cognitoUser.email && cognitoUser.emailVerified) {
          // Check that no other user has this cognitoSub (already covered by unique constraint, but checked explicitly)
          const existingWithSub = await prisma.user.findUnique({
            where: { cognitoSub: cognitoUser.sub },
          });

          if (!existingWithSub) {
            // Find all matching users by verified email
            const matchingUsers = await prisma.user.findMany({
              where: { email: cognitoUser.email },
            });

            // Must match exactly one existing user whose cognitoSub is currently null
            if (matchingUsers.length === 1 && matchingUsers[0].cognitoSub === null) {
              const targetUser = matchingUsers[0];
              if (targetUser.status === 'ACTIVE') {
                user = await prisma.user.update({
                  where: { id: targetUser.id },
                  data: { cognitoSub: cognitoUser.sub },
                });
                console.log(JSON.stringify({
                  level: 'INFO',
                  action: 'COGNITO_IDENTITY_LINKED',
                  message: 'Successfully linked Cognito identity to user profile',
                }));
              }
            } else {
              console.warn(JSON.stringify({
                level: 'WARN',
                action: 'COGNITO_LINKING_SKIPPED',
                reason: matchingUsers.length === 0
                  ? 'No matching user record found'
                  : matchingUsers.length > 1
                  ? 'Multiple candidate user records found'
                  : 'Candidate user record already has a cognitoSub linked',
              }));
            }
          }
        } else {
          console.warn(JSON.stringify({
            level: 'WARN',
            action: 'COGNITO_LINKING_REJECTED',
            reason: !cognitoUser.email ? 'Email claim missing' : 'Email is unverified in Cognito',
          }));
        }
      }

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'Authenticated Cognito user does not have an active application profile',
          code: 'UNAUTHORIZED',
        });
      }

      authenticatedUser = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (cognitoError: any) {
      // In production, local JWT fallback is STRICTLY FORBIDDEN
      if (isProduction) {
        return res.status(401).json({
          success: false,
          message: 'Invalid, expired, or untrusted Cognito token',
          code: 'UNAUTHORIZED',
        });
      }

      // 2. Development / Test Fallback: Local JWT Verification
      try {
        const decoded = authService.verifyToken(token);
        authenticatedUser = decoded;
      } catch (localError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
        });
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        code: 'UNAUTHORIZED',
      });
    }

    req.user = authenticatedUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'UNAUTHORIZED',
    });
  }
};

export const authorize = (allowedRoles: ('STUDENT' | 'FACULTY' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role forbidden: Requires one of [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};
