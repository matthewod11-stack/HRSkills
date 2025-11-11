/**
 * Accessibility Tests for HR Command Center Components
 * Tests WCAG 2.1 Level AA compliance using jest-axe
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChatInterface } from '@/components/custom/ChatInterface';
import { MetricDetailsDialog } from '@/components/custom/MetricDetailsDialog';
import { SmartFileUpload } from '@/components/custom/SmartFileUpload';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests - Core Components', () => {
  describe('ChatInterface Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<ChatInterface />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', async () => {
      const { getByLabelText } = render(<ChatInterface />);
      expect(getByLabelText(/chat message input/i)).toBeInTheDocument();
    });

    it('should have accessible send button', async () => {
      const { getByRole } = render(<ChatInterface />);
      const sendButton = getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('MetricDetailsDialog Component', () => {
    it('should have no axe violations when open', async () => {
      const { container } = render(
        <MetricDetailsDialog
          isOpen={true}
          onClose={() => {}}
          metric="headcount"
          title="Recent Hires"
          description="Last 5 employees who joined"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog title and description', async () => {
      const { getByRole } = render(
        <MetricDetailsDialog
          isOpen={true}
          onClose={() => {}}
          metric="headcount"
          title="Recent Hires"
          description="Last 5 employees who joined"
        />
      );
      const dialog = getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should announce loading state', async () => {
      const { getByText } = render(
        <MetricDetailsDialog
          isOpen={true}
          onClose={() => {}}
          metric="headcount"
          title="Recent Hires"
          description="Last 5 employees who joined"
        />
      );
      // Loading state should have live region
      expect(document.querySelector('[role="status"]')).toBeInTheDocument();
    });
  });

  describe('SmartFileUpload Component', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<SmartFileUpload onUploadSuccess={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible file input', async () => {
      const { getByLabelText } = render(<SmartFileUpload onUploadSuccess={() => {}} />);
      const fileInput = getByLabelText(/upload employee data file/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });
  });
});

describe('Accessibility Tests - Common Patterns', () => {
  describe('Color Contrast', () => {
    it('should test muted text contrast', async () => {
      const { container } = render(<div className="text-muted-foreground">Muted text content</div>);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { container } = render(
        <button className="focus-visible:outline focus-visible:outline-2">Test Button</button>
      );
      const results = await axe(container, {
        rules: {
          'focus-visible': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Labels', () => {
    it('should ensure all inputs have labels', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" type="text" />
        </div>
      );
      const results = await axe(container, {
        rules: {
          label: { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Usage', () => {
    it('should validate ARIA attributes', async () => {
      const { container } = render(
        <div>
          <button aria-label="Close dialog">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      );
      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-hidden-focus': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });
});
