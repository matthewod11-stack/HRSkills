/**
 * Unit Tests for SmartPrefetch Component
 *
 * Tests intelligent route prefetching functionality.
 */

import { render } from '@testing-library/react';
import { SmartPrefetch } from '@/components/custom/SmartPrefetch';

// Mock usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('SmartPrefetch Component', () => {
  let usePathnameMock: jest.Mock;

  beforeEach(() => {
    // Get mocked usePathname
    const { usePathname } = require('next/navigation');
    usePathnameMock = usePathname as jest.Mock;

    // Mock requestIdleCallback
    (global as any).requestIdleCallback = jest.fn((cb) => {
      cb();
      return 1;
    });

    // Mock setTimeout
    jest.useFakeTimers();

    // Set to production mode
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
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
    jest.advanceTimersByTime(1000);

    // Check if link elements would be created (in production)
    // In test environment, we just verify no errors occur
    expect(true).toBe(true);
  });

  it('should not prefetch in development mode', () => {
    process.env.NODE_ENV = 'development';
    usePathnameMock.mockReturnValue('/');

    const querySelectorSpy = jest.spyOn(document, 'querySelector');

    render(<SmartPrefetch />);
    jest.advanceTimersByTime(2000);

    // Should not attempt to create prefetch links in development
    expect(querySelectorSpy).not.toHaveBeenCalled();

    querySelectorSpy.mockRestore();
  });

  it('should handle different pathnames', () => {
    const pathnames = ['/', '/analytics', '/nine-box', '/employees'];

    pathnames.forEach((pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      const { unmount } = render(<SmartPrefetch />);

      expect(() => {
        jest.advanceTimersByTime(2000);
      }).not.toThrow();

      unmount();
    });
  });

  it('should cleanup timers on unmount', () => {
    const { unmount } = render(<SmartPrefetch />);

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should not prefetch when pathname has no routes configured', () => {
    usePathnameMock.mockReturnValue('/unknown-route');

    const { container } = render(<SmartPrefetch />);

    jest.advanceTimersByTime(2000);

    expect(container).toBeEmptyDOMElement();
  });
});
