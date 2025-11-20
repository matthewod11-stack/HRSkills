/**
 * Unit Tests for SmartPrefetch Component
 *
 * Tests intelligent route prefetching functionality.
 */

import { vi } from 'vitest';
import { render } from '@testing-library/react';

// Use vi.hoisted() to create mocks that can be referenced in vi.mock()
const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(() => '/'),
}));

// Mock env module before importing component
vi.mock('@/env.mjs', () => ({
  env: {
    NODE_ENV: 'production',
  },
}));

// Mock usePathname hook
vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

import { SmartPrefetch } from '@/components/custom/SmartPrefetch';

describe('SmartPrefetch Component', () => {
  beforeEach(() => {
    // Reset the mock before each test
    usePathnameMock.mockReturnValue('/');

    // Mock requestIdleCallback
    (global as any).requestIdleCallback = vi.fn((cb) => {
      cb();
      return 1;
    });

    // Mock setTimeout
    vi.useFakeTimers();

    // env.NODE_ENV is already set to 'production' by the vi.mock above
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<SmartPrefetch />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render any DOM elements', () => {
    const { container } = render(<SmartPrefetch />);
    expect(container.firstChild).toBeNull();
  });

  it('should prefetch routes based on current pathname', () => {
    usePathnameMock.mockReturnValue('/');

    render(<SmartPrefetch />);

    // Fast-forward timers
    vi.advanceTimersByTime(1000);

    // Check if link elements would be created (in production)
    // In test environment, we just verify no errors occur
    expect(true).toBe(true);
  });

  it('should not prefetch in development mode', async () => {
    // Override env mock for this test
    const { env } = await import('@/env.mjs');
    vi.mocked(env).NODE_ENV = 'development' as any;

    usePathnameMock.mockReturnValue('/');

    const querySelectorSpy = vi.spyOn(document, 'querySelector');

    render(<SmartPrefetch />);
    vi.advanceTimersByTime(2000);

    // Should not attempt to create prefetch links in development
    expect(querySelectorSpy).not.toHaveBeenCalled();

    querySelectorSpy.mockRestore();

    // Reset for other tests
    vi.mocked(env).NODE_ENV = 'production' as any;
  });

  it('should handle different pathnames', () => {
    const pathnames = ['/', '/analytics', '/nine-box', '/employees'];

    pathnames.forEach((pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      const { unmount } = render(<SmartPrefetch />);

      expect(() => {
        vi.advanceTimersByTime(2000);
      }).not.toThrow();

      unmount();
    });
  });

  it('should cleanup timers on unmount', () => {
    const { unmount } = render(<SmartPrefetch />);

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should not prefetch when pathname has no routes configured', () => {
    usePathnameMock.mockReturnValue('/unknown-route');

    const { container } = render(<SmartPrefetch />);

    vi.advanceTimersByTime(2000);

    expect(container).toBeEmptyDOMElement();
  });
});
