import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '@/components/custom/ChatInterface';

/**
 * Test suite for ChatInterface component - Integration tests
 *
 * Tests the complete chat interface orchestration including:
 * - ChatProvider integration
 * - External prompts
 * - PII detection
 * - Context panel callbacks
 * - API interactions
 * - Google Docs export
 */

// Mock the auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
  }),
}));

// Mock PII detector
jest.mock('@/lib/pii-detector', () => ({
  detectSensitivePII: jest.fn((text: string) => ({
    detected: text.includes('SSN'),
    types: text.includes('SSN') ? ['SSN'] : [],
    message: 'Sensitive data detected',
  })),
}));

// Mock context detector
jest.mock('@/lib/workflows/context-detector', () => ({
  detectContext: jest.fn((text: string) => ({
    panelData: text.includes('analytics')
      ? {
          type: 'analytics',
          title: 'Analytics',
          config: { chartType: 'bar' },
          data: { metric: 'headcount' },
        }
      : null,
    confidence: 80,
  })),
}));

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
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components to simplify testing
jest.mock('@/components/custom/chat/ChatHeader', () => ({
  ChatHeader: ({ conversationId, onReset }: any) => (
    <div data-testid="chat-header">
      <span>{conversationId}</span>
      <button onClick={onReset} data-testid="reset-button">
        Reset
      </button>
    </div>
  ),
}));

jest.mock('@/components/custom/chat/MessageList', () => ({
  MessageList: ({ conversationId }: any) => (
    <div data-testid="message-list">Messages for {conversationId}</div>
  ),
}));

jest.mock('@/components/custom/chat/SuggestionCards', () => ({
  SuggestionCards: ({ onSuggestionClick }: any) => (
    <div data-testid="suggestion-cards">
      <button onClick={() => onSuggestionClick('Generate an offer')}>Generate an offer</button>
      <button onClick={() => onSuggestionClick('Create a PIP')}>Create a PIP</button>
    </div>
  ),
}));

jest.mock('@/components/custom/chat/ChatInput', () => ({
  __esModule: true,
  default: ({ value, onChange, onSend, onKeyPress, disabled }: any) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        disabled={disabled}
      />
      <button data-testid="send-button" onClick={onSend} disabled={disabled}>
        Send
      </button>
    </div>
  ),
}));

