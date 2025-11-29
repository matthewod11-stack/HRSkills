/**
 * Integration Tests for Analytics API Routes
 *
 * Tests the /api/analytics/metrics and /api/analytics/errors endpoints.
 */

import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

// Use dynamic import for ESM route handlers (Next.js App Router compatibility)
const metricsModule = await import('@/app/api/analytics/metrics/route');
const { POST: metricsPost, GET: metricsGet } = metricsModule;

const errorsModule = await import('@/app/api/analytics/errors/route');
const { POST: errorsPost, GET: errorsGet } = errorsModule;

describe('Analytics API Routes', () => {
  describe('POST /api/analytics/metrics', () => {
    it('should accept valid metric data', async () => {
      const validMetric = {
        name: 'LCP',
        value: 2345,
        rating: 'good',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify(validMetric),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await metricsPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid metric data (missing name)', async () => {
      const invalidMetric = {
        value: 2345,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify(invalidMetric),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await metricsPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid metric data');
    });

    it('should reject invalid metric data (missing value)', async () => {
      const invalidMetric = {
        name: 'LCP',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify(invalidMetric),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await metricsPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid metric data');
    });

    it('should accept all Core Web Vitals metrics', async () => {
      const metrics = [
        { name: 'LCP', value: 2345, rating: 'good', timestamp: Date.now() },
        { name: 'FID', value: 50, rating: 'good', timestamp: Date.now() },
        { name: 'CLS', value: 0.05, rating: 'good', timestamp: Date.now() },
        { name: 'FCP', value: 1500, rating: 'good', timestamp: Date.now() },
        { name: 'TTFB', value: 600, rating: 'good', timestamp: Date.now() },
      ];

      for (const metric of metrics) {
        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(metric),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await metricsPost(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/analytics/metrics', () => {
    it('should return metrics placeholder', async () => {
      // NextRequest requires a URL for nextUrl property
      const url = new URL('http://localhost:3000/api/analytics/metrics');
      const request = new NextRequest(url);

      const response = await metricsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
    });
  });

  describe('POST /api/analytics/errors', () => {
    it('should accept valid error data', async () => {
      const validError = {
        message: 'Test error',
        stack: 'Error: Test error\n  at ...',
        timestamp: Date.now(),
        url: 'http://localhost:3000/',
        userAgent: 'Mozilla/5.0...',
        type: 'error',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/errors', {
        method: 'POST',
        body: JSON.stringify(validError),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await errorsPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid error data (missing message)', async () => {
      const invalidError = {
        timestamp: Date.now(),
        url: 'http://localhost:3000/',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/errors', {
        method: 'POST',
        body: JSON.stringify(invalidError),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await errorsPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid error data');
    });

    it('should accept both error types', async () => {
      const errorTypes = ['error', 'unhandledrejection'];

      for (const type of errorTypes) {
        const error = {
          message: `Test ${type}`,
          timestamp: Date.now(),
          url: 'http://localhost:3000/',
          userAgent: 'Mozilla/5.0...',
          type,
        };

        const request = new NextRequest('http://localhost:3000/api/analytics/errors', {
          method: 'POST',
          body: JSON.stringify(error),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await errorsPost(request);
        expect(response.status).toBe(200);
      }
    });

    it('should handle critical error keywords', async () => {
      const criticalKeywords = ['security', 'auth', 'payment', 'data loss'];

      for (const keyword of criticalKeywords) {
        const error = {
          message: `Critical ${keyword} failure`,
          timestamp: Date.now(),
          url: 'http://localhost:3000/',
          userAgent: 'Mozilla/5.0...',
          type: 'error',
        };

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

        const request = new NextRequest('http://localhost:3000/api/analytics/errors', {
          method: 'POST',
          body: JSON.stringify(error),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await errorsPost(request);
        expect(response.status).toBe(200);

        // Should log critical error
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('CRITICAL ERROR'),
          expect.any(String)
        );

        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('GET /api/analytics/errors', () => {
    it('should return errors placeholder', async () => {
      const url = new URL('http://localhost:3000/api/analytics/errors?limit=50&type=error');
      const request = new NextRequest(url);

      const response = await errorsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toEqual([]);
      expect(data.count).toBe(0);
      expect(data.filters).toEqual({ limit: 50, type: 'error' });
    });

    it('should handle query parameters', async () => {
      const url = new URL(
        'http://localhost:3000/api/analytics/errors?limit=100&type=unhandledrejection'
      );
      const request = new NextRequest(url);

      const response = await errorsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.limit).toBe(100);
      expect(data.filters.type).toBe('unhandledrejection');
    });

    it('should use default limit when not specified', async () => {
      const url = new URL('http://localhost:3000/api/analytics/errors');
      const request = new NextRequest(url);

      const response = await errorsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.limit).toBe(50);
    });
  });
});
