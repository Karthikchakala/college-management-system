import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('CloudWatch Observability & Monitoring API Security', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  const adminUserId = crypto.randomUUID();
  const facultyUserId = crypto.randomUUID();
  const studentUserId = crypto.randomUUID();

  const adminToken = jwt.sign(
    { userId: adminUserId, email: 'admin@campusadmin.edu', role: 'ADMIN', sub: 'admin-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const facultyToken = jwt.sign(
    { userId: facultyUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'faculty-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { userId: studentUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: 'student-sub' },
    secret,
    { expiresIn: '1h' }
  );

  beforeAll(() => {
    vi.spyOn(client.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === adminUserId || args.where.cognitoSub === 'admin-sub') {
        return {
          id: adminUserId,
          email: 'admin@campusadmin.edu',
          role: 'ADMIN',
          status: 'ACTIVE',
        } as any;
      }
      if (args.where.id === facultyUserId || args.where.cognitoSub === 'faculty-sub') {
        return {
          id: facultyUserId,
          email: 'deepakgannamaneni@gmail.com',
          role: 'FACULTY',
          status: 'ACTIVE',
        } as any;
      }
      if (args.where.id === studentUserId || args.where.cognitoSub === 'student-sub') {
        return {
          id: studentUserId,
          email: 'karthikc11105@gmail.com',
          role: 'STUDENT',
          status: 'ACTIVE',
        } as any;
      }
      return null;
    });
  });

  // ==========================================================
  // 1. Admin Access to CloudWatch Monitoring Endpoints
  // ==========================================================
  describe('Admin Authorization for CloudWatch Endpoints', () => {
    it('1. should return 200 OK with full system telemetry for GET /api/admin/monitoring/overview', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallStatus');
      expect(res.body.data).toHaveProperty('ec2');
      expect(res.body.data).toHaveProperty('apiGateway');
      expect(res.body.data).toHaveProperty('lambda');
      expect(res.body.data).toHaveProperty('rds');
      expect(res.body.data).toHaveProperty('alarms');
    });

    it('2. should return 200 OK with EC2 metrics for GET /api/admin/monitoring/ec2', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/ec2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cpuUtilization');
      expect(res.body.data).toHaveProperty('memoryUsedPercent');
      expect(res.body.data).toHaveProperty('diskUsedPercent');
    });

    it('3. should return 200 OK with API Gateway metrics for GET /api/admin/monitoring/api-gateway', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/api-gateway?apiId=7k2yo6gy77')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('requestCount');
      expect(res.body.data).toHaveProperty('avgLatencyMs');
    });

    it('4. should return 200 OK with Lambda metrics for GET /api/admin/monitoring/lambda', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/lambda?functionName=CloudCampus-Health-Function')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('invocations');
      expect(res.body.data).toHaveProperty('avgDurationMs');
    });

    it('5. should return 200 OK with RDS metrics for GET /api/admin/monitoring/rds', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/rds?dbInstance=cloudcampus-db')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cpuUtilization');
      expect(res.body.data).toHaveProperty('databaseConnections');
      expect(res.body.data).toHaveProperty('freeStorageGB');
    });

    it('6. should return 200 OK with CloudWatch Alarms for GET /api/admin/monitoring/alarms', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/alarms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alarms.length).toBeGreaterThan(0);
    });

    it('7. should return 200 OK with structured logs for GET /api/admin/monitoring/logs', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/logs?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ==========================================================
  // 2. Role Isolation & Security Gates
  // ==========================================================
  describe('Role Isolation & Access Control', () => {
    it('8. should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/monitoring/overview');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('9. should reject student requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('10. should reject faculty requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/overview')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('11. should never expose raw AWS credentials or secrets in monitoring responses', async () => {
      const res = await request(app)
        .get('/api/admin/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('AWS_ACCESS_KEY_ID');
      expect(bodyStr).not.toContain('AWS_SECRET_ACCESS_KEY');
      expect(bodyStr).not.toContain('SECRET');
      expect(bodyStr).not.toContain('password');
    });
  });
});
