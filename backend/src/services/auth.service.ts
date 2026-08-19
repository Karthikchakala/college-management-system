import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_cloudcampus';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
}

export interface AuthenticationService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  generateToken(payload: TokenPayload): string;
  verifyToken(token: string): TokenPayload;
}

export class LocalAuthenticationService implements AuthenticationService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService: AuthenticationService = new LocalAuthenticationService();
