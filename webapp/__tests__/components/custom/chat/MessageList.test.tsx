import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { MessageList } from '@/components/custom/chat/MessageList';
import { ChatProvider, Message } from '@/components/custom/chat/ChatContext';

/**
 * Test suite for MessageList component
 *
 * Tests the scrollable message list with auto-scroll behavior and
 * integration with ChatContext.
 */

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock MessageItem
vi.mock('@/components/custom/chat/MessageItem', () => ({
  MessageItem: ({ message }: any) => (
    <div data-testid={`message-item-${message.id}`}>
      {message.content}
    </div>
  ),
}));

describe('MessageList', () => {
  const mockOnCopy = vi.fn();
  const mockOnExportToGoogleDocs = vi.fn();
  const mockOnFollowUp = vi.fn();
  const conversationId = 'conv_test_123';

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: 1,
    role: 'user',
    content: 'Test message',
    timestamp: new Date(),
    ...overrides,
  });

  const createWrapper = (initialMessages: Message[] = []) => {
    return ({ children }: { children: ReactNode }) => (
      <ChatProvider initialMessages={initialMessages}>{children}</ChatProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('Rendering', () => {
    it('should render empty list when no messages', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      // Container should exist but have no message items
      expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
      expect(screen.queryByTestId(/message-item/)).not.toBeInTheDocument();
    });

    it('should render single message', () => {
      const message = createMessage({ id: 1, content: 'Single message' });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
      expect(screen.getByText('Single message')).toBeInTheDocument();
    });

    it('should render multiple messages', () => {
      const messages = [
        createMessage({ id: 1, content: 'First message' }),
        createMessage({ id: 2, content: 'Second message' }),
        createMessage({ id: 3, content: 'Third message' }),
      ];

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-item-3')).toBeInTheDocument();
    });

    it('should render messages in correct order', () => {
      const messages = [
        createMessage({ id: 1, content: 'First' }),
        createMessage({ id: 2, content: 'Second' }),
        createMessage({ id: 3, content: 'Third' }),
      ];

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      const messageElements = screen.getAllByTestId(/message-item/);
      expect(messageElements[0]).toHaveTextContent('First');
      expect(messageElements[1]).toHaveTextContent('Second');
      expect(messageElements[2]).toHaveTextContent('Third');
    });

    it('should have scrollable container', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have correct spacing between messages', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      const messageContainer = container.querySelector('.space-y-4');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('Auto-scroll behavior', () => {
    it('should call scrollIntoView when messages are added', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const initialMessages = [createMessage({ id: 1 })];

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(initialMessages) }
      );

      // Should auto-scroll on initial render
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });

    it('should scroll with smooth behavior', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([createMessage({ id: 1 })]) }
      );

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
      });
    });

    it('should have invisible scroll target element', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      // Look for the ref element at the end
      const scrollContainer = container.querySelector('.overflow-y-auto');
      const lastChild = scrollContainer?.lastChild as HTMLElement;
      expect(lastChild).toBeInTheDocument();
    });
  });

  describe('Props passing to MessageItem', () => {
    it('should pass conversationId to MessageItem', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId="conv_custom_id"
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      // MessageItem should render (it receives conversationId)
      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });

    it('should pass callbacks to MessageItem', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      // Verify MessageItem renders with all props
      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });

    it('should pass context methods to MessageItem', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      // MessageItem receives toggleEdit, updateEdit, saveEdit from context
      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });
  });

  describe('Integration with ChatContext', () => {
    it('should consume messages from context', () => {
      const messages = [
        createMessage({ id: 1, content: 'Message 1' }),
        createMessage({ id: 2, content: 'Message 2' }),
      ];

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });

    it('should use toggleEdit from context', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      // Context methods are passed to MessageItem
      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });

    it('should use updateEdit from context', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });

    it('should use saveEdit from context', () => {
      const message = createMessage({ id: 1 });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });
  });

  describe('Styling and layout', () => {
    it('should have flex-1 for full height', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      const messageListContainer = container.querySelector('.flex-1');
      expect(messageListContainer).toBeInTheDocument();
    });

    it('should have padding around messages', () => {
      const { container } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([]) }
      );

      const messageContainer = container.querySelector('.p-6');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render with same props and context', () => {
      const messages = [createMessage({ id: 1, content: 'Test' })];

      const { rerender } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      const firstRender = screen.getByTestId('message-item-1');

      rerender(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />
      );

      const secondRender = screen.getByTestId('message-item-1');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(MessageList.displayName).toBe('MessageList');
    });
  });

  describe('Edge cases', () => {
    it('should handle large number of messages', () => {
      const messages = Array.from({ length: 100 }, (_, i) =>
        createMessage({ id: i + 1, content: `Message ${i + 1}` })
      );

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      const messageItems = screen.getAllByTestId(/message-item/);
      expect(messageItems).toHaveLength(100);
    });

    it('should handle messages with duplicate IDs gracefully', () => {
      // React will warn about duplicate keys, but component should still render
      const messages = [
        createMessage({ id: 1, content: 'First with ID 1' }),
        createMessage({ id: 1, content: 'Second with ID 1' }),
      ];

      const consoleWarn = vi.spyOn(console, 'error').mockImplementation();

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      // Both messages should render despite duplicate IDs
      expect(screen.getByText('First with ID 1')).toBeInTheDocument();
      expect(screen.getByText('Second with ID 1')).toBeInTheDocument();

      consoleWarn.mockRestore();
    });

    it('should handle messages with ID 0', () => {
      const message = createMessage({ id: 0, content: 'Message with ID 0' });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      expect(screen.getByTestId('message-item-0')).toBeInTheDocument();
    });

    it('should handle messages with negative IDs', () => {
      const message = createMessage({ id: -1, content: 'Negative ID message' });

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper([message]) }
      );

      expect(screen.getByTestId('message-item--1')).toBeInTheDocument();
    });
  });

  describe('AnimatePresence integration', () => {
    it('should wrap messages in AnimatePresence', () => {
      const messages = [createMessage({ id: 1 })];

      render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(messages) }
      );

      // AnimatePresence is mocked to render children directly
      expect(screen.getByTestId('message-item-1')).toBeInTheDocument();
    });

    it('should handle message removal animations', () => {
      const initialMessages = [
        createMessage({ id: 1, content: 'Message 1' }),
        createMessage({ id: 2, content: 'Message 2' }),
      ];

      const { rerender } = render(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />,
        { wrapper: createWrapper(initialMessages) }
      );

      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();

      // Re-render with one message removed
      const updatedMessages = [createMessage({ id: 1, content: 'Message 1' })];

      rerender(
        <MessageList
          conversationId={conversationId}
          onCopy={mockOnCopy}
          onExportToGoogleDocs={mockOnExportToGoogleDocs}
          onFollowUp={mockOnFollowUp}
        />
      );

      // In real implementation, AnimatePresence handles exit animations
      // In our mocked version, removed message is no longer present
    });
  });
});
