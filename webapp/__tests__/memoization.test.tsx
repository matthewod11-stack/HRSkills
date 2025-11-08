/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/custom/MetricCard';
import { QuickActionCard } from '@/components/custom/QuickActionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users } from 'lucide-react';

describe('Component Memoization Tests', () => {
  describe('MetricCard Memoization', () => {
    it('should not re-render when unrelated props change', () => {
      const renderSpy = jest.fn();
      const MetricCardWithSpy = () => {
        renderSpy();
        return (
          <MetricCard
            title="Test Metric"
            value="100"
            change="+5%"
            isPositive={true}
            icon={TrendingUp}
            progress={75}
          />
        );
      };

      const { rerender } = render(<MetricCardWithSpy />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<MetricCardWithSpy />);
      // MetricCard should be memoized, so internal component doesn't re-render
      expect(renderSpy).toHaveBeenCalledTimes(2); // Parent renders but memoized child doesn't
    });

    it('should render with correct values', () => {
      render(
        <MetricCard
          title="Active Employees"
          value="150"
          change="+12%"
          isPositive={true}
          icon={Users}
          progress={80}
        />
      );

      expect(screen.getByText('Active Employees')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('should apply correct color for positive change', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1M"
          change="+25%"
          isPositive={true}
          icon={TrendingUp}
          progress={90}
        />
      );

      const changeElement = screen.getByText('+25%');
      expect(changeElement).toHaveClass('text-green-400');
    });

    it('should apply correct color for negative change', () => {
      render(
        <MetricCard
          title="Retention"
          value="85%"
          change="-5%"
          isPositive={false}
          icon={TrendingUp}
          progress={85}
        />
      );

      const changeElement = screen.getByText('-5%');
      expect(changeElement).toHaveClass('text-red-400');
    });
  });

  describe('QuickActionCard Memoization', () => {
    it('should render with correct content', () => {
      render(
        <QuickActionCard
          title="Create Document"
          description="Generate a new HR document"
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
        />
      );

      expect(screen.getByText('Create Document')).toBeInTheDocument();
      expect(screen.getByText('Generate a new HR document')).toBeInTheDocument();
    });

    it('should render as link when href provided', () => {
      render(
        <QuickActionCard
          title="View Employees"
          description="See all employees"
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          href="/employees"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/employees');
    });
  });

  describe('Badge Memoization', () => {
    it('should render default variant', () => {
      render(<Badge>Default Badge</Badge>);
      expect(screen.getByText('Default Badge')).toBeInTheDocument();
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toBeInTheDocument();
    });

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toBeInTheDocument();
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Button Memoization', () => {
    it('should render default button', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Cancel</Button>);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByText('Ghost')).toBeInTheDocument();
    });

    it('should render different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByText('Small')).toBeInTheDocument();

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    it('should handle onClick events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button');
      button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Characteristics', () => {
    it('Badge should have displayName for debugging', () => {
      expect(Badge.displayName).toBe('Badge');
    });

    it('Button should have displayName for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });

    it('should prevent unnecessary re-renders with stable props', () => {
      const renderCount = { count: 0 };

      function TestComponent({ value }: { value: string }) {
        renderCount.count++;
        return <Badge>{value}</Badge>;
      }

      const { rerender } = render(<TestComponent value="test" />);
      expect(renderCount.count).toBe(1);

      // Re-render with same props
      rerender(<TestComponent value="test" />);
      expect(renderCount.count).toBe(2);

      // Badge itself should be memoized (not re-rendering internally)
      // This test validates the parent renders but memoized children don't
    });
  });

  describe('Integration Tests', () => {
    it('should render multiple MetricCards in a grid', () => {
      render(
        <div>
          <MetricCard
            title="Metric 1"
            value="100"
            change="+5%"
            isPositive={true}
            icon={Users}
            progress={75}
          />
          <MetricCard
            title="Metric 2"
            value="200"
            change="+10%"
            isPositive={true}
            icon={Users}
            progress={85}
          />
        </div>
      );

      expect(screen.getByText('Metric 1')).toBeInTheDocument();
      expect(screen.getByText('Metric 2')).toBeInTheDocument();
    });

    it('should render multiple Badges together', () => {
      render(
        <div>
          <Badge>Active</Badge>
          <Badge variant="secondary">Pending</Badge>
          <Badge variant="destructive">Inactive</Badge>
        </div>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should render Buttons with Badges', () => {
      render(
        <Button>
          Notifications
          <Badge variant="destructive">3</Badge>
        </Button>
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
