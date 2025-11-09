import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createApp } from '../src/app';

import { createTestToken } from './helpers/auth.helper';

import type { FastifyInstance } from 'fastify';

describe('Basic API Tests', () => {
  let app: FastifyInstance;
  let testToken: string;

  beforeAll(async () => {
    console.log('Setting up basic tests...');

    // Créer l'app
    app = await createApp();
    await app.ready();

    // Créer le token
    const { token } = await createTestToken(); // ✅
    testToken = token;

    console.log('Test environment ready');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up...');
    await app.close();
  });

  // ==========================================
  // HEALTH CHECKS
  // ==========================================
  describe('Health Endpoints', () => {
    it('should return OK on /api/health', async () => {
      const response = await request(app.server).get('/api/health');
      expect(response.statusCode).toBe(200);
    });

    it('should return OK on /api/health/live', async () => {
      const response = await request(app.server).get('/api/health/live');
      expect(response.statusCode).toBe(200);
    });

    it('should return OK on /api/health/ready', async () => {
      const response = await request(app.server).get('/api/health/ready');
      expect(response.statusCode).toBe(200);
    });
  });

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  describe('Auth Endpoints', () => {
    it('POST /api/auth/google should return a URL', async () => {
      const response = await request(app.server)
        .post('/api/auth/google')
        .send({ redirectUrl: 'http://localhost:3000' });

      expect([200, 201]).toContain(response.statusCode);
    });

    it('GET /api/auth/session should reject without token', async () => {
      const response = await request(app.server).get('/api/auth/session');
      expect(response.statusCode).toBe(401);
    });

    it('POST /api/auth/signout should require auth', async () => {
      const response = await request(app.server).post('/api/auth/signout');
      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // PROFILE
  // ==========================================
  describe('Profile Endpoints', () => {
    it('GET /api/profile/me should reject without auth', async () => {
      const response = await request(app.server).get('/api/profile/me');
      expect(response.statusCode).toBe(401);
    });

    it('PUT /api/profile/me should reject without auth', async () => {
      const response = await request(app.server)
        .put('/api/profile/me')
        .send({ display_name: 'Test' });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/profile should reject without display_name', async () => {
      const response = await request(app.server)
        .post('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ pin: '1234' });

      expect([400, 401]).toContain(response.statusCode);
    });

    it('POST /api/profile should reject without pin', async () => {
      const response = await request(app.server)
        .post('/api/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ display_name: 'Test' });

      expect([400, 401]).toContain(response.statusCode);
    });
  });

  // ==========================================
  // GROUPS
  // ==========================================
  describe('Group Endpoints', () => {
    it('POST /api/groups should reject without auth', async () => {
      const response = await request(app.server)
        .post('/api/groups')
        .send({ name: 'Test Group' });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/groups should reject without name', async () => {
      const response = await request(app.server)
        .post('/api/groups')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect([400, 401]).toContain(response.statusCode);
    });

    it('GET /api/groups should reject without auth', async () => {
      const response = await request(app.server).get('/api/groups');
      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  describe('Notification Endpoints', () => {
    it('GET /api/notifications should reject without auth', async () => {
      const response = await request(app.server).get('/api/notifications');
      expect(response.statusCode).toBe(401);
    });
  });
});
