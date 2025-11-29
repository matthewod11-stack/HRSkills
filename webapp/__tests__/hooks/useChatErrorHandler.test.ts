import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import type { Message } from '@/components/custom/chat/ChatContext';
import { useChatErrorHandler } from '@/lib/hooks/useChatErrorHandler';

describe('useChatErrorHandler', () => {
  let mockAddMessage: vi.Mock;
  let mockSetIsTyping: vi.Mock;
  let mockMessages: Message[];
  let consoleSpy: vi.SpyInstance;
  let alertSpy: vi.SpyInstance;

  beforeEach(() => {
    mockAddMessage = vi.fn();
    mockSetIsTyping = vi.fn();
    mockMessages = [
      { id: 1, role: 'user', content: 'Hello', timestamp: new Date() },
      { id: 2, role: 'assistant', content: 'Hi!', timestamp: new Date() },
    ];

    // Spy on console.error and alert
    consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  describe('handleApiError', () => {
    describe('analytics API errors', () => {
      it('should add error message to chat for analytics errors', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('Query timeout');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'analytics',
          });
        });

        expect(consoleSpy).toHaveBeenCalledWith('Analytics error:', error);
        expect(mockAddMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'assistant',
            content: "Sorry, I couldn't run that analysis: Query timeout. Please try again later.",
          })
        );
        expect(mockSetIsTyping).toHaveBeenCalledWith(false);
        expect(alertSpy).not.toHaveBeenCalled();
      });

      it('should handle analytics error with custom message', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('DB connection failed');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'analytics',
            userMessage:
              'The analytics service is temporarily unavailable. Please try again in a few minutes.',
          });
        });

        expect(mockAddMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content:
              'The analytics service is temporarily unavailable. Please try again in a few minutes.',
          })
        );
      });
    });

    describe('chat API errors', () => {
      it('should add error message to chat for general chat errors', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('Network error');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'chat',
          });
        });

        expect(consoleSpy).toHaveBeenCalledWith('Chat error:', error);
        expect(mockAddMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
          })
        );
        expect(mockSetIsTyping).toHaveBeenCalledWith(false);
      });

      it('should handle chat error with custom message', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('Rate limit exceeded');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'chat',
            userMessage: 'Too many requests. Please wait a moment and try again.',
          });
        });

        expect(mockAddMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Too many requests. Please wait a moment and try again.',
          })
        );
      });
    });

    describe('export API errors', () => {
      it('should show alert (not add to chat) for export errors by default', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('OAuth required');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'export',
          });
        });

        expect(consoleSpy).toHaveBeenCalledWith('Export error:', error);
        expect(alertSpy).toHaveBeenCalledWith('Failed to export document: OAuth required');
        expect(mockAddMessage).not.toHaveBeenCalled();
        expect(mockSetIsTyping).toHaveBeenCalledWith(false);
      });

      it('should add to chat if explicitly requested for export errors', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('OAuth required');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'export',
            shouldAddToChat: true,
          });
        });

        expect(mockAddMessage).toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalled();
      });
    });

    describe('error with no message', () => {
      it('should handle errors with no message property', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error();
        error.message = '';

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'analytics',
          });
        });

        expect(mockAddMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content: "Sorry, I couldn't run that analysis: Unknown error. Please try again later.",
          })
        );
      });
    });

    describe('shouldAddToChat override', () => {
      it('should respect shouldAddToChat: false for analytics errors', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('Test error');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'analytics',
            shouldAddToChat: false,
          });
        });

        expect(mockAddMessage).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalled();
      });

      it('should respect shouldAddToChat: true for export errors', () => {
        const { result } = renderHook(() =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages: mockMessages,
          })
        );

        const error = new Error('Test error');

        act(() => {
          result.current.handleApiError(error, {
            apiType: 'export',
            shouldAddToChat: true,
          });
        });

        expect(mockAddMessage).toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('createErrorMessage', () => {
    it('should create error message with correct structure', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Test error');
      const errorMessage = result.current.createErrorMessage(error);

      expect(errorMessage).toMatchObject({
        id: 4, // messages.length (2) + 2
        role: 'assistant',
        content: 'Test error',
      });
      expect(errorMessage.timestamp).toBeInstanceOf(Date);
    });

    it('should create error message with custom message', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Original error');
      const errorMessage = result.current.createErrorMessage(error, 'Custom error message');

      expect(errorMessage.content).toBe('Custom error message');
    });

    it('should handle error with no message', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error();
      error.message = '';

      const errorMessage = result.current.createErrorMessage(error);

      expect(errorMessage.content).toBe('An error occurred');
    });

    it('should generate correct message ID based on messages array length', () => {
      const { result, rerender } = renderHook(
        ({ messages }) =>
          useChatErrorHandler({
            addMessage: mockAddMessage,
            setIsTyping: mockSetIsTyping,
            messages,
          }),
        { initialProps: { messages: mockMessages } }
      );

      const error = new Error('Test');
      const message1 = result.current.createErrorMessage(error);
      expect(message1.id).toBe(4);

      // Add more messages
      const newMessages = [
        ...mockMessages,
        { id: 3, role: 'user', content: 'More', timestamp: new Date() },
        { id: 4, role: 'assistant', content: 'Content', timestamp: new Date() },
      ];

      rerender({ messages: newMessages });

      const message2 = result.current.createErrorMessage(error);
      expect(message2.id).toBe(6);
    });
  });

  describe('formatErrorForUser', () => {
    it('should format analytics errors correctly', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Database timeout');
      const formatted = result.current.formatErrorForUser(error, 'analytics');

      expect(formatted).toBe(
        "Sorry, I couldn't run that analysis: Database timeout. Please try again later."
      );
    });

    it('should format chat errors correctly', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Network failure');
      const formatted = result.current.formatErrorForUser(error, 'chat');

      expect(formatted).toBe('Sorry, I encountered an error. Please try again.');
    });

    it('should format export errors correctly', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Invalid token');
      const formatted = result.current.formatErrorForUser(error, 'export');

      expect(formatted).toBe('Failed to export document: Invalid token');
    });

    it('should use chat default for unknown API types', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Unknown error');
      const formatted = result.current.formatErrorForUser(error, 'unknown-api');

      expect(formatted).toBe('Sorry, I encountered an error. Please try again.');
    });

    it('should handle errors with no message', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error();
      error.message = '';

      const formatted = result.current.formatErrorForUser(error, 'analytics');

      expect(formatted).toBe(
        "Sorry, I couldn't run that analysis: Unknown error. Please try again later."
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete analytics error flow', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Quota exceeded');

      act(() => {
        result.current.handleApiError(error, {
          apiType: 'analytics',
          userMessage: 'Analytics quota exceeded. Please upgrade your plan.',
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Analytics error:', error);
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 4,
          role: 'assistant',
          content: 'Analytics quota exceeded. Please upgrade your plan.',
        })
      );
      expect(mockSetIsTyping).toHaveBeenCalledWith(false);
    });

    it('should handle complete export error flow', () => {
      const { result } = renderHook(() =>
        useChatErrorHandler({
          addMessage: mockAddMessage,
          setIsTyping: mockSetIsTyping,
          messages: mockMessages,
        })
      );

      const error = new Error('Permission denied');

      act(() => {
        result.current.handleApiError(error, {
          apiType: 'export',
          userMessage: 'You do not have permission to create documents in this folder.',
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Export error:', error);
      expect(alertSpy).toHaveBeenCalledWith(
        'You do not have permission to create documents in this folder.'
      );
      expect(mockAddMessage).not.toHaveBeenCalled();
      expect(mockSetIsTyping).toHaveBeenCalledWith(false);
    });
  });
});
