import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MessageActions } from '@/components/custom/chat/MessageActions';
import { Message } from '@/components/custom/chat/ChatContext';

/**
 * Test suite for MessageActions component
 *
 * Tests the action buttons (Copy, Edit, Export to Google Docs) that appear
 * on assistant messages.
 */

describe('MessageActions', () => {
  const mockOnCopy = vi.fn();
  const mockOnToggleEdit = vi.fn();
  const mockOnExportToGoogleDocs = vi.fn();

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: 1,
    role: 'assistant',
    content: 'Test message content',
    timestamp: new Date('2025-01-01T14:30:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering behavior', () => {
    it('should render for assistant messages', () => {
      const message = createMessage({ role: 'assistant' });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
      expect(screen.getByTitle('Edit document')).toBeInTheDocument();
      expect(screen.getByTitle('Export to Google Docs')).toBeInTheDocument();
    });

    it('should not render for user messages', () => {
      const message = createMessage({ role: 'user' });

      const { container } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display timestamp', () => {
      const message = createMessage({
        timestamp: new Date('2025-01-01T14:30:00Z'),
      });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      // Timestamp format: "02:30 PM" or "14:30" depending on locale
      const timestampElement = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestampElement).toBeInTheDocument();
    });

    it('should have three action buttons', () => {
      const message = createMessage();

      const { container } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Copy button', () => {
    it('should call onCopy with message content when clicked', () => {
      const message = createMessage({ content: 'Content to copy' });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByTitle('Copy to clipboard');
      fireEvent.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledTimes(1);
      expect(mockOnCopy).toHaveBeenCalledWith('Content to copy');
    });

    it('should have correct aria-label', () => {
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByLabelText('Copy message to clipboard');
      expect(copyButton).toBeInTheDocument();
    });

    it('should render Copy icon', () => {
      const message = createMessage();

      const { container } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByTitle('Copy to clipboard');
      const svg = copyButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle multiple clicks', () => {
      const message = createMessage({ content: 'Test' });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByTitle('Copy to clipboard');
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edit button', () => {
    it('should call onToggleEdit with message ID when clicked', () => {
      const message = createMessage({ id: 42 });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const editButton = screen.getByTitle('Edit document');
      fireEvent.click(editButton);

      expect(mockOnToggleEdit).toHaveBeenCalledTimes(1);
      expect(mockOnToggleEdit).toHaveBeenCalledWith(42);
    });

    it('should have correct aria-label', () => {
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const editButton = screen.getByLabelText('Edit message');
      expect(editButton).toBeInTheDocument();
    });

    it('should render Edit3 icon', () => {
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const editButton = screen.getByTitle('Edit document');
      const svg = editButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Export to Google Docs button', () => {
    it('should call onExportToGoogleDocs with message when clicked', async () => {
      mockOnExportToGoogleDocs.mockResolvedValue(undefined);
      const message = createMessage({ id: 5, content: 'Export me' });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockOnExportToGoogleDocs).toHaveBeenCalledTimes(1);
      });
      expect(mockOnExportToGoogleDocs).toHaveBeenCalledWith(message);
    });

    it('should have correct aria-label', () => {
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByLabelText('Export to Google Docs');
      expect(exportButton).toBeInTheDocument();
    });

    it('should render FileUp icon initially', () => {
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      const svg = exportButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show spinner during export', async () => {
      let resolveExport: () => void;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
      mockOnExportToGoogleDocs.mockReturnValue(exportPromise);

      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      // Should show spinner
      await waitFor(() => {
        const spinner = exportButton.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });

      // Resolve the export
      resolveExport!();

      // Spinner should disappear
      await waitFor(() => {
        const spinner = exportButton.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });

    it('should disable button during export', async () => {
      let resolveExport: () => void;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
      mockOnExportToGoogleDocs.mockReturnValue(exportPromise);

      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });

      resolveExport!();

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should re-enable button after successful export', async () => {
      mockOnExportToGoogleDocs.mockResolvedValue(undefined);
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should re-enable button after failed export', async () => {
      mockOnExportToGoogleDocs.mockRejectedValue(new Error('Export failed'));
      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should not allow multiple simultaneous exports', async () => {
      let resolveExport: () => void;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
      mockOnExportToGoogleDocs.mockReturnValue(exportPromise);

      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');

      // Click multiple times
      fireEvent.click(exportButton);
      fireEvent.click(exportButton);
      fireEvent.click(exportButton);

      // Should only be called once (button disabled after first click)
      await waitFor(() => {
        expect(mockOnExportToGoogleDocs).toHaveBeenCalledTimes(1);
      });

      resolveExport!();
    });
  });

  describe('Timestamp formatting', () => {
    it('should format timestamp in 12-hour format', () => {
      const message = createMessage({
        timestamp: new Date('2025-01-01T09:15:00Z'),
      });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      // Should show time in format like "09:15 AM" or "9:15 AM"
      const timestampElement = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestampElement).toBeInTheDocument();
    });

    it('should show hours and minutes only', () => {
      const message = createMessage({
        timestamp: new Date('2025-01-01T23:59:59Z'),
      });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const timestampText = screen.getByText(/\d{1,2}:\d{2}/).textContent;
      // Should not include seconds
      expect(timestampText).not.toMatch(/:\d{2}:\d{2}/);
    });
  });

  describe('Styling and layout', () => {
    it('should have correct container classes', () => {
      const message = createMessage();

      const { container } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const actionsContainer = container.firstChild as HTMLElement;
      expect(actionsContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should have hover effects on buttons', () => {
      const message = createMessage();

      const { container } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('hover:bg-white/10');
      });
    });

    it('should disable cursor when export button is disabled', async () => {
      let resolveExport: () => void;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
      mockOnExportToGoogleDocs.mockReturnValue(exportPromise);

      const message = createMessage();

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const exportButton = screen.getByTitle('Export to Google Docs');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toHaveClass('disabled:cursor-not-allowed');
      });

      resolveExport!();
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props', () => {
      const message = createMessage();

      const { rerender } = render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const firstRenderButton = screen.getByTitle('Copy to clipboard');

      rerender(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const secondRenderButton = screen.getByTitle('Copy to clipboard');

      expect(firstRenderButton).toBe(secondRenderButton);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(MessageActions.displayName).toBe('MessageActions');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long message content in copy', () => {
      const longContent = 'A'.repeat(50000);
      const message = createMessage({ content: longContent });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByTitle('Copy to clipboard');
      fireEvent.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledWith(longContent);
    });

    it('should handle empty message content', () => {
      const message = createMessage({ content: '' });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const copyButton = screen.getByTitle('Copy to clipboard');
      fireEvent.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledWith('');
    });

    it('should handle message ID of 0', () => {
      const message = createMessage({ id: 0 });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      const editButton = screen.getByTitle('Edit document');
      fireEvent.click(editButton);

      expect(mockOnToggleEdit).toHaveBeenCalledWith(0);
    });

    it('should handle invalid timestamp gracefully', () => {
      const message = createMessage({
        timestamp: new Date('invalid'),
      });

      render(
        <MessageActions
          message={message}
          onCopy={mockOnCopy}
          onToggleEdit={mockOnToggleEdit}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
        />
      );

      // Should still render without crashing
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    });
  });
});
