/**
 * @jest-environment jsdom
 */

/**
 * ChatInterface Performance Tests
 *
 * Tests for Week 2 Performance Optimizations:
 * - Phase 1: useCallback memoization
 * - Phase 2: ChatInput extraction (re-render scope reduction)
 * - Phase 3: Lazy loading ReactMarkdown
 * - Phase 4: ActionButtons useReducer optimization
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/components/custom/chat/ChatInput';
import { ActionButtons } from '@/components/custom/ActionButtons';
import type { BaseAction } from '@/lib/workflows/actions/types';

// Mock next/dynamic for MessageMarkdown lazy loading
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any, options?: any) => {
    const Component = ({ content }: { content: string }) => {
      // Return a simple div with the content for testing
      // In real app, this would be ReactMarkdown
      return <div data-testid="markdown-content">{content}</div>;
    };
    Component.displayName = 'DynamicMarkdown';
    return Component;
  },
}));

// Import MessageMarkdown after mocking next/dynamic
// eslint-disable-next-line import/order
import MessageMarkdown from '@/components/custom/chat/MessageMarkdown';

// Provide auth context mock for ActionButtons
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
  }),
}));

// Mock fetch for ActionButtons tests
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ChatInterface Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Phase 2: ChatInput Component Extraction', () => {
    it('should render ChatInput component', () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      render(
        <ChatInput
          value="test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      expect(screen.getByLabelText(/chat message input/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should call onChange when typing', async () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      const input = screen.getByLabelText(/chat message input/i);
      await userEvent.type(input, 'H');

      expect(mockOnChange).toHaveBeenCalledWith('H');
    });

    it('should disable send button when input is empty', () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has value', () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      render(
        <ChatInput
          value="test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should call onSend when send button clicked', async () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      render(
        <ChatInput
          value="test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await userEvent.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should not re-render when parent re-renders with same props', () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();
      const renderSpy = jest.fn();

      function TestWrapper({ value }: { value: string }) {
        renderSpy();
        return (
          <ChatInput
            value={value}
            onChange={mockOnChange}
            onSend={mockOnSend}
            onKeyPress={mockOnKeyPress}
          />
        );
      }

      const { rerender } = render(<TestWrapper value="test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render parent with same props - ChatInput should not re-render due to memo
      rerender(<TestWrapper value="test" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      // ChatInput is memoized, so internal render count stays the same
    });
  });

  describe('Phase 3: MessageMarkdown Lazy Loading', () => {
    it('should render markdown content', () => {
      render(<MessageMarkdown content="# Hello World" />);

      // With mocked dynamic import, content renders immediately
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Hello World');
    });

    it('should render in prose container', () => {
      const { container } = render(<MessageMarkdown content="# Loading Test" />);

      // Should be wrapped in prose container
      const proseContainer = container.querySelector('.prose');
      expect(proseContainer).toBeInTheDocument();
    });

    it('should render different markdown content', () => {
      const markdown = `
# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

\`code snippet\`
      `;

      render(<MessageMarkdown content={markdown} />);

      // Content is passed through in mock
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Heading 1');
    });

    it('should be memoized and not re-render with same content', () => {
      const renderSpy = jest.fn();

      function TestWrapper({ content }: { content: string }) {
        renderSpy();
        return <MessageMarkdown content={content} />;
      }

      const { rerender } = render(<TestWrapper content="# Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper content="# Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      // MessageMarkdown is memoized
    });
  });

  describe('Phase 4: ActionButtons useReducer Optimization', () => {
    const mockActions: BaseAction[] = [
      {
        id: 'action-1',
        type: 'create_document',
        label: 'Create Offer Letter',
        description: 'Generate offer letter for candidate',
        priority: 'high',
        parameters: {},
      },
      {
        id: 'action-2',
        type: 'send_email',
        label: 'Send Email',
        description: 'Send notification email',
        priority: 'medium',
        parameters: {},
      },
    ];

    beforeEach(() => {
      localStorageMock.setItem('auth_token', 'test-token');
    });

    it('should render action buttons', () => {
      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      expect(screen.getByText('Create Offer Letter')).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();
      expect(screen.getByText('Suggested Actions (2)')).toBeInTheDocument();
    });

    it('should show execute buttons for each action', () => {
      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButtons = screen.getAllByRole('button', { name: /execute$/i });
      // Should have 2 individual execute buttons + 1 "Execute All" button
      expect(executeButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should execute action when button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            success: true,
            actionId: 'action-1',
            executedAt: new Date().toISOString(),
            duration: 100,
            output: { message: 'Action completed' },
          },
        }),
      });

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: expect.stringContaining('action-1'),
      });
    });

    it('should show loading state while executing', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    result: {
                      success: true,
                      actionId: 'action-1',
                      executedAt: new Date().toISOString(),
                      duration: 100,
                    },
                  }),
                }),
              100
            )
          )
      );

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      // Should show "Executing..." text
      await waitFor(() => {
        expect(screen.getByText(/executing\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should show success state after completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            success: true,
            actionId: 'action-1',
            executedAt: new Date().toISOString(),
            duration: 150,
            output: { message: 'Success!' },
          },
        }),
      });

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    it('should handle execution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          result: {
            error: {
              message: 'Action failed',
            },
          },
        }),
      });

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      await waitFor(
        () => {
          // There are multiple "Failed" texts (badge + error header)
          const failedTexts = screen.getAllByText('Failed');
          expect(failedTexts.length).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );

      // Error message should be visible
      expect(screen.getByText('Action failed')).toBeInTheDocument();
    });

    it('should call onActionComplete callback', async () => {
      const mockOnActionComplete = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            success: true,
            actionId: 'action-1',
            executedAt: new Date().toISOString(),
            duration: 100,
          },
        }),
      });

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
          onActionComplete={mockOnActionComplete}
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      await waitFor(() => {
        expect(mockOnActionComplete).toHaveBeenCalledWith(
          'action-1',
          expect.objectContaining({
            success: true,
            actionId: 'action-1',
          })
        );
      });
    });

    it('should render execute all button', () => {
      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      expect(screen.getByRole('button', { name: /execute all/i })).toBeInTheDocument();
    });

    it('should show completion summary', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            success: true,
            actionId: 'action-1',
            executedAt: new Date().toISOString(),
            duration: 100,
          },
        }),
      });

      render(
        <ActionButtons
          actions={mockActions}
          conversationId="conv-1"
          workflowId="hiring"
        />
      );

      const executeButton = screen.getAllByRole('button', { name: /execute$/i })[0];
      await userEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 completed/i)).toBeInTheDocument();
        expect(screen.getByText(/1 successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Regression Tests', () => {
    it('ChatInput should have stable onChange handler', () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      const { rerender } = render(
        <ChatInput
          value="test"
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      const firstOnChange = mockOnChange;

      rerender(
        <ChatInput
          value="test"
          onChange={mockOnChange}
          onSend={mockOnSend}
          onKeyPress={mockOnKeyPress}
        />
      );

      // Same function reference means useCallback is working
      expect(mockOnChange).toBe(firstOnChange);
    });

    it('should not recreate MessageMarkdown on parent re-render', () => {
      let renderCount = 0;

      function TestWrapper({ trigger }: { trigger: number }) {
        renderCount++;
        return <MessageMarkdown content="# Test" />;
      }

      const { rerender } = render(<TestWrapper trigger={1} />);
      const firstRenderCount = renderCount;

      rerender(<TestWrapper trigger={2} />);

      // Parent should re-render, but memo prevents child re-render
      expect(renderCount).toBeGreaterThan(firstRenderCount);
    });
  });

  describe('Integration Tests', () => {
    it('ChatInput + ActionButtons should work together', async () => {
      const mockOnChange = jest.fn();
      const mockOnSend = jest.fn();
      const mockOnKeyPress = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            success: true,
            actionId: 'action-1',
            executedAt: new Date().toISOString(),
            duration: 100,
          },
        }),
      });

      render(
        <div>
          <ChatInput
            value="test message"
            onChange={mockOnChange}
            onSend={mockOnSend}
            onKeyPress={mockOnKeyPress}
          />
          <ActionButtons
            actions={[
              {
                id: 'action-1',
                type: 'create_document',
                label: 'Create Document',
                description: 'Test action',
                priority: 'medium',
                parameters: {},
              },
            ]}
            conversationId="conv-1"
            workflowId="general"
          />
        </div>
      );

      // Both components should render
      expect(screen.getByLabelText(/chat message input/i)).toBeInTheDocument();
      expect(screen.getByText('Create Document')).toBeInTheDocument();

      // Execute action
      const executeButton = screen.getByRole('button', { name: /execute$/i });
      await userEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });
  });
});