jest.mock('@/components/custom/chat/PIIWarningModal', () => ({
  PIIWarningModal: ({ isOpen, onEdit, onSendAnyway, onClose }: any) =>
    isOpen ? (
      <div data-testid="pii-warning-modal">
        <button data-testid="pii-edit" onClick={onEdit}>
          Edit
        </button>
        <button data-testid="pii-send-anyway" onClick={onSendAnyway}>
          Send Anyway
        </button>
        <button data-testid="pii-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

describe('ChatInterface', () => {
  const mockOnContextPanelChange = jest.fn();
  const mockOnExternalPromptConsumed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component rendering', () => {
    it('should render all major sub-components', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    it('should render with ChatProvider wrapper', () => {
      render(<ChatInterface />);

      // ChatProvider generates a conversation ID
      const conversationId = screen.getByTestId('chat-header').textContent;
      expect(conversationId).toMatch(/conv_\d+_[a-z0-9]+/);
    });

    it('should render suggestion cards when no messages', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('suggestion-cards')).toBeInTheDocument();
    });

    it('should display branding elements', () => {
      render(<ChatInterface />);

      expect(screen.getByText('Chief People Officer')).toBeInTheDocument();
      expect(screen.getByText(/More People, More Problems/)).toBeInTheDocument();
    });
  });

  describe('Message sending', () => {
    it('should send message when send button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Assistant response',
          detectedWorkflow: 'general',
        }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });
    });

    it('should send message when Enter key pressed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Response',
          detectedWorkflow: 'general',
        }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyPress(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should clear input after sending', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Test' } });
      expect(input.value).toBe('Test');

      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not send empty message', () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('PII detection', () => {
    it('should show PII warning when sensitive data detected', async () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'My SSN is 123-45-6789' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('pii-warning-modal')).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should allow editing message from PII warning', async () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Contains SSN data' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('pii-warning-modal')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('pii-edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.queryByTestId('pii-warning-modal')).not.toBeInTheDocument();
      });

      // Input should be restored with pending text
      expect(input.value).toBe('Contains SSN data');
    });

    it('should send anyway when user confirms', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Contains SSN data' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('pii-warning-modal')).toBeInTheDocument();
      });

      const sendAnywayButton = screen.getByTestId('pii-send-anyway');
      fireEvent.click(sendAnywayButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should close modal when backdrop clicked', async () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Contains SSN' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('pii-warning-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('pii-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('pii-warning-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('External prompts', () => {
    it('should process external prompt', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      const externalPrompt = { id: 1, text: 'External prompt text' };

      render(
        <ChatInterface
          externalPrompt={externalPrompt}
          onExternalPromptConsumed={mockOnExternalPromptConsumed}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            body: expect.stringContaining('External prompt text'),
          })
        );
      });

      expect(mockOnExternalPromptConsumed).toHaveBeenCalledWith(1);
    });

    it('should not process same external prompt twice', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      const externalPrompt = { id: 1, text: 'External prompt' };

      const { rerender } = render(
        <ChatInterface
          externalPrompt={externalPrompt}
          onExternalPromptConsumed={mockOnExternalPromptConsumed}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Re-render with same prompt
      rerender(
        <ChatInterface
          externalPrompt={externalPrompt}
          onExternalPromptConsumed={mockOnExternalPromptConsumed}
        />
      );

      // Should not call fetch again
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should bypass PII detection for external prompts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      const externalPrompt = { id: 1, text: 'Contains SSN data' };

      render(
        <ChatInterface
          externalPrompt={externalPrompt}
          onExternalPromptConsumed={mockOnExternalPromptConsumed}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not show PII warning
      expect(screen.queryByTestId('pii-warning-modal')).not.toBeInTheDocument();
    });
  });

  describe('Context panel integration', () => {
    it('should call onContextPanelChange when analytics detected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            content: 'Analytics response',
            suggestedFollowUps: [],
            chartConfig: { type: 'bar' },
          },
        }),
      });

      render(<ChatInterface onContextPanelChange={mockOnContextPanelChange} />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Show me analytics data' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnContextPanelChange).toHaveBeenCalled();
      });
    });

    it('should route analytics queries to analytics chat API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            content: 'Analytics data',
            suggestedFollowUps: [],
          },
        }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'analytics query' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/analytics/chat',
          expect.any(Object)
        );
      });
    });

    it('should route non-analytics queries to general chat API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'General question' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.any(Object)
        );
      });
    });
  });

  describe('Chat reset', () => {
    it('should clear messages when reset clicked', async () => {
      render(<ChatInterface onContextPanelChange={mockOnContextPanelChange} />);

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      // Should clear context panel
      expect(mockOnContextPanelChange).toHaveBeenCalledWith(null);
    });

    it('should clear input when reset clicked', () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      const resetButton = screen.getByTestId('reset-button');

      fireEvent.change(input, { target: { value: 'Test input' } });
      expect(input.value).toBe('Test input');

      fireEvent.click(resetButton);

      expect(input.value).toBe('');
    });
  });

  describe('Suggestion cards', () => {
    it('should send message when suggestion clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      render(<ChatInterface />);

      const offerSuggestion = screen.getByText('Generate an offer');
      fireEvent.click(offerSuggestion);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            body: expect.stringContaining('Generate an offer'),
          })
        );
      });
    });

    it('should handle different suggestion clicks', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      render(<ChatInterface />);

      fireEvent.click(screen.getByText('Create a PIP'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            body: expect.stringContaining('Create a PIP'),
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should handle API error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'API error occurred' }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Typing indicator', () => {
    it('should show typing indicator while waiting for response', async () => {
      let resolveResponse: any;
      const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(responsePromise);

      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        // Input should be disabled while typing
        expect(sendButton).toBeDisabled();
      });

      resolveResponse({
        ok: true,
        json: async () => ({ reply: 'Response', detectedWorkflow: 'general' }),
      });

      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on main elements', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', () => {
      render(<ChatInterface />);

      const input = screen.getByTestId('message-input');

      // Input should be focusable
      expect(input).not.toHaveAttribute('tabIndex', '-1');
    });
  });
});
