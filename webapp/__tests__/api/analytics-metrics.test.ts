/**
 * Tests for /api/analytics/metrics route handlers
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  'next/server',
  () =>
    ({
      NextRequest: class {},
      NextResponse: {
        json(body: unknown, init?: ResponseInit) {
          return {
            body,
            status: init?.status ?? 200,
            json: async () => body,
          };
        },
      },
    }) as unknown
);

// Use dynamic import for ESM route handlers (Next.js App Router compatibility)
const routesModule = await import('@/app/api/analytics/metrics/route');
const { POST, GET } = routesModule;

// Mock web-vitals-service before import
vi.mock('@/lib/services/web-vitals-service', () => ({
  storeMetric: vi.fn(),
  getMetrics: vi.fn(),
  getMetricCount: vi.fn(),
}));

// Import mocked service (must come after vi.mock for proper hoisting)
const webVitalsService = await import('@/lib/services/web-vitals-service');
const { storeMetric, getMetrics, getMetricCount } = webVitalsService as {
  storeMetric: vi.Mock;
  getMetrics: vi.Mock;
  getMetricCount: vi.Mock;
};

describe('API /api/analytics/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists incoming metrics on POST', async () => {
    const payload = {
      name: 'LCP',
      value: 1250,
      rating: 'good',
      timestamp: Date.now(),
      url: 'http://localhost/',
      userAgent: 'jest',
      navigationType: 'navigate',
    };

    const request = {
      async json() {
        return payload;
      },
    } as { json: () => Promise<typeof payload> };

    const response = await POST(request);
    const body = await response.json();

    expect(storeMetric).toHaveBeenCalledWith(payload);
    expect(body).toEqual({ success: true });
  });

  it('returns stored metrics with pagination on GET', async () => {
    const metrics = [
      {
        id: 'wv_1',
        metricName: 'LCP',
        value: 1200,
        rating: 'good',
        timestamp: new Date().toISOString(),
        url: 'http://localhost/',
        userAgent: 'jest',
        navigationType: 'navigate',
      },
    ];

    getMetrics.mockResolvedValue(metrics);
    getMetricCount.mockResolvedValue(10);

    const request = {
      nextUrl: new URL('http://localhost/api/analytics/metrics?metricName=LCP&limit=5&offset=5'),
    } as { nextUrl: URL };

    const response = await GET(request);
    const body = await response.json();

    expect(getMetrics).toHaveBeenCalledWith({
      metricName: 'LCP',
      startDate: undefined,
      endDate: undefined,
      rating: undefined,
      limit: 5,
      offset: 5,
    });
    expect(body).toEqual({
      metrics,
      pagination: {
        total: 10,
        limit: 5,
        offset: 5,
        hasMore: true,
      },
    });
  });
});
