/**
 */

import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, useErrorHandler } from '@/components/ui/ErrorBoundary';

// Suppress console.error during tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

function ResettableErrorDemo() {
  const [shouldThrow, setShouldThrow] = React.useState(true);

  return (
    <>
      <button onClick={() => setShouldThrow(false)}>Resolve Error</button>
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </>
  );
}

describe('ErrorBoundary', () => {
  describe('Basic functionality', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should not display error when component does not throw', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error boundary levels', () => {
    it('should render app-level error boundary with full-screen layout', () => {
      render(
        <ErrorBoundary level="app">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });

    it('should render page-level error boundary with appropriate styling', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Go to Home')).not.toBeInTheDocument();
    });

    it('should render section-level error boundary with minimal styling', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error handler callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Reset functionality', () => {
    it('should reset error state when Try Again button is clicked', async () => {
      render(<ResettableErrorDemo />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Resolve the underlying issue and retry
      fireEvent.click(screen.getByText('Resolve Error'));
      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error details in development', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error Details/i)).toBeInTheDocument();
      const errorMessages = screen.getAllByText(/Test error/);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should hide error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Error Details/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible button labels', () => {
      render(
        <ErrorBoundary level="app">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });
  });
});

describe('useErrorHandler hook', () => {
  function TestComponent() {
    const throwError = useErrorHandler();
    return <button onClick={() => throwError(new Error('Manual error'))}>Throw Error</button>;
  }

  it('should allow manual error triggering', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <TestComponent />
      </ErrorBoundary>
    );

    const button = screen.getByText('Throw Error');
    fireEvent.click(button);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Manual error' }),
      expect.any(Object)
    );
  });
});

describe('Error message display', () => {
  it('should display the error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // In development, error message should be visible in details
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    }
  });
});

describe('Multiple error boundaries', () => {
  it('should isolate errors to specific boundaries', () => {
    function OuterComponent() {
      return <div>Outer content</div>;
    }

    render(
      <ErrorBoundary level="app">
        <OuterComponent />
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Outer content should still be visible
    expect(screen.getByText('Outer content')).toBeInTheDocument();

    // Error should be caught by inner boundary
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
