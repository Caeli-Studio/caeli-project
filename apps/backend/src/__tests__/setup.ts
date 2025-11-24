import 'dotenv/config';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HOST = '127.0.0.1';
process.env.LOG_LEVEL = 'silent';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});

beforeEach(() => {
  // Reset mocks before each test
});
