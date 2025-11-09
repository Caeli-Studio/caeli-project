import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createApp } from '../src/app';

import type { FastifyInstance } from 'fastify';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app.server).get('/api/health');
      expect(response.statusCode).toBe(200);
    });

    it('should have correct response structure', async () => {
      const response = await request(app.server).get('/api/health');
      const body = response.body;
      expect(body).toHaveProperty('status');
      expect(response.statusCode).toBe(200);
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      await request(app.server).get('/api/health');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('GET /api/health/live', () => {
    it('should return 200 OK', async () => {
      const response = await request(app.server).get('/api/health/live');
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return 200 OK', async () => {
      const response = await request(app.server).get('/api/health/ready');
      expect(response.statusCode).toBe(200);
    });

    it('should indicate server is ready', async () => {
      const response = await request(app.server).get('/api/health/ready');
      const body = response.body;
      expect(body).toHaveProperty('ready', true);
    });

    it('should check Supabase connection', async () => {
      const response = await request(app.server).get('/api/health/ready');
      const body = response.body;
      expect(body).toHaveProperty('ready');
    });
  });

  describe('GET /api/health/supabase', () => {
    it('should check Supabase connection', async () => {
      const response = await request(app.server).get('/api/health/supabase');
      expect([200, 503]).toContain(response.statusCode);
    });

    it('should return healthy status when Supabase is available', async () => {
      const response = await request(app.server).get('/api/health/supabase');
      if (response.statusCode === 200) {
        const body = response.body;
        expect(body).toHaveProperty('status', 'healthy');
      }
    });
  });

  describe('GET /api/health/supabase/details', () => {
    it('should return detailed Supabase connection info', async () => {
      const response = await request(app.server).get(
        '/api/health/supabase/details'
      );
      expect([200, 503]).toContain(response.statusCode);
      const body = response.body;
      expect(body).toHaveProperty('status');
    });
  });

  describe('GET /api/health/supabase/benchmark', () => {
    it('should benchmark Supabase queries', async () => {
      const response = await request(app.server)
        .get('/api/health/supabase/benchmark')
        .query({ iterations: 3 });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = response.body;
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('results');
      }
    });

    it('should use default values', async () => {
      const response = await request(app.server).get(
        '/api/health/supabase/benchmark'
      );
      expect([200, 503]).toContain(response.statusCode);
    });

    it('should reject too many iterations', async () => {
      const response = await request(app.server)
        .get('/api/health/supabase/benchmark')
        .query({ iterations: 100 });

      expect(response.statusCode).toBe(400);
    });
  });
});
