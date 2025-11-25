import 'dotenv/config';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HOST = '127.0.0.1';
process.env.LOG_LEVEL = 'silent';

// Set mock Supabase environment variables if not already set (for CI)
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  'test-jwt-secret-key-with-at-least-32-characters';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});

beforeEach(() => {
  // Reset mocks before each test
});
