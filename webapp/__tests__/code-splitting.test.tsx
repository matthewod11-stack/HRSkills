/**
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import {
  MetricCardSkeleton,
  ChatMessageSkeleton,
  DialogSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '@/components/ui/skeletons';

describe('Code Splitting & Lazy Loading Tests', () => {
  describe('Skeleton Components', () => {
    describe('MetricCardSkeleton', () => {
      it('should render skeleton with correct structure', () => {
        render(<MetricCardSkeleton />);

        // Check for skeleton elements
        const skeleton = document.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();

        // Check for backdrop blur effect
        expect(skeleton).toHaveClass('backdrop-blur-xl');
        expect(skeleton).toHaveClass('bg-black/40');
      });

      it('should have correct layout structure', () => {
        const { container } = render(<MetricCardSkeleton />);

        // Check for title skeleton
        const titleSkeleton = container.querySelector('.h-4.w-24');
        expect(titleSkeleton).toBeInTheDocument();

        // Check for value skeleton
        const valueSkeleton = container.querySelector('.h-8.w-16');
        expect(valueSkeleton).toBeInTheDocument();

        // Check for icon circle skeleton
        const iconSkeleton = container.querySelector('.w-20.h-20.rounded-full');
        expect(iconSkeleton).toBeInTheDocument();
      });
    });

    describe('ChatMessageSkeleton', () => {
      it('should render user message skeleton', () => {
        const { container } = render(<ChatMessageSkeleton isUser={true} />);

        // Check for user message styling
        const messageContainer = container.querySelector('.justify-end');
        expect(messageContainer).toBeInTheDocument();

        // Check for gradient background
        const messageBubble = container.querySelector('.from-purple-500\\/20');
        expect(messageBubble).toBeInTheDocument();
      });

      it('should render assistant message skeleton', () => {
        const { container } = render(<ChatMessageSkeleton isUser={false} />);

        // Check for assistant message styling
        const messageContainer = container.querySelector('.justify-start');
        expect(messageContainer).toBeInTheDocument();

        // Check for assistant bubble
        const messageBubble = container.querySelector('.bg-white\\/5');
        expect(messageBubble).toBeInTheDocument();
      });

      it('should have pulsing animation', () => {
        const { container } = render(<ChatMessageSkeleton />);

        const skeleton = container.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();
      });
    });

    describe('DialogSkeleton', () => {
      it('should render dialog with backdrop', () => {
        const { container } = render(<DialogSkeleton />);

        // Check for backdrop
        const backdrop = container.querySelector('.bg-black\\/80');
        expect(backdrop).toBeInTheDocument();

        // Check for dialog content
        const dialogContent = container.querySelector('.bg-gray-900');
        expect(dialogContent).toBeInTheDocument();
      });

      it('should be centered on screen', () => {
        const { container } = render(<DialogSkeleton />);

        const wrapper = container.querySelector('.items-center.justify-center');
        expect(wrapper).toBeInTheDocument();
      });

      it('should have header, content, and button skeletons', () => {
        const { container } = render(<DialogSkeleton />);

        // Check for multiple skeleton sections
        const skeletons = container.querySelectorAll('.bg-white\\/10.rounded');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    describe('ChartSkeleton', () => {
      it('should render with default height', () => {
        const { container } = render(<ChartSkeleton />);

        const chartArea = container.querySelector('[style*="height"]');
        expect(chartArea).toBeInTheDocument();
      });

      it('should render with custom height', () => {
        const { container } = render(<ChartSkeleton height={500} />);

        const chartArea = container.querySelector('[style*="500px"]');
        expect(chartArea).toBeInTheDocument();
      });

      it('should render title when enabled', () => {
        const { container } = render(<ChartSkeleton title={true} />);

        // Check for title skeleton
        const titleSkeleton = container.querySelector('.h-6.w-1\\/4');
        expect(titleSkeleton).toBeInTheDocument();
      });

      it('should render bar elements', () => {
        const { container } = render(<ChartSkeleton />);

        // Check for bar placeholders
        const bars = container.querySelectorAll('.bg-white\\/10.rounded-t');
        expect(bars.length).toBe(8);
      });

      it('should render legend', () => {
        const { container } = render(<ChartSkeleton />);

        // Check for legend items
        const legendItems = container.querySelectorAll('.w-4.h-4.bg-white\\/10.rounded');
        expect(legendItems.length).toBe(3);
      });
    });

    describe('TableSkeleton', () => {
      it('should render with default rows and columns', () => {
        const { container } = render(<TableSkeleton />);

        // Default is 5 rows
        const rows = container.querySelectorAll('.border-b');
        expect(rows.length).toBeGreaterThanOrEqual(5);
      });

      it('should render with custom rows and columns', () => {
        const { container } = render(<TableSkeleton rows={10} columns={6} />);

        // Check for 10 rows
        const rows = container.querySelectorAll('.border-b');
        expect(rows.length).toBeGreaterThanOrEqual(10);
      });

      it('should have header and body', () => {
        const { container } = render(<TableSkeleton />);

        // Check for header
        const header = container.querySelector('.rounded-t-lg');
        expect(header).toBeInTheDocument();

        // Check for body
        const body = container.querySelector('.rounded-b-lg');
        expect(body).toBeInTheDocument();
      });
    });
  });

  describe('Lazy Loading Behavior', () => {
    it('should export all skeleton components', () => {
      expect(MetricCardSkeleton).toBeDefined();
      expect(ChatMessageSkeleton).toBeDefined();
      expect(DialogSkeleton).toBeDefined();
      expect(ChartSkeleton).toBeDefined();
      expect(TableSkeleton).toBeDefined();
    });

    it('skeletons should render immediately without suspense', () => {
      const { container: metricContainer } = render(<MetricCardSkeleton />);
      const { container: dialogContainer } = render(<DialogSkeleton />);
      const { container: chartContainer } = render(<ChartSkeleton />);

      // All should render immediately
      expect(metricContainer.firstChild).toBeInTheDocument();
      expect(dialogContainer.firstChild).toBeInTheDocument();
      expect(chartContainer.firstChild).toBeInTheDocument();
    });
  });

  describe('Animation & Styling', () => {
    it('skeletons should have pulse animation', () => {
      const skeletons = [
        <MetricCardSkeleton key="metric" />,
        <ChatMessageSkeleton key="chat" />,
        <DialogSkeleton key="dialog" />,
        <ChartSkeleton key="chart" />,
        <TableSkeleton key="table" />,
      ];

      skeletons.forEach((skeleton, index) => {
        const { container } = render(skeleton);
        const pulseElement = container.querySelector('.animate-pulse');
        expect(pulseElement).toBeInTheDocument();
      });
    });

    it('skeletons should have consistent dark theme styling', () => {
      const { container: metricContainer } = render(<MetricCardSkeleton />);
      const { container: dialogContainer } = render(<DialogSkeleton />);
      const { container: chartContainer } = render(<ChartSkeleton />);

      // Check for bg-white/10 pattern (common skeleton color)
      const metricSkeletons = metricContainer.querySelectorAll('.bg-white\\/10');
      const dialogSkeletons = dialogContainer.querySelectorAll('.bg-white\\/10');
      const chartSkeletons = chartContainer.querySelectorAll('.bg-white\\/10');

      expect(metricSkeletons.length).toBeGreaterThan(0);
      expect(dialogSkeletons.length).toBeGreaterThan(0);
      expect(chartSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('MetricCardSkeleton should not have interactive elements', () => {
      const { container } = render(<MetricCardSkeleton />);

      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input, textarea, select');

      expect(buttons.length).toBe(0);
      expect(links.length).toBe(0);
      expect(inputs.length).toBe(0);
    });

    it('skeletons should be non-interactive during loading', () => {
      const { container } = render(<TableSkeleton />);

      // Skeleton should not have clickable elements
      const interactive = container.querySelectorAll('button, a, input, select, textarea');
      expect(interactive.length).toBe(0);
    });
  });
});
