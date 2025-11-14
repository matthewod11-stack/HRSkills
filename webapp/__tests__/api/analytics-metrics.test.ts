/**
 * Tests for /api/analytics/metrics route handlers
 */

jest.mock(
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const routes = require('@/app/api/analytics/metrics/route');
const { POST, GET } = routes;

jest.mock('@/lib/services/web-vitals-service', () => ({
  storeMetric: jest.fn(),
  getMetrics: jest.fn(),
  getMetricCount: jest.fn(),
}));

const {
  storeMetric,
  getMetrics,
  getMetricCount,
} = jest.requireMock('@/lib/services/web-vitals-service') as {
  storeMetric: jest.Mock;
  getMetrics: jest.Mock;
  getMetricCount: jest.Mock;
};

describe('API /api/analytics/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    } as any;

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
      nextUrl: new URL(
        'http://localhost/api/analytics/metrics?metricName=LCP&limit=5&offset=5'
      ),
    } as any;

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
