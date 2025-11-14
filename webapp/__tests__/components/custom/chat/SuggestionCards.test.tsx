import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionCards } from '@/components/custom/chat/SuggestionCards';

/**
 * Test suite for SuggestionCards component
 *
 * Tests the quick action suggestion cards that appear when the chat is empty.
 */

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('SuggestionCards', () => {
  const mockOnSuggestionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all three default suggestions', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      expect(screen.getByText('Generate an offer')).toBeInTheDocument();
      expect(screen.getByText('Create a PIP')).toBeInTheDocument();
      expect(screen.getByText('Write a JD')).toBeInTheDocument();
    });

    it('should render suggestion header text', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      expect(screen.getByText('Try asking me about:')).toBeInTheDocument();
    });

    it('should render icons for each suggestion', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      // Should have 3 SVG icons (one per suggestion)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });

    it('should use grid layout', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const gridContainer = container.querySelector('.grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have gap between cards', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const gridContainer = container.querySelector('.gap-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Click handlers', () => {
    it('should call onSuggestionClick with correct text for first suggestion', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const firstSuggestion = screen.getByText('Generate an offer');
      fireEvent.click(firstSuggestion);

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(1);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Generate an offer');
    });

    it('should call onSuggestionClick with correct text for second suggestion', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const secondSuggestion = screen.getByText('Create a PIP');
      fireEvent.click(secondSuggestion);

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(1);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Create a PIP');
    });

    it('should call onSuggestionClick with correct text for third suggestion', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const thirdSuggestion = screen.getByText('Write a JD');
      fireEvent.click(thirdSuggestion);

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(1);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Write a JD');
    });

    it('should handle multiple clicks on same suggestion', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const suggestion = screen.getByText('Generate an offer');
      fireEvent.click(suggestion);
      fireEvent.click(suggestion);
      fireEvent.click(suggestion);

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(3);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Generate an offer');
    });

    it('should handle clicks on different suggestions', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      fireEvent.click(screen.getByText('Generate an offer'));
      fireEvent.click(screen.getByText('Create a PIP'));
      fireEvent.click(screen.getByText('Write a JD'));

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(3);
      expect(mockOnSuggestionClick).toHaveBeenNthCalledWith(1, 'Generate an offer');
      expect(mockOnSuggestionClick).toHaveBeenNthCalledWith(2, 'Create a PIP');
      expect(mockOnSuggestionClick).toHaveBeenNthCalledWith(3, 'Write a JD');
    });
  });

  describe('Accessibility', () => {
    it('should have button elements for suggestions', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should have aria-labels for all suggestion buttons', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      expect(screen.getByLabelText('Suggest: Generate an offer')).toBeInTheDocument();
      expect(screen.getByLabelText('Suggest: Create a PIP')).toBeInTheDocument();
      expect(screen.getByLabelText('Suggest: Write a JD')).toBeInTheDocument();
    });

    it('should have visible text on all buttons', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      expect(screen.getByText('Generate an offer')).toBeVisible();
      expect(screen.getByText('Create a PIP')).toBeVisible();
      expect(screen.getByText('Write a JD')).toBeVisible();
    });

    it('should have descriptive header for screen readers', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const header = screen.getByText('Try asking me about:');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('P');
    });
  });

  describe('Styling', () => {
    it('should have card styling on buttons', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('bg-card', 'hover:bg-white/10', 'border', 'border-border');
      });
    });

    it('should have rounded corners on buttons', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('rounded-xl');
      });
    });

    it('should have padding on buttons', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('p-3');
      });
    });

    it('should have flex layout for icon and text', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('flex', 'items-center', 'gap-3');
      });
    });

    it('should have hover effects', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('hover:border-violet/50', 'hover:shadow-glow-accent');
      });
    });

    it('should have gradient background on icon containers', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const iconContainers = container.querySelectorAll('.bg-gradient-to-br');
      expect(iconContainers.length).toBeGreaterThanOrEqual(3);
    });

    it('should have consistent icon sizing', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const iconContainers = container.querySelectorAll('.w-8.h-8');
      expect(iconContainers.length).toBe(3);
    });
  });

  describe('Icon rendering', () => {
    it('should render FileText icon for first suggestion', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      // First suggestion uses FileText icon
      const buttons = container.querySelectorAll('button');
      const firstButton = buttons[0];
      const icon = firstButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Users icon for second suggestion', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      const secondButton = buttons[1];
      const icon = secondButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Zap icon for third suggestion', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      const thirdButton = buttons[2];
      const icon = thirdButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct icon size', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props', () => {
      const { rerender } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const firstRender = screen.getByText('Generate an offer');

      rerender(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const secondRender = screen.getByText('Generate an offer');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(SuggestionCards.displayName).toBe('SuggestionCards');
    });
  });

  describe('Layout and positioning', () => {
    it('should have padding on container', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('px-6', 'pb-4');
    });

    it('should have margin on header', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const header = screen.getByText('Try asking me about:');
      expect(header).toHaveClass('mb-3');
    });

    it('should have small font size for header', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const header = screen.getByText('Try asking me about:');
      expect(header).toHaveClass('text-sm');
    });

    it('should have medium font weight for header', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const header = screen.getByText('Try asking me about:');
      expect(header).toHaveClass('font-medium');
    });

    it('should have secondary text color for header', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const header = screen.getByText('Try asking me about:');
      expect(header).toHaveClass('text-secondary');
    });
  });

  describe('Button text styling', () => {
    it('should have small font size for button text', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttonTexts = container.querySelectorAll('button span');
      buttonTexts.forEach((text) => {
        expect(text).toHaveClass('text-sm');
      });
    });

    it('should have medium font weight for button text', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttonTexts = container.querySelectorAll('button span');
      buttonTexts.forEach((text) => {
        expect(text).toHaveClass('font-medium');
      });
    });

    it('should align text to left', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('text-left');
      });
    });
  });

  describe('Default suggestions configuration', () => {
    it('should have exactly 3 suggestions', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);
    });

    it('should use consistent suggestion structure', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      // All suggestions should be buttons with icons and text
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.querySelector('svg')).toBeInTheDocument();
        expect(button.textContent).toBeTruthy();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid successive clicks', () => {
      render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const button = screen.getByText('Generate an offer');

      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(mockOnSuggestionClick).toHaveBeenCalledTimes(10);
    });

    it('should maintain callback reference stability', () => {
      const callback = jest.fn();

      const { rerender } = render(<SuggestionCards onSuggestionClick={callback} />);

      const button = screen.getByText('Generate an offer');
      fireEvent.click(button);

      expect(callback).toHaveBeenCalledTimes(1);

      rerender(<SuggestionCards onSuggestionClick={callback} />);

      fireEvent.click(button);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive design', () => {
    it('should use grid layout that adapts to screen size', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-3');
    });

    it('should have flexible icon containers', () => {
      const { container } = render(<SuggestionCards onSuggestionClick={mockOnSuggestionClick} />);

      const iconContainers = container.querySelectorAll('.flex-shrink-0');
      expect(iconContainers.length).toBe(3);
    });
  });
});
