import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import type { Message } from '@/components/custom/chat/ChatContext';
import { useChatAPI } from '@/lib/hooks/useChatAPI';
import { detectContext } from '@/lib/workflows/context-detector';

// Mock dependencies
vi.mock('@/lib/workflows/context-detector');
global.fetch = vi.fn();

const mockDetectContext = detectContext as vi.MockedFunction<typeof detectContext>;

describe('useChatAPI', () => {
  let mockGetAuthHeaders: vi.Mock;
  let mockAddMessage: vi.Mock;
  let mockOnError: vi.Mock;
  let mockOnPanelUpdate: vi.Mock;
  let mockMessages: Message[];

  beforeEach(() => {
    mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
    mockAddMessage = vi.fn();
    mockOnError = vi.fn();
    mockOnPanelUpdate = vi.fn();
    mockMessages = [
      { id: 1, role: 'user', content: 'Hello', timestamp: new Date() },
      { id: 2, role: 'assistant', content: 'Hi!', timestamp: new Date() },
    ];

    (global.fetch as vi.Mock).mockClear();
    mockDetectContext.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage - Analytics Route', () => {
    it('should route analytics queries to /api/analytics/chat', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      // Mock analytics detection
      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Headcount',
          data: { metric: 'headcount' },
          config: { chartType: 'bar' },
        },
        confidence: 95,
      });

      // Mock API response
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            content: 'Current headcount is 150 employees.',
            suggestedFollowUps: ['Show turnover rate', 'Department breakdown'],
            chartConfig: { type: 'bar', data: [] },
            metadata: { count: 150 },
          },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Show me headcount',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Show me headcount', userMessage);
      });

      // Verify analytics API was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: expect.stringContaining('Show me headcount'),
        })
      );

      // Verify message was added
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 4, // messages.length (2) + 2
          role: 'assistant',
          content: 'Current headcount is 150 employees.',
          detectedWorkflow: 'analytics',
          workflowConfidence: 100,
        })
      );

      // Verify panel update
      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'Show me headcount',
        'Current headcount is 150 employees.',
        expect.objectContaining({
          type: 'analytics',
          title: 'Analytics Insight',
        })
      );
    });

    it('should include conversation history in analytics request', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: { type: 'analytics', title: 'Test', data: {} },
        confidence: 90,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { content: 'Response', suggestedFollowUps: [] },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Analytics query',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Analytics query', userMessage);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should include the 2 existing messages + the current user message
      expect(requestBody.conversationHistory).toHaveLength(3);
      expect(requestBody.conversationHistory[0]).toEqual({
        role: 'user',
        content: 'Hello',
      });
      expect(requestBody.conversationHistory[1]).toEqual({
        role: 'assistant',
        content: 'Hi!',
      });
      expect(requestBody.conversationHistory[2]).toEqual({
        role: 'user',
        content: 'Analytics query',
      });
      expect(requestBody.sessionId).toBe('conv-123');
    });

    it('should handle analytics API errors', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: { type: 'analytics', title: 'Test', data: {} },
        confidence: 90,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'Query timeout' },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Analytics query',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Analytics query', userMessage);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Query timeout',
        }),
        { apiType: 'analytics' }
      );
      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it('should build analytics panel with chart config', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Test',
          data: { metric: 'turnover' },
          config: { chartType: 'line', filters: { department: 'Engineering' } },
        },
        confidence: 90,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            content: 'Turnover analysis',
            chartConfig: { type: 'line', datasets: [] },
            metadata: { rate: 5.2 },
          },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Show turnover',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Show turnover', userMessage);
      });

      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'Show turnover',
        'Turnover analysis',
        expect.objectContaining({
          type: 'analytics',
          config: expect.objectContaining({
            chartType: 'line',
            filters: { department: 'Engineering' },
          }),
          data: expect.objectContaining({
            metric: 'turnover',
            chartConfig: { type: 'line', datasets: [] },
            metadata: { rate: 5.2 },
          }),
        })
      );
    });
  });

  describe('sendMessage - General Chat Route', () => {
    it('should route general queries to /api/chat', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      // Mock non-analytics detection
      mockDetectContext.mockReturnValue({
        panelData: null,
        confidence: 0,
      });

      // Mock API response
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'I can help with that!',
          detectedWorkflow: 'hiring',
          workflowConfidence: 85,
          workflowState: { step: 1 },
          suggestedActions: [{ label: 'Create JD', action: 'create_jd' }],
          contextPanel: {
            type: 'document',
            title: 'Job Description',
            data: { content: 'JD content' },
          },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Help me create a job description',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Help me create a job description', userMessage);
      });

      // Verify general chat API was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: expect.stringContaining('Help me create a job description'),
        })
      );

      // Verify message was added
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 4,
          role: 'assistant',
          content: 'I can help with that!',
          detectedWorkflow: 'hiring',
          workflowConfidence: 85,
          workflowState: { step: 1 },
          suggestedActions: [{ label: 'Create JD', action: 'create_jd' }],
        })
      );

      // Verify panel update with server panel
      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'Help me create a job description',
        'I can help with that!',
        expect.objectContaining({
          type: 'document',
          title: 'Job Description',
        })
      );
    });

    it('should include full conversation history in general chat request', async () => {
      const longMessages: Message[] = [
        { id: 1, role: 'user', content: 'Message 1', timestamp: new Date() },
        { id: 2, role: 'assistant', content: 'Response 1', timestamp: new Date() },
        { id: 3, role: 'user', content: 'Message 2', timestamp: new Date() },
        { id: 4, role: 'assistant', content: 'Response 2', timestamp: new Date() },
        { id: 5, role: 'user', content: 'Message 3', timestamp: new Date() },
      ];

      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: longMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: null,
        confidence: 0,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'Response' }),
      });

      const userMessage: Message = {
        id: 6,
        role: 'user',
        content: 'New message',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('New message', userMessage);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // General chat includes ALL messages (5 existing + 1 current), not just last 4
      expect(requestBody.history).toHaveLength(6);
      expect(requestBody.conversationId).toBe('conv-123');
    });

    it('should handle general chat API errors', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: null,
        confidence: 0,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Rate limit exceeded',
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'General query',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('General query', userMessage);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Rate limit exceeded',
        }),
        { apiType: 'chat' }
      );
      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it('should handle general chat without server panel', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: null,
        confidence: 0,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Response without panel',
          detectedWorkflow: 'general',
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'General query',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('General query', userMessage);
      });

      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'General query',
        'Response without panel',
        undefined // No server panel
      );
    });
  });

  describe('Route Detection', () => {
    it('should detect analytics queries correctly', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: { type: 'analytics', title: 'Test', data: {} },
        confidence: 90,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { content: 'Analytics response' },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Show metrics',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Show metrics', userMessage);
      });

      expect(mockDetectContext).toHaveBeenCalledWith('Show metrics');
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/chat', expect.any(Object));
    });

    it('should route to general chat when analytics detection fails', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-123',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: { type: 'document', title: 'Test', data: {} }, // Not analytics
        confidence: 80,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'General response' }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Create document',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Create document', userMessage);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete analytics workflow', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-456',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Department Headcount',
          data: { metric: 'headcount' },
          config: { chartType: 'pie', filters: {} },
        },
        confidence: 95,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            content: 'Engineering: 50, Sales: 30, Marketing: 20',
            suggestedFollowUps: ['Show Engineering details', 'Compare to last quarter'],
            chartConfig: {
              type: 'pie',
              labels: ['Engineering', 'Sales', 'Marketing'],
              datasets: [{ data: [50, 30, 20] }],
            },
            metadata: { total: 100 },
          },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Show headcount by department',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage('Show headcount by department', userMessage);
      });

      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Engineering: 50, Sales: 30, Marketing: 20',
          suggestedFollowUps: ['Show Engineering details', 'Compare to last quarter'],
          detectedWorkflow: 'analytics',
        })
      );

      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'Show headcount by department',
        'Engineering: 50, Sales: 30, Marketing: 20',
        expect.objectContaining({
          type: 'analytics',
          data: expect.objectContaining({
            chartConfig: expect.objectContaining({
              labels: ['Engineering', 'Sales', 'Marketing'],
            }),
          }),
        })
      );
    });

    it('should handle complete general chat workflow', async () => {
      const { result } = renderHook(() =>
        useChatAPI({
          getAuthHeaders: mockGetAuthHeaders,
          conversationId: 'conv-789',
          messages: mockMessages,
          addMessage: mockAddMessage,
          onError: mockOnError,
          onPanelUpdate: mockOnPanelUpdate,
        })
      );

      mockDetectContext.mockReturnValue({
        panelData: null,
        confidence: 0,
      });

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Here is your offer letter draft...',
          detectedWorkflow: 'hiring',
          workflowConfidence: 90,
          contextPanel: {
            type: 'document',
            title: 'Offer Letter Draft',
            data: { content: '# Offer Letter\n\nDear Candidate...' },
            config: { documentType: 'offer' },
          },
        }),
      });

      const userMessage: Message = {
        id: 3,
        role: 'user',
        content: 'Create an offer letter for Software Engineer',
        timestamp: new Date(),
      };

      await act(async () => {
        await result.current.sendMessage(
          'Create an offer letter for Software Engineer',
          userMessage
        );
      });

      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Here is your offer letter draft...',
          detectedWorkflow: 'hiring',
        })
      );

      expect(mockOnPanelUpdate).toHaveBeenCalledWith(
        'Create an offer letter for Software Engineer',
        'Here is your offer letter draft...',
        expect.objectContaining({
          type: 'document',
          title: 'Offer Letter Draft',
        })
      );
    });
  });
});
