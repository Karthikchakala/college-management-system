import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Ensure database connection is active (we can run test migration or seeding beforehand)
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@campus.local',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should successfully log in with demo student credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@campus.local',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  it('should successfully log in with demo admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@campus.local',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('should reject profile access without JWT token', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should allow profile access with valid student JWT token', async () => {
    // 1. Log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@campus.local',
        password: 'password123',
      });

    const token = loginRes.body.data.token;

    // 2. Fetch profile
    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.user.email).toBe('student@campus.local');
    expect(profileRes.body.data.user.student).toBeDefined();
  });
});
