import { vi } from 'vitest';

// ===================================================================
// CRITICAL: Mock T3 Env FIRST (before any other imports)
// ===================================================================
// T3 Env (@t3-oss/env-nextjs) enforces strict server/client separation.
// Mock it early to prevent "Attempted to access server-side env" errors.
vi.mock('@/env.mjs', () => ({
  env: {
    // ============ Core Server Variables ============
    NODE_ENV: 'test',
    DB_DIR: '../data',
    DATABASE_URL: 'file:../data/hrskills.db',
    JWT_SECRET: 'test-jwt-secret-32-characters-long-minimum',

    // ============ AI Provider Keys (Mocked) ============
    ANTHROPIC_API_KEY: 'test-anthropic-key-sk-ant-test',
    OPENAI_API_KEY: 'test-openai-key-sk-test',

    // ============ Observability (Phase 2-3) ============
    SENTRY_DSN: undefined,
    SENTRY_ORG: undefined,
    SENTRY_PROJECT: undefined,
    SENTRY_AUTH_TOKEN: undefined,

    // ============ Rate Limiting (Upstash) ============
    ENABLE_UPSTASH_RATE_LIMIT: 'false',
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,

    // ============ Google Workspace (Optional) ============
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    GOOGLE_DRIVE_FOLDER_ID: undefined,

    // ============ Client Variables (NEXT_PUBLIC_*) ============
    NEXT_PUBLIC_APP_NAME: 'HR Command Center',
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED: 'false',
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: 'false',
    NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED: 'false',
  },
}));

// ===================================================================
// Mock Sentry to prevent initialization in tests
// ===================================================================
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  configureScope: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  BrowserTracing: vi.fn(),
  Replay: vi.fn(),
}));

import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

// Extend Vitest matchers with jest-axe for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router (using Vitest's vi instead of Jest's jest)
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.matchMedia (browser API not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ===================================================================
// Mock PerformanceObserver (browser API not available in jsdom)
// ===================================================================
// Provide default mock but allow tests to delete it to test fallback behavior
if (typeof global.PerformanceObserver === 'undefined') {
  class MockPerformanceObserver {
    constructor(callback: PerformanceObserverCallback) {
      // Store callback but don't call it (no performance entries in tests)
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  global.PerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver;
}

// ===================================================================
// Mock HTMLCanvasElement.getContext (jsdom limitation)
// ===================================================================
// Required for axe-core color contrast checks in accessibility tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4), // RGBA
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  };
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
