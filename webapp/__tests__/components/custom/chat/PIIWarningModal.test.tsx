import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PIIWarningModal } from '@/components/custom/chat/PIIWarningModal';

/**
 * Test suite for PIIWarningModal component
 *
 * Tests the PII (Personally Identifiable Information) warning modal that appears
 * when sensitive data is detected in user messages.
 */

// Mock types for Framer Motion components
interface MotionDivProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: unknown;
}

interface MotionButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: unknown;
}

interface AnimatePresenceProps {
  children?: React.ReactNode;
}

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: MotionDivProps) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: MotionButtonProps) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: AnimatePresenceProps) => <>{children}</>,
}));

describe('PIIWarningModal', () => {
  const mockOnEdit = vi.fn();
  const mockOnSendAnyway = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    isOpen: true,
    detectedTypes: ['SSN', 'Email'],
    message: 'This information should not be shared in chat.',
    onEdit: mockOnEdit,
    onSendAnyway: mockOnSendAnyway,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering behavior', () => {
    it('should render when isOpen is true', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Sensitive Information Detected')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<PIIWarningModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should display title', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByText('Sensitive Information Detected')).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(
        screen.getByText('This information should not be shared in chat.')
      ).toBeInTheDocument();
    });

    it('should display detected PII types', () => {
      render(<PIIWarningModal {...defaultProps} detectedTypes={['SSN', 'Email', 'Phone']} />);

      expect(screen.getByText(/SSN, Email, Phone/)).toBeInTheDocument();
    });

    it('should display single PII type', () => {
      render(<PIIWarningModal {...defaultProps} detectedTypes={['Credit Card']} />);

      expect(screen.getByText(/Credit Card/)).toBeInTheDocument();
    });

    it('should display multiple PII types with commas', () => {
      render(<PIIWarningModal {...defaultProps} detectedTypes={['SSN', 'Email']} />);

      expect(screen.getByText(/SSN, Email/)).toBeInTheDocument();
    });

    it('should render AlertTriangle icon', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render Shield icon', () => {
      render(<PIIWarningModal {...defaultProps} />);

      // Shield icon appears in the title area
      const title = screen.getByText('Sensitive Information Detected');
      expect(title.parentElement?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Edit button', () => {
    it('should render Edit Message button', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByText('Edit Message')).toBeInTheDocument();
    });

    it('should call onEdit when clicked', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const editButton = screen.getByText('Edit Message');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should have Edit3 icon', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const editButton = screen.getByText('Edit Message').closest('button');
      const icon = editButton?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const editButton = screen.getByLabelText('Edit message to remove sensitive information');
      expect(editButton).toBeInTheDocument();
    });

    it('should have violet styling', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const editButton = screen.getByText('Edit Message').closest('button');
      expect(editButton).toHaveClass('bg-violet', 'hover:bg-violet-light');
    });
  });

  describe('Send Anyway button', () => {
    it('should render Send Anyway button', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByText('Send Anyway')).toBeInTheDocument();
    });

    it('should call onSendAnyway when clicked', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const sendButton = screen.getByText('Send Anyway');
      fireEvent.click(sendButton);

      expect(mockOnSendAnyway).toHaveBeenCalledTimes(1);
    });

    it('should have Send icon', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const sendButton = screen.getByText('Send Anyway').closest('button');
      const icon = sendButton?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const sendButton = screen.getByLabelText('Send message anyway with sensitive information');
      expect(sendButton).toBeInTheDocument();
    });

    it('should have neutral styling', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const sendButton = screen.getByText('Send Anyway').closest('button');
      expect(sendButton).toHaveClass('bg-white/10', 'hover:bg-white/20');
    });
  });

  describe('Backdrop interaction', () => {
    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      // The backdrop is the outer div with fixed positioning
      const backdrop = container.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when modal content is clicked', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const modalContent = screen.getByRole('alertdialog');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent click propagation from modal content', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const modalContent = screen.getByRole('alertdialog');

      // Click on modal content should not close modal
      fireEvent.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();

      // But clicking backdrop should close
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have alertdialog role', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should have aria-labelledby for title', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'pii-warning-title');
    });

    it('should have aria-describedby for message', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'pii-warning-message');
    });

    it('should have id on title element', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const title = screen.getByText('Sensitive Information Detected');
      expect(title).toHaveAttribute('id', 'pii-warning-title');
    });

    it('should have id on message element', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const message = screen.getByText('This information should not be shared in chat.');
      expect(message).toHaveAttribute('id', 'pii-warning-message');
    });

    it('should have descriptive button labels', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(
        screen.getByLabelText('Edit message to remove sensitive information')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Send message anyway with sensitive information')
      ).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have backdrop blur', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have error gradient background', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const modal = container.querySelector('.from-error\\/20');
      expect(modal).toBeInTheDocument();
    });

    it('should have error border', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const modal = container.querySelector('.border-error\\/50');
      expect(modal).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveClass('rounded-2xl');
    });

    it('should have z-index for overlay', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const backdrop = container.querySelector('.z-50');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('PII types display', () => {
    it('should show label for detected types', () => {
      render(<PIIWarningModal {...defaultProps} />);

      expect(screen.getByText(/Detected:/)).toBeInTheDocument();
    });

    it('should style detected types with error color', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const detectedLabel = screen.getByText(/Detected:/);
      expect(detectedLabel).toHaveClass('text-error');
    });

    it('should handle empty detected types array', () => {
      render(<PIIWarningModal {...defaultProps} detectedTypes={[]} />);

      // Should still render the Detected label
      expect(screen.getByText(/Detected:/)).toBeInTheDocument();
    });

    it('should handle many detected types', () => {
      const manyTypes = ['SSN', 'Email', 'Phone', 'Credit Card', 'Address', 'DOB'];

      render(<PIIWarningModal {...defaultProps} detectedTypes={manyTypes} />);

      expect(screen.getByText(/SSN, Email, Phone, Credit Card, Address, DOB/)).toBeInTheDocument();
    });
  });

  describe('Message display', () => {
    it('should display custom message', () => {
      const customMessage = 'Please remove sensitive data before sending.';

      render(<PIIWarningModal {...defaultProps} message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      render(<PIIWarningModal {...defaultProps} message="" />);

      const messageElement = screen.queryByText(/This information/);
      expect(messageElement).not.toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage = 'A'.repeat(500);

      render(<PIIWarningModal {...defaultProps} message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle message with special characters', () => {
      const specialMessage = 'Message with <script>alert("xss")</script> and & symbols';

      render(<PIIWarningModal {...defaultProps} message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props', () => {
      const { rerender } = render(<PIIWarningModal {...defaultProps} />);

      const firstRender = screen.getByRole('alertdialog');

      rerender(<PIIWarningModal {...defaultProps} />);

      const secondRender = screen.getByRole('alertdialog');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(PIIWarningModal.displayName).toBe('PIIWarningModal');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(<PIIWarningModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      rerender(<PIIWarningModal {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      rerender(<PIIWarningModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      rerender(<PIIWarningModal {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should handle multiple button clicks', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const editButton = screen.getByText('Edit Message');
      fireEvent.click(editButton);
      fireEvent.click(editButton);
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });

    it('should handle clicking both buttons', () => {
      render(<PIIWarningModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Edit Message'));
      fireEvent.click(screen.getByText('Send Anyway'));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnSendAnyway).toHaveBeenCalledTimes(1);
    });

    it('should handle special PII type names', () => {
      const specialTypes = ['Social Security Number', 'Email Address', 'Phone Number'];

      render(<PIIWarningModal {...defaultProps} detectedTypes={specialTypes} />);

      expect(
        screen.getByText(/Social Security Number, Email Address, Phone Number/)
      ).toBeInTheDocument();
    });
  });

  describe('Complete user flows', () => {
    it('should support edit flow', () => {
      render(<PIIWarningModal {...defaultProps} />);

      // User sees warning
      expect(screen.getByText('Sensitive Information Detected')).toBeInTheDocument();
      expect(screen.getByText(/SSN, Email/)).toBeInTheDocument();

      // User clicks edit
      fireEvent.click(screen.getByText('Edit Message'));

      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnSendAnyway).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should support send anyway flow', () => {
      render(<PIIWarningModal {...defaultProps} />);

      // User sees warning
      expect(screen.getByText('Sensitive Information Detected')).toBeInTheDocument();

      // User chooses to send anyway
      fireEvent.click(screen.getByText('Send Anyway'));

      expect(mockOnSendAnyway).toHaveBeenCalled();
      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should support cancel flow (backdrop click)', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      // User clicks outside modal
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnSendAnyway).not.toHaveBeenCalled();
    });
  });

  describe('Layout and positioning', () => {
    it('should center modal on screen', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const backdrop = container.querySelector('.items-center.justify-center');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have max width constraint', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should have padding around content', () => {
      render(<PIIWarningModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveClass('p-6');
    });

    it('should have gap between buttons', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const buttonContainer = container.querySelector('.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should have equal-width buttons', () => {
      const { container } = render(<PIIWarningModal {...defaultProps} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('flex-1');
      });
    });
  });
});
