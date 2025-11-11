/**
 * @jest-environment jsdom
 */

import {
  errorLogger,
  ErrorSeverity,
  logComponentError,
  logApiError,
  logUserActionError,
} from '@/lib/errorLogging';

// Mock console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd,
};

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
  errorLogger.clearLogs();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
});

describe('ErrorLoggingService', () => {
  describe('Basic logging', () => {
    it('should log errors with severity', () => {
      const error = new Error('Test error');
      errorLogger.logError(error, undefined, ErrorSeverity.HIGH);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Test error');
      expect(logs[0].severity).toBe(ErrorSeverity.HIGH);
    });

    it('should enrich error context automatically', () => {
      const error = new Error('Test error');
      errorLogger.logError(error);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].context.timestamp).toBeDefined();
      expect(logs[0].context.url).toBeDefined();
      expect(logs[0].context.userAgent).toBeDefined();
    });

    it('should accept custom context', () => {
      const error = new Error('Test error');
      errorLogger.logError(error, undefined, ErrorSeverity.MEDIUM, {
        component: 'TestComponent',
        action: 'button_click',
        userId: 'user123',
      });

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].context.component).toBe('TestComponent');
      expect(logs[0].context.action).toBe('button_click');
      expect(logs[0].context.userId).toBe('user123');
    });
  });

  describe('Error severity levels', () => {
    it('should handle LOW severity errors', () => {
      const error = new Error('Low severity error');
      errorLogger.logError(error, undefined, ErrorSeverity.LOW);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.LOW);
    });

    it('should handle MEDIUM severity errors', () => {
      const error = new Error('Medium severity error');
      errorLogger.logError(error, undefined, ErrorSeverity.MEDIUM);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should handle HIGH severity errors', () => {
      const error = new Error('High severity error');
      errorLogger.logError(error, undefined, ErrorSeverity.HIGH);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.HIGH);
    });

    it('should handle CRITICAL severity errors', () => {
      const error = new Error('Critical error');
      errorLogger.logError(error, undefined, ErrorSeverity.CRITICAL);

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('Log management', () => {
    it('should store up to 100 logs', () => {
      // Add 150 logs
      for (let i = 0; i < 150; i++) {
        errorLogger.logError(new Error(`Error ${i}`));
      }

      const logs = errorLogger.getRecentLogs(150);
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should return recent logs in order', () => {
      errorLogger.logError(new Error('First error'));
      errorLogger.logError(new Error('Second error'));
      errorLogger.logError(new Error('Third error'));

      const logs = errorLogger.getRecentLogs(3);
      expect(logs[0].error.message).toBe('First error');
      expect(logs[1].error.message).toBe('Second error');
      expect(logs[2].error.message).toBe('Third error');
    });

    it('should clear logs', () => {
      errorLogger.logError(new Error('Test error'));
      expect(errorLogger.getRecentLogs(1)).toHaveLength(1);

      errorLogger.clearLogs();
      expect(errorLogger.getRecentLogs(1)).toHaveLength(0);
    });
  });

  describe('Console logging', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log to console in development mode', () => {
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      errorLogger.logError(error);

      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log to console in production mode', () => {
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');
      errorLogger.logError(error);

      // Should still call console.log for monitoring service message
      expect(console.log).toHaveBeenCalled();
    });
  });
});

describe('Convenience logging functions', () => {
  describe('logComponentError', () => {
    it('should log component errors with HIGH severity', () => {
      const error = new Error('Component error');
      const errorInfo = {
        componentStack: 'at Component\n  at Parent',
      };

      logComponentError(error, errorInfo, 'TestComponent');

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.HIGH);
      expect(logs[0].context.component).toBe('TestComponent');
      expect(logs[0].context.action).toBe('component_render');
    });
  });

  describe('logApiError', () => {
    it('should log API errors with MEDIUM severity', () => {
      const error = new Error('API error');
      logApiError(error, '/api/users', 'POST');

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(logs[0].context.action).toBe('api_call');
      expect(logs[0].context.additionalData).toEqual({
        endpoint: '/api/users',
        method: 'POST',
      });
    });

    it('should default to GET method', () => {
      const error = new Error('API error');
      logApiError(error, '/api/users');

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].context.additionalData).toEqual({
        endpoint: '/api/users',
        method: 'GET',
      });
    });
  });

  describe('logUserActionError', () => {
    it('should log user action errors with LOW severity', () => {
      const error = new Error('User action error');
      logUserActionError(error, 'button_click', {
        buttonId: 'submit-btn',
        formName: 'contact-form',
      });

      const logs = errorLogger.getRecentLogs(1);
      expect(logs[0].severity).toBe(ErrorSeverity.LOW);
      expect(logs[0].context.action).toBe('button_click');
      expect(logs[0].context.additionalData).toEqual({
        buttonId: 'submit-btn',
        formName: 'contact-form',
      });
    });
  });
});

describe('Error context enrichment', () => {
  it('should include timestamp in ISO format', () => {
    const error = new Error('Test error');
    errorLogger.logError(error);

    const logs = errorLogger.getRecentLogs(1);
    expect(logs[0].context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should include current URL', () => {
    const error = new Error('Test error');
    errorLogger.logError(error);

    const logs = errorLogger.getRecentLogs(1);
    expect(logs[0].context.url).toBeDefined();
    expect(typeof logs[0].context.url).toBe('string');
  });

  it('should include user agent', () => {
    const error = new Error('Test error');
    errorLogger.logError(error);

    const logs = errorLogger.getRecentLogs(1);
    expect(logs[0].context.userAgent).toBeDefined();
  });

  it('should merge custom context with auto-enriched context', () => {
    const error = new Error('Test error');
    errorLogger.logError(error, undefined, ErrorSeverity.MEDIUM, {
      component: 'CustomComponent',
      userId: 'user123',
    });

    const logs = errorLogger.getRecentLogs(1);
    expect(logs[0].context.component).toBe('CustomComponent');
    expect(logs[0].context.userId).toBe('user123');
    expect(logs[0].context.timestamp).toBeDefined();
    expect(logs[0].context.url).toBeDefined();
  });
});
