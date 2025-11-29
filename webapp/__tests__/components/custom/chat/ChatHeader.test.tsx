import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatHeader } from '@/components/custom/chat/ChatHeader';

/**
 * Test suite for ChatHeader component
 *
 * Tests the header section with conversation ID display and reset button.
 */

// Mock types for Framer Motion
interface MotionButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: unknown;
}

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: MotionButtonProps) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('ChatHeader', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render conversation ID', () => {
      const conversationId = 'conv_12345_abc';

      render(<ChatHeader conversationId={conversationId} onReset={mockOnReset} />);

      expect(screen.getByText(conversationId)).toBeInTheDocument();
    });

    it('should render reset button', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should render reset button text', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      expect(screen.getByText('Reset chat')).toBeInTheDocument();
    });

    it('should render RotateCcw icon', () => {
      const { container } = render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      // Check for SVG element (RotateCcw icon from lucide-react)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Reset button functionality', () => {
    it('should call onReset when button is clicked', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should call onReset multiple times if clicked multiple times', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(3);
    });

    it('should have correct aria-label', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByLabelText('Start a new chat');
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Conversation ID display', () => {
    it('should display conversation ID with monospace font', () => {
      render(<ChatHeader conversationId="conv_123_xyz" onReset={mockOnReset} />);

      const convIdElement = screen.getByText('conv_123_xyz');
      expect(convIdElement).toHaveClass('font-mono');
    });

    it('should display conversation ID with muted color', () => {
      render(<ChatHeader conversationId="conv_123_xyz" onReset={mockOnReset} />);

      const convIdElement = screen.getByText('conv_123_xyz');
      expect(convIdElement).toHaveClass('text-secondary/50');
    });

    it('should display conversation ID in small text', () => {
      render(<ChatHeader conversationId="conv_123_xyz" onReset={mockOnReset} />);

      const convIdElement = screen.getByText('conv_123_xyz');
      expect(convIdElement).toHaveClass('text-xs');
    });

    it('should handle very long conversation IDs', () => {
      const longId = `conv_${'x'.repeat(100)}`;

      render(<ChatHeader conversationId={longId} onReset={mockOnReset} />);

      expect(screen.getByText(longId)).toBeInTheDocument();
    });

    it('should handle short conversation IDs', () => {
      render(<ChatHeader conversationId="c" onReset={mockOnReset} />);

      expect(screen.getByText('c')).toBeInTheDocument();
    });

    it('should handle empty conversation ID', () => {
      render(<ChatHeader conversationId="" onReset={mockOnReset} />);

      const { container } = render(<ChatHeader conversationId="" onReset={mockOnReset} />);
      // Empty string still renders the div
      const convIdElement = container.querySelector('.font-mono');
      expect(convIdElement).toBeInTheDocument();
    });
  });

  describe('Styling and layout', () => {
    it('should have flex layout with space-between', () => {
      const { container } = render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const headerContainer = container.firstChild as HTMLElement;
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should have bottom margin', () => {
      const { container } = render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const headerContainer = container.firstChild as HTMLElement;
      expect(headerContainer).toHaveClass('mb-4');
    });

    it('should have correct button styling', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      expect(resetButton).toHaveClass('flex', 'items-center', 'gap-2', 'px-3', 'py-1.5');
    });

    it('should have hover effects on button', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      expect(resetButton).toHaveClass('hover:bg-white/20');
    });

    it('should have border on button', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const resetButton = screen.getByRole('button', { name: /start a new chat/i });
      expect(resetButton).toHaveClass('border', 'border-white/20');
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props', () => {
      const conversationId = 'conv_test_memo';

      const { rerender } = render(
        <ChatHeader conversationId={conversationId} onReset={mockOnReset} />
      );

      const firstRender = screen.getByText(conversationId);

      rerender(<ChatHeader conversationId={conversationId} onReset={mockOnReset} />);

      const secondRender = screen.getByText(conversationId);

      // Should be the same DOM element (React.memo prevents re-render)
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(ChatHeader.displayName).toBe('ChatHeader');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      const button = screen.getByLabelText('Start a new chat');
      expect(button).toBeInTheDocument();
    });

    it('should have visible text label', () => {
      render(<ChatHeader conversationId="conv_test" onReset={mockOnReset} />);

      expect(screen.getByText('Reset chat')).toBeVisible();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in conversation ID', () => {
      const specialId = 'conv_123!@#$%^&*()_+{}|:"<>?';

      render(<ChatHeader conversationId={specialId} onReset={mockOnReset} />);

      expect(screen.getByText(specialId)).toBeInTheDocument();
    });

    it('should handle numeric conversation ID', () => {
      // TypeScript expects string, but testing runtime behavior
      const numericId = '12345';

      render(<ChatHeader conversationId={numericId} onReset={mockOnReset} />);

      expect(screen.getByText(numericId)).toBeInTheDocument();
    });

    it('should handle conversation ID with spaces', () => {
      const idWithSpaces = 'conv 123 abc';

      render(<ChatHeader conversationId={idWithSpaces} onReset={mockOnReset} />);

      expect(screen.getByText(idWithSpaces)).toBeInTheDocument();
    });

    it('should handle conversation ID with newlines', () => {
      const idWithNewline = 'conv_123\nabc';

      render(<ChatHeader conversationId={idWithNewline} onReset={mockOnReset} />);

      // Newlines should be normalized to spaces for display
      expect(screen.getByText('conv_123 abc')).toBeInTheDocument();
    });
  });

  describe('Component integration', () => {
    it('should render both conversation ID and reset button together', () => {
      const conversationId = 'conv_integration_test';

      render(<ChatHeader conversationId={conversationId} onReset={mockOnReset} />);

      expect(screen.getByText(conversationId)).toBeInTheDocument();
      expect(screen.getByText('Reset chat')).toBeInTheDocument();
    });

    it('should maintain independent functionality of both elements', () => {
      const conversationId = 'conv_test';

      render(<ChatHeader conversationId={conversationId} onReset={mockOnReset} />);

      // Conversation ID should be displayed
      expect(screen.getByText(conversationId)).toBeInTheDocument();

      // Reset button should be clickable
      const resetButton = screen.getByRole('button');
      fireEvent.click(resetButton);
      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe('Real-world conversation IDs', () => {
    it('should handle typical generated conversation ID', () => {
      const typicalId = 'conv_1704110400000_a1b2c3d';

      render(<ChatHeader conversationId={typicalId} onReset={mockOnReset} />);

      expect(screen.getByText(typicalId)).toBeInTheDocument();
    });

    it('should handle UUID-style conversation ID', () => {
      const uuidId = 'conv_550e8400-e29b-41d4-a716-446655440000';

      render(<ChatHeader conversationId={uuidId} onReset={mockOnReset} />);

      expect(screen.getByText(uuidId)).toBeInTheDocument();
    });
  });
});
