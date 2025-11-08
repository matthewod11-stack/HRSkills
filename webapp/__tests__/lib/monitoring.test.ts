/**
 * Unit Tests for Performance Monitoring System
 *
 * Tests the Core Web Vitals tracking and error logging functionality.
 */

import { initMonitoring, reportCustomMetric } from '@/lib/monitoring';

describe('Performance Monitoring System', () => {
  let fetchSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock fetch
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    })) as any;

    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('initMonitoring', () => {
    it('should initialize without errors', () => {
      expect(() => initMonitoring()).not.toThrow();
    });

    it('should not throw when PerformanceObserver is not available', () => {
      delete (global as any).PerformanceObserver;
      expect(() => initMonitoring()).not.toThrow();
    });

    it('should setup error event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      initMonitoring();

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('reportCustomMetric', () => {
    it('should log metrics in development mode', () => {
      reportCustomMetric('custom_metric', 123);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Custom Metric] custom_metric:',
        123
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should send metrics to API in production mode', async () => {
      process.env.NODE_ENV = 'production';

      reportCustomMetric('custom_metric', 456);

      // Wait for async fetch
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/analytics/metrics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      );
    });

    it('should handle fetch errors silently', async () => {
      process.env.NODE_ENV = 'production';
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      reportCustomMetric('failing_metric', 789);

      // Wait for async fetch
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Error Tracking', () => {
    it('should capture unhandled errors', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      initMonitoring();

      const errorHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'error'
      )?.[1] as Function;

      expect(errorHandler).toBeDefined();

      // Simulate error event
      const mockErrorEvent = {
        message: 'Test error',
        error: { stack: 'Error: Test error\n  at ...' },
      };

      errorHandler(mockErrorEvent);

      expect(consoleLogSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });

    it('should capture unhandled promise rejections', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      initMonitoring();

      const rejectionHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1] as Function;

      expect(rejectionHandler).toBeDefined();

      // Simulate rejection event
      const mockRejectionEvent = {
        reason: { message: 'Promise rejected', stack: 'Error: Promise rejected' },
      };

      rejectionHandler(mockRejectionEvent);

      expect(consoleLogSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });
  });
});
