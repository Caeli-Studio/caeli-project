import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createLoggerConfig, customLogger } from '../../utils/logger';

describe('Logger - Unit Tests', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('createLoggerConfig', () => {
    it('should create development logger config with pino-pretty transport', () => {
      const config = createLoggerConfig(true);

      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('transport');
      expect(config.transport).toHaveProperty('target', 'pino-pretty');
      expect(config.transport?.options).toHaveProperty('colorize', true);
    });

    it('should create production logger config without transport', () => {
      const config = createLoggerConfig(false);

      expect(config).toHaveProperty('level');
      expect(config.transport).toBeUndefined();
    });

    it('should use LOG_LEVEL environment variable when set', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      const config = createLoggerConfig();
      expect(config.level).toBe('debug');

      process.env.LOG_LEVEL = originalLogLevel;
    });

    it('should default to info level when LOG_LEVEL not set', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      const config = createLoggerConfig();
      expect(config.level).toBe('info');

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('customLogger.printLogo', () => {
    it('should print ASCII logo', () => {
      customLogger.printLogo();

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('╔═══');
      expect(output).toContain('API Server');
    });
  });

  describe('customLogger.info', () => {
    it('should log info message with emoji', () => {
      customLogger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('INFO:');
      expect(output).toContain('Test info message');
    });
  });

  describe('customLogger.success', () => {
    it('should log success message with emoji', () => {
      customLogger.success('Test success message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('SUCCESS:');
      expect(output).toContain('Test success message');
    });
  });

  describe('customLogger.warn', () => {
    it('should log warning message with emoji', () => {
      customLogger.warn('Test warning message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('WARNING:');
      expect(output).toContain('Test warning message');
    });
  });

  describe('customLogger.error', () => {
    it('should log error message with emoji', () => {
      customLogger.error('Test error message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('ERROR:');
      expect(output).toContain('Test error message');
    });

    it('should log error with stack trace when error object provided', () => {
      const error = new Error('Test error object');
      customLogger.error('Test error message', error);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const outputs = consoleLogSpy.mock.calls.map((call: unknown[]) =>
        call.join(' ')
      );
      expect(outputs[0]).toContain('ERROR:');
      expect(outputs[1]).toContain('Error: Test error object');
    });
  });

  describe('customLogger.serverStart', () => {
    it('should log development server startup information', () => {
      customLogger.serverStart(3000, 'localhost', 'development');

      expect(consoleLogSpy).toHaveBeenCalled();
      const outputs = consoleLogSpy.mock.calls.map((call: unknown[]) =>
        call.join(' ')
      );
      const allOutput = outputs.join(' ');

      expect(allOutput).toContain('Server started successfully');
      expect(allOutput).toContain('http://localhost:3000');
      expect(allOutput).toContain('development');
    });

    it('should log production server startup information', () => {
      customLogger.serverStart(8080, '0.0.0.0', 'production');

      expect(consoleLogSpy).toHaveBeenCalled();
      const outputs = consoleLogSpy.mock.calls.map((call: unknown[]) =>
        call.join(' ')
      );
      const allOutput = outputs.join(' ');

      expect(allOutput).toContain('Server started successfully');
      expect(allOutput).toContain('http://0.0.0.0:8080');
      expect(allOutput).toContain('production');
    });
  });

  describe('customLogger.route', () => {
    it('should log GET route registration', () => {
      customLogger.route('GET', '/api/test');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('Route:');
      expect(output).toContain('GET');
      expect(output).toContain('/api/test');
    });

    it('should log POST route registration', () => {
      customLogger.route('POST', '/api/create');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('POST');
      expect(output).toContain('/api/create');
    });

    it('should log PUT route registration', () => {
      customLogger.route('PUT', '/api/update');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('PUT');
      expect(output).toContain('/api/update');
    });

    it('should log DELETE route registration', () => {
      customLogger.route('DELETE', '/api/delete');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('DELETE');
      expect(output).toContain('/api/delete');
    });

    it('should log other HTTP methods', () => {
      customLogger.route('PATCH', '/api/patch');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('PATCH');
      expect(output).toContain('/api/patch');
    });
  });
});
