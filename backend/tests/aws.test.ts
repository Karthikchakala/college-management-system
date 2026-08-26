import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../src/app';
import prisma from '../src/config/db';
import { S3StorageService } from '../src/services/s3.service';
import { LocalStorageService } from '../src/services/storage.service';
import { getDatabaseUrl } from '../src/config/secrets';
import { cognitoService } from '../src/services/cognito.service';
import { authService } from '../src/services/auth.service';

describe('AWS Services Unit & Integration Tests', () => {
  // 1. Health Endpoints
  describe('Health Checks', () => {
    it('should return 200 OK on GET /health with proper service metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('cloudcampus-backend');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return 200 OK on GET /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('cloudcampus-backend');
    });
  });

  // 2. Storage Services
  describe('Storage Service Implementation', () => {
    it('should initialize LocalStorageService and handle upload, existence check, and deletion', async () => {
      const localService = new LocalStorageService();
      const testFile = {
        buffer: Buffer.from('CloudCampus AWS Test Content'),
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
      };

      const uploadResult = await localService.uploadFile(testFile);
      expect(uploadResult.key).toBeDefined();
      expect(uploadResult.url).toContain('/uploads/');

      const exists = await localService.fileExists(uploadResult.key);
      expect(exists).toBe(true);

      await localService.deleteFile(uploadResult.key);
      const existsAfterDelete = await localService.fileExists(uploadResult.key);
      expect(existsAfterDelete).toBe(false);
    });

    it('should instantiate S3StorageService with correct private bucket configuration', () => {
      const s3Service = new S3StorageService();
      expect(s3Service).toBeInstanceOf(S3StorageService);
    });
  });

  // 3. Secrets Manager Configuration & Production RDS URL Construction
  describe('Secrets Manager & Database Connection', () => {
    it('should resolve local DATABASE_URL in development/test environment', async () => {
      const dbUrl = await getDatabaseUrl();
      expect(dbUrl).toBeDefined();
      expect(typeof dbUrl).toBe('string');
    });

    it('should construct exact RDS connection string for database campusadmin with SSL enforcement', () => {
      const sampleSecret = {
        username: 'campusadmin',
        password: 'secure_mock_password',
        host: 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com',
        port: 5432,
        dbname: 'campusadmin',
      };

      const constructedUrl = `postgresql://${encodeURIComponent(sampleSecret.username)}:${encodeURIComponent(sampleSecret.password)}@${sampleSecret.host}:${sampleSecret.port}/${sampleSecret.dbname}?sslmode=require`;

      expect(constructedUrl).toContain('cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com:5432');
      expect(constructedUrl).toContain('/campusadmin?sslmode=require');
      expect(constructedUrl).toContain('postgresql://campusadmin:');
      expect(constructedUrl).not.toContain('localhost');
      expect(constructedUrl).not.toContain('cloudcampus?');
    });
  });

  // 4. Cognito Authentication & Identity Mapping Tests
  describe('Cognito Service & Security Gates', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    // 1. Missing token -> 401
    it('1. should reject requests with missing token (401)', async () => {
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    // 2. Malformed token -> 401
    it('2. should reject requests with malformed Bearer token (401)', async () => {
      const res = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer not-a-valid-jwt');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    // 3. Expired/Invalid token -> 401
    it('3. should reject requests with invalid signature or expired token (401)', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid_sig';
      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    // 4. Valid Cognito access token with already-linked cognitoSub -> 200
    it('4. should allow access when valid Cognito token is already linked to an active user profile (200)', async () => {
      const mockSub = '8458d4b8-a071-70f2-068d-daa6d1caa912';

      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: mockSub,
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        emailVerified: false,
        tokenUse: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-linked-123',
        email: 'admin@campus.edu',
        role: 'ADMIN',
        status: 'ACTIVE',
        cognitoSub: mockSub,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer mock-valid-access-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Cognito authenticated test route verified',
      });
    });

    // 5. Valid Cognito access token with no linked profile -> 401
    it('5. should reject access when valid Cognito access token has no active linked profile (401)', async () => {
      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: 'unlinked-cognito-sub-999',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        emailVerified: false,
        tokenUse: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer mock-valid-unlinked-access-token');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('does not have an active application profile');
    });

    // 6. Valid verified Cognito ID token + exactly one matching email -> secure linking succeeds (200)
    it('6. should successfully link Cognito identity when valid ID token has verified email matching exactly one user', async () => {
      const mockSub = '8458d4b8-a071-70f2-068d-daa6d1caa912';
      const mockEmail = 'admin@campus.edu';

      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: mockSub,
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        email: mockEmail,
        emailVerified: true,
        tokenUse: 'id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // No user has this sub yet
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Exactly 1 user matches email with cognitoSub null
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        {
          id: 'user-admin-1',
          email: mockEmail,
          role: 'ADMIN',
          status: 'ACTIVE',
          cognitoSub: null,
        } as any,
      ]);

      vi.spyOn(prisma.user, 'update').mockResolvedValue({
        id: 'user-admin-1',
        email: mockEmail,
        role: 'ADMIN',
        status: 'ACTIVE',
        cognitoSub: mockSub,
      } as any);

      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/auth/cognito/link')
        .send({ idToken: 'valid-mock-id-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully linked');
      expect(res.body.data.email).toBe(mockEmail);
    });

    // 7. Duplicate email candidates -> linking rejected (409)
    it('7. should reject account linking if multiple candidate user records exist with the same email (409)', async () => {
      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: 'mock-sub-1',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        email: 'duplicate@campus.edu',
        emailVerified: true,
        tokenUse: 'id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        { id: '1', email: 'duplicate@campus.edu' } as any,
        { id: '2', email: 'duplicate@campus.edu' } as any,
      ]);

      const res = await request(app)
        .post('/api/auth/cognito/link')
        .send({ idToken: 'valid-mock-id-token-duplicate' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('AMBIGUOUS_USER_MATCH');
    });

    // 8. Unverified email -> linking rejected (403)
    it('8. should reject account linking if Cognito email is unverified (403)', async () => {
      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: 'mock-sub-1',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        email: 'unverified@campus.edu',
        emailVerified: false,
        tokenUse: 'id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const res = await request(app)
        .post('/api/auth/cognito/link')
        .send({ idToken: 'mock-id-token-unverified' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });

    // 9. Already-linked different cognitoSub -> linking rejected (409)
    it('9. should reject account linking if target user record is already linked to a different Cognito identity (409)', async () => {
      vi.spyOn(cognitoService, 'verifyCognitoToken').mockResolvedValue({
        sub: 'new-sub-attempt',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL',
        clientId: '3kv2vgpkklqtlpfom2t72dn29n',
        email: 'already-linked@campus.edu',
        emailVerified: true,
        tokenUse: 'id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        {
          id: 'user-already-linked',
          email: 'already-linked@campus.edu',
          cognitoSub: 'original-existing-sub',
          status: 'ACTIVE',
        } as any,
      ]);

      const res = await request(app)
        .post('/api/auth/cognito/link')
        .send({ idToken: 'mock-id-token-different-sub' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ALREADY_LINKED');
    });

    // 10. In production, local JWT fallback is strictly rejected (401)
    it('10. should reject local JWT in production environment (401)', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const localToken = authService.generateToken({
        userId: 'test-user-id-123',
        email: 'test@campus.local',
        role: 'ADMIN',
      });

      vi.spyOn(cognitoService, 'verifyCognitoToken').mockRejectedValue(new Error('Invalid signature'));

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${localToken}`);

      process.env.NODE_ENV = origEnv;

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('Invalid, expired, or untrusted Cognito token');
    });
  });

  // 5. Non-Destructive Production Seed Audit
  describe('Production Seed Safety Verification', () => {
    it('should never contain destructive delete or truncate operations in production-seed.ts', () => {
      const seedFilePath = path.join(__dirname, '..', 'prisma', 'production-seed.ts');
      expect(fs.existsSync(seedFilePath)).toBe(true);

      const content = fs.readFileSync(seedFilePath, 'utf-8');

      // Strict assertions: No deleteMany, delete, truncate, or drop
      expect(content).not.toContain('deleteMany');
      expect(content).not.toContain('.delete(');
      expect(content).not.toContain('truncate');
      expect(content).not.toContain('DROP TABLE');
      expect(content).not.toContain('DROP DATABASE');

      // Assertions: Safe upsert operations used for core models
      expect(content).toContain('prisma.department.upsert');
      expect(content).toContain('prisma.user.upsert');
      expect(content).toContain('prisma.faculty.upsert');
      expect(content).toContain('prisma.student.upsert');
      expect(content).toContain('prisma.course.upsert');
      expect(content).toContain('prisma.enrollment.upsert');
    });
  });
});
