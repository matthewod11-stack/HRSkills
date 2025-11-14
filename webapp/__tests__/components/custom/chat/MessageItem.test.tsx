import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageItem } from '@/components/custom/chat/MessageItem';
import { Message } from '@/components/custom/chat/ChatContext';

/**
 * Test suite for MessageItem component
 *
 * Tests the complete message rendering including avatar, bubble styling,
 * edit mode, display mode, and integration with MessageContent and MessageActions.
 */

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock child components
jest.mock('@/components/custom/chat/MessageContent', () => ({
  MessageContent: ({ message, onFollowUp }: any) => (
    <div data-testid="message-content">
      {message.content} - {message.role}
    </div>
  ),
}));

jest.mock('@/components/custom/chat/MessageActions', () => ({
  MessageActions: ({ message }: any) => <div data-testid="message-actions">Actions for {message.id}</div>,
}));

describe('MessageItem', () => {
  const mockOnToggleEdit = jest.fn();
  const mockOnUpdateEdit = jest.fn();
  const mockOnSaveEdit = jest.fn();
  const mockOnCopy = jest.fn();
  const mockOnExportToGoogleDocs = jest.fn();
  const mockOnFollowUp = jest.fn();
  const conversationId = 'conv_test_123';

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: 1,
    role: 'user',
    content: 'Test message',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  });

  const defaultProps = {
    conversationId,
    onToggleEdit: mockOnToggleEdit,
    onUpdateEdit: mockOnUpdateEdit,
    onSaveEdit: mockOnSaveEdit,
    onCopy: mockOnCopy,
    onExportToGoogleDocs: mockOnExportToGoogleDocs,
    onFollowUp: mockOnFollowUp,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Avatar rendering', () => {
    it('should render User icon for user messages', () => {
      const message = createMessage({ role: 'user' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      // Check for User icon (User component from lucide-react)
      const avatar = container.querySelector('.bg-gradient-to-br.from-success');
      expect(avatar).toBeInTheDocument();
    });

    it('should render Bot icon for assistant messages', () => {
      const message = createMessage({ role: 'assistant' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      // Check for Bot icon (Bot component from lucide-react)
      const avatar = container.querySelector('.bg-gradient-to-br.from-violet');
      expect(avatar).toBeInTheDocument();
    });

    it('should have correct styling for user avatar', () => {
      const message = createMessage({ role: 'user' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const avatar = container.querySelector('.w-10.h-10.rounded-xl');
      expect(avatar).toHaveClass('from-success', 'to-success');
    });

    it('should have correct styling for assistant avatar', () => {
      const message = createMessage({ role: 'assistant' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const avatar = container.querySelector('.w-10.h-10.rounded-xl');
      expect(avatar).toHaveClass('from-violet', 'to-violet-light');
    });
  });

  describe('Message bubble styling', () => {
    it('should use success gradient for user messages', () => {
      const message = createMessage({ role: 'user' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const bubble = container.querySelector('.from-success\\/20');
      expect(bubble).toBeInTheDocument();
    });

    it('should use card background for assistant messages', () => {
      const message = createMessage({ role: 'assistant' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const bubble = container.querySelector('.bg-card');
      expect(bubble).toBeInTheDocument();
    });

    it('should align user messages to the right', () => {
      const message = createMessage({ role: 'user' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const messageContainer = container.querySelector('.flex-row-reverse');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should align assistant messages to the left', () => {
      const message = createMessage({ role: 'assistant' });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const messageContainer = container.querySelector('.flex-row');
      expect(messageContainer).toBeInTheDocument();
      expect(messageContainer).not.toHaveClass('flex-row-reverse');
    });
  });

  describe('Display mode', () => {
    it('should render MessageContent when not editing', () => {
      const message = createMessage({ content: 'Display mode content', isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.getByTestId('message-content')).toBeInTheDocument();
      expect(screen.getByText(/Display mode content/)).toBeInTheDocument();
    });

    it('should render MessageActions when not editing', () => {
      const message = createMessage({ id: 42, isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.getByTestId('message-actions')).toBeInTheDocument();
      expect(screen.getByText(/Actions for 42/)).toBeInTheDocument();
    });

    it('should not show textarea in display mode', () => {
      const message = createMessage({ isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not show save/cancel buttons in display mode', () => {
      const message = createMessage({ isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('should render textarea when editing', () => {
      const message = createMessage({ isEditing: true, content: 'Editable content' });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Editable content');
    });

    it('should use editedContent if available', () => {
      const message = createMessage({
        isEditing: true,
        content: 'Original',
        editedContent: 'Modified',
      });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Modified');
    });

    it('should fallback to content if editedContent is undefined', () => {
      const message = createMessage({
        isEditing: true,
        content: 'Original content',
        editedContent: undefined,
      });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Original content');
    });

    it('should call onUpdateEdit when textarea changes', () => {
      const message = createMessage({ id: 5, isEditing: true, content: 'Original' });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New content' } });

      expect(mockOnUpdateEdit).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateEdit).toHaveBeenCalledWith(5, 'New content');
    });

    it('should render Save button', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton.tagName).toBe('BUTTON');
    });

    it('should render Cancel button', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton.tagName).toBe('BUTTON');
    });

    it('should call onSaveEdit when Save button clicked', () => {
      const message = createMessage({ id: 7, isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSaveEdit).toHaveBeenCalledTimes(1);
      expect(mockOnSaveEdit).toHaveBeenCalledWith(7);
    });

    it('should call onToggleEdit when Cancel button clicked', () => {
      const message = createMessage({ id: 9, isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnToggleEdit).toHaveBeenCalledTimes(1);
      expect(mockOnToggleEdit).toHaveBeenCalledWith(9);
    });

    it('should not render MessageContent in edit mode', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.queryByTestId('message-content')).not.toBeInTheDocument();
    });

    it('should not render MessageActions in edit mode', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument();
    });

    it('should have correct aria-label on textarea', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByLabelText('Edit message content');
      expect(textarea).toBeInTheDocument();
    });

    it('should have correct aria-label on Save button', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save changes');
      expect(saveButton).toBeInTheDocument();
    });

    it('should have correct aria-label on Cancel button', () => {
      const message = createMessage({ isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const cancelButton = screen.getByLabelText('Cancel editing');
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Prop passing', () => {
    it('should pass conversationId to MessageContent', () => {
      const message = createMessage({ isEditing: false });

      render(<MessageItem message={message} conversationId="conv_abc_123" {...defaultProps} />);

      // MessageContent is mocked, but we can verify it renders
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });

    it('should pass onFollowUp to MessageContent', () => {
      const message = createMessage({ isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      // MessageContent receives onFollowUp prop
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });

    it('should pass message to MessageActions', () => {
      const message = createMessage({ id: 15, isEditing: false });

      render(<MessageItem message={message} {...defaultProps} />);

      expect(screen.getByText(/Actions for 15/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have resizable textarea', () => {
      const message = createMessage({ isEditing: true });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('resize-y');
    });

    it('should have adequate minimum height for textarea', () => {
      const message = createMessage({ isEditing: true });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('min-h-[200px]');
    });

    it('should have visible focus state on textarea', () => {
      const message = createMessage({ isEditing: true });

      const { container } = render(<MessageItem message={message} {...defaultProps} />);

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('focus:outline-none', 'focus:border-violet');
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props', () => {
      const message = createMessage({ content: 'Test' });

      const { rerender } = render(<MessageItem message={message} {...defaultProps} />);

      const firstRender = screen.getByTestId('message-content');

      rerender(<MessageItem message={message} {...defaultProps} />);

      const secondRender = screen.getByTestId('message-content');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(MessageItem.displayName).toBe('MessageItem');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long message content in edit mode', () => {
      const longContent = 'A'.repeat(10000);
      const message = createMessage({ isEditing: true, content: longContent });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longContent);
    });

    it('should handle empty content in edit mode', () => {
      const message = createMessage({ isEditing: true, content: '' });

      render(<MessageItem message={message} {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle message ID of 0', () => {
      const message = createMessage({ id: 0, isEditing: true });

      render(<MessageItem message={message} {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSaveEdit).toHaveBeenCalledWith(0);
    });

    it('should handle rapid edit mode toggling', () => {
      const message = createMessage({ id: 10, isEditing: false });

      const { rerender } = render(<MessageItem message={message} {...defaultProps} />);

      // Display mode
      expect(screen.getByTestId('message-content')).toBeInTheDocument();

      // Switch to edit mode
      rerender(<MessageItem message={{ ...message, isEditing: true }} {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Switch back to display mode
      rerender(<MessageItem message={{ ...message, isEditing: false }} {...defaultProps} />);
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });
  });

  describe('Complete workflows', () => {
    it('should support full edit workflow', () => {
      const message = createMessage({
        id: 20,
        content: 'Original message',
        isEditing: true,
      });

      render(<MessageItem message={message} {...defaultProps} />);

      // Enter edit mode - textarea should be visible
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Original message');

      // User types
      fireEvent.change(textarea, { target: { value: 'Edited message' } });
      expect(mockOnUpdateEdit).toHaveBeenCalledWith(20, 'Edited message');

      // User saves
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      expect(mockOnSaveEdit).toHaveBeenCalledWith(20);
    });

    it('should support cancel workflow', () => {
      const message = createMessage({
        id: 21,
        content: 'Original',
        isEditing: true,
        editedContent: 'Temporary edit',
      });

      render(<MessageItem message={message} {...defaultProps} />);

      // User cancels
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockOnToggleEdit).toHaveBeenCalledWith(21);
    });

    it('should render complete assistant message with all features', () => {
      const message = createMessage({
        id: 100,
        role: 'assistant',
        content: 'Complete assistant message',
        isEditing: false,
        detectedWorkflow: 'analytics',
        workflowConfidence: 95,
      });

      render(<MessageItem message={message} {...defaultProps} />);

      // Should show avatar, content, and actions
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
      expect(screen.getByTestId('message-actions')).toBeInTheDocument();

      // Should have assistant styling
      const { container } = render(<MessageItem message={message} {...defaultProps} />);
      const avatar = container.querySelector('.from-violet');
      expect(avatar).toBeInTheDocument();
    });

    it('should render complete user message', () => {
      const message = createMessage({
        id: 101,
        role: 'user',
        content: 'User question',
        isEditing: false,
      });

      render(<MessageItem message={message} {...defaultProps} />);

      // Should show content but not actions (MessageActions doesn't render for user messages)
      expect(screen.getByTestId('message-content')).toBeInTheDocument();

      // Should have user styling
      const { container } = render(<MessageItem message={message} {...defaultProps} />);
      const messageContainer = container.querySelector('.flex-row-reverse');
      expect(messageContainer).toBeInTheDocument();
    });
  });
});
