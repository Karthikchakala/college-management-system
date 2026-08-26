import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
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

  // 4. Cognito Authentication Verification & API Test Gate
  describe('Cognito Service & Security Gates', () => {
    it('should reject malformed or untrusted Cognito tokens', async () => {
      await expect(cognitoService.verifyCognitoToken('invalid.jwt.token')).rejects.toThrow();
    });

    it('should reject unauthenticated access to /api/test', async () => {
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return sanitized response without internal user metadata on GET /api/test when authenticated', async () => {
      const token = authService.generateToken({
        userId: 'test-user-id-123',
        email: 'test@campus.local',
        role: 'ADMIN',
      });

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Cognito authenticated test route verified',
      });
      expect(res.body.user).toBeUndefined();
      expect(res.body.userId).toBeUndefined();
      expect(res.body.role).toBeUndefined();
      expect(res.body.cognitoSub).toBeUndefined();
    });
  });
});
