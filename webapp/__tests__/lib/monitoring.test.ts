/**
 * Unit Tests for Performance Monitoring System
 *
 * Tests the Core Web Vitals tracking and error logging functionality.
 */

import { vi } from 'vitest';

// Mock env module before importing monitoring
vi.mock('@/env.mjs', () => ({
  env: {
    NODE_ENV: 'development',
  },
}));

import { initMonitoring, reportCustomMetric } from '@/lib/monitoring';

describe('Performance Monitoring System', () => {
  let fetchSpy: vi.SpyInstance;
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    // Mock fetch
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

    // Mock PerformanceObserver
    (global as unknown as { PerformanceObserver: ReturnType<typeof vi.fn> }).PerformanceObserver =
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      }));

    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('initMonitoring', () => {
    it('should initialize without errors', () => {
      expect(() => initMonitoring()).not.toThrow();
    });

    it('should not throw when PerformanceObserver is not available', () => {
      delete (global as unknown as { PerformanceObserver?: unknown }).PerformanceObserver;
      expect(() => initMonitoring()).not.toThrow();
    });

    it('should setup error event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      initMonitoring();

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('reportCustomMetric', () => {
    it('should log metrics in development mode', () => {
      reportCustomMetric('custom_metric', 123);

      expect(consoleLogSpy).toHaveBeenCalledWith('[Custom Metric] custom_metric:', 123);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should send metrics to API in production mode', async () => {
      // Dynamically import and override env for this test
      const { env } = await import('@/env.mjs');
      (vi.mocked(env) as { NODE_ENV: string }).NODE_ENV = 'production';

      reportCustomMetric('custom_metric', 456);

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/analytics/metrics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      );

      // Reset for other tests
      (vi.mocked(env) as { NODE_ENV: string }).NODE_ENV = 'development';
    });

    it('should handle fetch errors silently', async () => {
      // Dynamically import and override env for this test
      const { env } = await import('@/env.mjs');
      (vi.mocked(env) as { NODE_ENV: string }).NODE_ENV = 'production';

      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      reportCustomMetric('failing_metric', 789);

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Reset for other tests
      (vi.mocked(env) as { NODE_ENV: string }).NODE_ENV = 'development';
    });
  });

  describe('Error Tracking', () => {
    it('should capture unhandled errors', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      initMonitoring();

      const errorHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1] as Function;

      expect(errorHandler).toBeDefined();

      // Simulate error event
      const mockErrorEvent = {
        message: 'Test error',
        error: { stack: 'Error: Test error\n  at ...' },
      };

      errorHandler(mockErrorEvent);

      expect(consoleErrorSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });

    it('should capture unhandled promise rejections', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      initMonitoring();

      const rejectionHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'unhandledrejection'
      )?.[1] as Function;

      expect(rejectionHandler).toBeDefined();

      // Simulate rejection event
      const mockRejectionEvent = {
        reason: { message: 'Promise rejected', stack: 'Error: Promise rejected' },
      };

      rejectionHandler(mockRejectionEvent);

      expect(consoleErrorSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });
  });
});
