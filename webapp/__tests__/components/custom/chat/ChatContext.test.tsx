import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import {
  ChatProvider,
  type Message,
  useChatContext,
  type WorkflowState,
} from '@/components/custom/chat/ChatContext';

/**
 * Test suite for ChatContext - Critical state management layer
 *
 * Tests the context provider and custom hook that powers the entire chat interface.
 * This is the foundation of the chat system, so comprehensive coverage is essential.
 */

describe('ChatContext', () => {
  // Helper to create a wrapper with ChatProvider
  const createWrapper = (initialMessages: Message[] = [], initialConversationId?: string) => {
    return ({ children }: { children: ReactNode }) => (
      <ChatProvider initialMessages={initialMessages} initialConversationId={initialConversationId}>
        {children}
      </ChatProvider>
    );
  };

  // Helper to create a mock message
  const createMockMessage = (overrides?: Partial<Message>): Message => ({
    id: 1,
    role: 'user',
    content: 'Test message',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  });

  describe('ChatProvider initialization', () => {
    it('should render children correctly', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.messages).toEqual([]);
    });

    it('should initialize with empty messages array by default', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.messages.length).toBe(0);
    });

    it('should initialize with provided initial messages', () => {
      const initialMessages: Message[] = [
        createMockMessage({ id: 1, content: 'Hello' }),
        createMockMessage({ id: 2, content: 'World', role: 'assistant' }),
      ];

      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      expect(result.current.messages).toEqual(initialMessages);
      expect(result.current.messages.length).toBe(2);
    });

    it('should initialize isTyping as false', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isTyping).toBe(false);
    });

    it('should generate a conversation ID if not provided', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.conversationId).toBeDefined();
      expect(result.current.conversationId).toMatch(/^conv_\d+_[a-z0-9]+$/);
    });

    it('should use provided conversation ID', () => {
      const customId = 'conv_test_123';
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper([], customId),
      });

      expect(result.current.conversationId).toBe(customId);
    });

    it('should maintain stable conversation ID across re-renders', () => {
      const { result, rerender } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      const firstId = result.current.conversationId;
      rerender();
      const secondId = result.current.conversationId;

      expect(firstId).toBe(secondId);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the messages array', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      const newMessage = createMockMessage({ id: 1, content: 'New message' });

      act(() => {
        result.current.addMessage(newMessage);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(newMessage);
    });

    it('should append messages to existing array', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'First' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      const secondMessage = createMockMessage({ id: 2, content: 'Second' });

      act(() => {
        result.current.addMessage(secondMessage);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('First');
      expect(result.current.messages[1].content).toBe('Second');
    });

    it('should preserve message properties', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      const workflowState: WorkflowState = {
        currentStep: 'Step 1',
        progress: 50,
        completedSteps: ['Step 0'],
        isComplete: false,
        hasActions: true,
        actionCount: 2,
      };

      const complexMessage = createMockMessage({
        id: 1,
        role: 'assistant',
        content: 'Complex message',
        detectedWorkflow: 'offer_letter',
        workflowConfidence: 95,
        workflowState,
        suggestedActions: [{ id: 1, label: 'Action 1' }],
        suggestedFollowUps: ['Follow up 1'],
      });

      act(() => {
        result.current.addMessage(complexMessage);
      });

      const addedMessage = result.current.messages[0];
      expect(addedMessage.detectedWorkflow).toBe('offer_letter');
      expect(addedMessage.workflowConfidence).toBe(95);
      expect(addedMessage.workflowState).toEqual(workflowState);
      expect(addedMessage.suggestedActions).toHaveLength(1);
      expect(addedMessage.suggestedFollowUps).toEqual(['Follow up 1']);
    });

    it('should handle multiple sequential additions', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addMessage(createMockMessage({ id: 1, content: 'First' }));
        result.current.addMessage(createMockMessage({ id: 2, content: 'Second' }));
        result.current.addMessage(createMockMessage({ id: 3, content: 'Third' }));
      });

      expect(result.current.messages).toHaveLength(3);
    });
  });

  describe('updateMessage', () => {
    it('should update a specific message by ID', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateMessage(1, { content: 'Updated' });
      });

      expect(result.current.messages[0].content).toBe('Updated');
    });

    it('should only update the targeted message', () => {
      const initialMessages = [
        createMockMessage({ id: 1, content: 'Message 1' }),
        createMockMessage({ id: 2, content: 'Message 2' }),
        createMockMessage({ id: 3, content: 'Message 3' }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateMessage(2, { content: 'Updated Message 2' });
      });

      expect(result.current.messages[0].content).toBe('Message 1');
      expect(result.current.messages[1].content).toBe('Updated Message 2');
      expect(result.current.messages[2].content).toBe('Message 3');
    });

    it('should support partial updates', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original', role: 'user' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateMessage(1, { detectedWorkflow: 'pip' });
      });

      const message = result.current.messages[0];
      expect(message.content).toBe('Original'); // Unchanged
      expect(message.role).toBe('user'); // Unchanged
      expect(message.detectedWorkflow).toBe('pip'); // Updated
    });

    it('should handle multiple property updates', () => {
      const initialMessages = [createMockMessage({ id: 1 })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateMessage(1, {
          content: 'New content',
          detectedWorkflow: 'analytics',
          workflowConfidence: 88,
        });
      });

      const message = result.current.messages[0];
      expect(message.content).toBe('New content');
      expect(message.detectedWorkflow).toBe('analytics');
      expect(message.workflowConfidence).toBe(88);
    });

    it('should do nothing if message ID not found', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateMessage(999, { content: 'Should not update' });
      });

      expect(result.current.messages[0].content).toBe('Original');
    });
  });

  describe('deleteMessage', () => {
    it('should remove a message by ID', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'To delete' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.deleteMessage(1);
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should only remove the targeted message', () => {
      const initialMessages = [
        createMockMessage({ id: 1, content: 'Keep 1' }),
        createMockMessage({ id: 2, content: 'Delete' }),
        createMockMessage({ id: 3, content: 'Keep 2' }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.deleteMessage(2);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Keep 1');
      expect(result.current.messages[1].content).toBe('Keep 2');
    });

    it('should do nothing if message ID not found', () => {
      const initialMessages = [createMockMessage({ id: 1 })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.deleteMessage(999);
      });

      expect(result.current.messages).toHaveLength(1);
    });

    it('should handle multiple deletions', () => {
      const initialMessages = [
        createMockMessage({ id: 1 }),
        createMockMessage({ id: 2 }),
        createMockMessage({ id: 3 }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.deleteMessage(1);
        result.current.deleteMessage(3);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe(2);
    });
  });

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      const initialMessages = [
        createMockMessage({ id: 1 }),
        createMockMessage({ id: 2 }),
        createMockMessage({ id: 3 }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.messages.length).toBe(0);
    });

    it('should work when messages array is already empty', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should allow adding messages after clearing', () => {
      const initialMessages = [createMockMessage({ id: 1 })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.clearMessages();
        result.current.addMessage(createMockMessage({ id: 2, content: 'New' }));
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('New');
    });
  });

  describe('toggleEdit', () => {
    it('should set isEditing to true when false', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Edit me' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.toggleEdit(1);
      });

      expect(result.current.messages[0].isEditing).toBe(true);
    });

    it('should set isEditing to false when true', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Edit me', isEditing: true })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.toggleEdit(1);
      });

      expect(result.current.messages[0].isEditing).toBe(false);
    });

    it('should set editedContent to current content when entering edit mode', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original content' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.toggleEdit(1);
      });

      expect(result.current.messages[0].editedContent).toBe('Original content');
    });

    it('should clear editedContent when exiting edit mode', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
          editedContent: 'Modified',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.toggleEdit(1);
      });

      expect(result.current.messages[0].isEditing).toBe(false);
      expect(result.current.messages[0].editedContent).toBeUndefined();
    });

    it('should only toggle the targeted message', () => {
      const initialMessages = [
        createMockMessage({ id: 1, content: 'Message 1' }),
        createMockMessage({ id: 2, content: 'Message 2' }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.toggleEdit(2);
      });

      expect(result.current.messages[0].isEditing).toBeUndefined();
      expect(result.current.messages[1].isEditing).toBe(true);
    });
  });

  describe('updateEdit', () => {
    it('should update editedContent for a message', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original', isEditing: true })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateEdit(1, 'New edited content');
      });

      expect(result.current.messages[0].editedContent).toBe('New edited content');
    });

    it('should not change the original content', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original', isEditing: true })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateEdit(1, 'Edited version');
      });

      expect(result.current.messages[0].content).toBe('Original');
      expect(result.current.messages[0].editedContent).toBe('Edited version');
    });

    it('should only update the targeted message', () => {
      const initialMessages = [
        createMockMessage({ id: 1, content: 'Message 1', isEditing: true }),
        createMockMessage({ id: 2, content: 'Message 2', isEditing: true }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateEdit(2, 'Updated 2');
      });

      expect(result.current.messages[0].editedContent).toBeUndefined();
      expect(result.current.messages[1].editedContent).toBe('Updated 2');
    });

    it('should handle empty string', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original', isEditing: true })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.updateEdit(1, '');
      });

      expect(result.current.messages[0].editedContent).toBe('');
    });
  });

  describe('saveEdit', () => {
    it('should commit editedContent to content', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
          editedContent: 'Edited version',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      expect(result.current.messages[0].content).toBe('Edited version');
    });

    it('should set isEditing to false after saving', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
          editedContent: 'Edited',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      expect(result.current.messages[0].isEditing).toBe(false);
    });

    it('should clear editedContent after saving', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
          editedContent: 'Edited',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      expect(result.current.messages[0].editedContent).toBeUndefined();
    });

    it('should keep original content if editedContent is undefined', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      expect(result.current.messages[0].content).toBe('Original');
    });

    it('should fallback to original content when editedContent is empty string', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Original',
          isEditing: true,
          editedContent: '',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      // Empty string is falsy, so it falls back to original content
      expect(result.current.messages[0].content).toBe('Original');
    });

    it('should only save the targeted message', () => {
      const initialMessages = [
        createMockMessage({
          id: 1,
          content: 'Message 1',
          isEditing: true,
          editedContent: 'Edit 1',
        }),
        createMockMessage({
          id: 2,
          content: 'Message 2',
          isEditing: true,
          editedContent: 'Edit 2',
        }),
      ];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      act(() => {
        result.current.saveEdit(1);
      });

      expect(result.current.messages[0].content).toBe('Edit 1');
      expect(result.current.messages[0].isEditing).toBe(false);
      expect(result.current.messages[1].content).toBe('Message 2');
      expect(result.current.messages[1].isEditing).toBe(true);
    });
  });

  describe('setIsTyping', () => {
    it('should update isTyping to true', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setIsTyping(true);
      });

      expect(result.current.isTyping).toBe(true);
    });

    it('should update isTyping to false', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setIsTyping(true);
        result.current.setIsTyping(false);
      });

      expect(result.current.isTyping).toBe(false);
    });

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setIsTyping(true);
      });
      expect(result.current.isTyping).toBe(true);

      act(() => {
        result.current.setIsTyping(false);
      });
      expect(result.current.isTyping).toBe(false);

      act(() => {
        result.current.setIsTyping(true);
      });
      expect(result.current.isTyping).toBe(true);
    });
  });

  describe('useChatContext error handling', () => {
    it('should throw error when used outside of ChatProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      // React 19 changed error handling - just verify it throws, not the exact message
      expect(() => {
        renderHook(() => useChatContext());
      }).toThrow();

      console.error = originalError;
    });
  });

  describe('Type safety', () => {
    it('should maintain correct Message type structure', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Test',
        timestamp: new Date(),
        detectedWorkflow: 'pip',
        workflowConfidence: 85,
      };

      act(() => {
        result.current.addMessage(message);
      });

      // TypeScript should ensure the types match
      const retrievedMessage = result.current.messages[0];
      expect(retrievedMessage.role).toBe('assistant');
    });

    it('should accept all valid Message properties', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      const workflowState: WorkflowState = {
        currentStep: 'Analyzing',
        progress: 75,
        completedSteps: ['Init', 'Validate'],
        isComplete: false,
        hasActions: true,
        actionCount: 3,
      };

      const fullMessage: Message = {
        id: 1,
        role: 'assistant',
        content: 'Full message',
        timestamp: new Date(),
        isEditing: false,
        editedContent: undefined,
        detectedWorkflow: 'analytics',
        workflowConfidence: 92,
        workflowState,
        suggestedActions: [{ id: 1, action: 'Export' }],
        suggestedFollowUps: ['What else?', 'Show more'],
      };

      act(() => {
        result.current.addMessage(fullMessage);
      });

      expect(result.current.messages[0]).toEqual(fullMessage);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete edit workflow', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original message' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      // Enter edit mode
      act(() => {
        result.current.toggleEdit(1);
      });
      expect(result.current.messages[0].isEditing).toBe(true);
      expect(result.current.messages[0].editedContent).toBe('Original message');

      // Update edited content
      act(() => {
        result.current.updateEdit(1, 'Modified message');
      });
      expect(result.current.messages[0].editedContent).toBe('Modified message');

      // Save changes
      act(() => {
        result.current.saveEdit(1);
      });
      expect(result.current.messages[0].content).toBe('Modified message');
      expect(result.current.messages[0].isEditing).toBe(false);
      expect(result.current.messages[0].editedContent).toBeUndefined();
    });

    it('should handle cancel edit workflow', () => {
      const initialMessages = [createMockMessage({ id: 1, content: 'Original message' })];
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(initialMessages),
      });

      // Enter edit mode and make changes
      act(() => {
        result.current.toggleEdit(1);
        result.current.updateEdit(1, 'Temporary edit');
      });

      // Cancel edit (toggle off without saving)
      act(() => {
        result.current.toggleEdit(1);
      });

      expect(result.current.messages[0].content).toBe('Original message');
      expect(result.current.messages[0].isEditing).toBe(false);
      expect(result.current.messages[0].editedContent).toBeUndefined();
    });

    it('should handle conversation flow with typing indicator', () => {
      const { result } = renderHook(() => useChatContext(), {
        wrapper: createWrapper(),
      });

      // User sends message
      act(() => {
        result.current.addMessage(createMockMessage({ id: 1, role: 'user', content: 'Hello' }));
        result.current.setIsTyping(true);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.isTyping).toBe(true);

      // Assistant responds
      act(() => {
        result.current.addMessage(
          createMockMessage({ id: 2, role: 'assistant', content: 'Hi there!' })
        );
        result.current.setIsTyping(false);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.isTyping).toBe(false);
    });
  });
});
