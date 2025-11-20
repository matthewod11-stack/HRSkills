import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MessageContent } from '@/components/custom/chat/MessageContent';
import { Message, WorkflowState } from '@/components/custom/chat/ChatContext';

/**
 * Test suite for MessageContent component
 *
 * Tests the complete message content rendering including markdown, workflow badges,
 * progress indicators, action buttons, and suggested follow-ups.
 */

// Mock the child components
vi.mock('@/components/custom/chat/WorkflowBadge', () => ({
  WorkflowBadge: ({ workflowType, confidence }: any) => (
    <div data-testid="workflow-badge">
      {workflowType} - {confidence}%
    </div>
  ),
}));

vi.mock('@/components/custom/WorkflowProgress', () => ({
  WorkflowProgress: ({ workflowId, state }: any) => (
    <div data-testid="workflow-progress">
      {workflowId} - {state.progress}%
    </div>
  ),
}));

vi.mock('@/components/custom/ActionButtons', () => ({
  ActionButtons: ({ actions, conversationId, workflowId }: any) => (
    <div data-testid="action-buttons">
      {actions.length} actions for {workflowId}
    </div>
  ),
}));

vi.mock('@/components/custom/chat/MessageMarkdown', () => ({
  __esModule: true,
  default: ({ content }: any) => <div data-testid="markdown-content">{content}</div>,
}));

describe('MessageContent', () => {
  const mockOnFollowUp = vi.fn();
  const conversationId = 'conv_test_123';

  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: 1,
    role: 'assistant',
    content: 'Test message content',
    timestamp: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render markdown content', () => {
      const message = createMessage({ content: 'Hello world' });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Hello world');
    });

    it('should always render markdown content regardless of role', () => {
      const userMessage = createMessage({ role: 'user', content: 'User message' });

      render(
        <MessageContent
          message={userMessage}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('markdown-content')).toHaveTextContent('User message');
    });
  });

  describe('WorkflowBadge rendering', () => {
    it('should show WorkflowBadge when workflow is detected', () => {
      const message = createMessage({
        detectedWorkflow: 'offer_letter',
        workflowConfidence: 95,
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('workflow-badge')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-badge')).toHaveTextContent('offer_letter - 95%');
    });

    it('should show WorkflowBadge without confidence', () => {
      const message = createMessage({
        detectedWorkflow: 'pip',
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('workflow-badge')).toBeInTheDocument();
    });

    it('should show WorkflowBadge with empty string when no workflow', () => {
      const message = createMessage();

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      // WorkflowBadge is always rendered but receives empty string
      expect(screen.getByTestId('workflow-badge')).toBeInTheDocument();
    });
  });

  describe('WorkflowProgress rendering', () => {
    it('should show WorkflowProgress for assistant messages with workflow state', () => {
      const workflowState: WorkflowState = {
        currentStep: 'Step 1',
        progress: 50,
        completedSteps: ['Init'],
        isComplete: false,
        hasActions: true,
        actionCount: 2,
      };

      const message = createMessage({
        role: 'assistant',
        detectedWorkflow: 'analytics',
        workflowState,
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('workflow-progress')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-progress')).toHaveTextContent('analytics - 50%');
    });

    it('should not show WorkflowProgress for user messages', () => {
      const workflowState: WorkflowState = {
        currentStep: 'Step 1',
        progress: 50,
        completedSteps: [],
        isComplete: false,
        hasActions: false,
        actionCount: 0,
      };

      const message = createMessage({
        role: 'user',
        workflowState,
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByTestId('workflow-progress')).not.toBeInTheDocument();
    });

    it('should not show WorkflowProgress when workflowState is undefined', () => {
      const message = createMessage({
        role: 'assistant',
        detectedWorkflow: 'pip',
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByTestId('workflow-progress')).not.toBeInTheDocument();
    });

    it('should use "general" as fallback workflow ID', () => {
      const workflowState: WorkflowState = {
        currentStep: 'Step 1',
        progress: 75,
        completedSteps: [],
        isComplete: false,
        hasActions: false,
        actionCount: 0,
      };

      const message = createMessage({
        role: 'assistant',
        workflowState,
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('workflow-progress')).toHaveTextContent('general - 75%');
    });
  });

  describe('ActionButtons rendering', () => {
    it('should show ActionButtons when suggestedActions are present for assistant', () => {
      const message = createMessage({
        role: 'assistant',
        detectedWorkflow: 'offer_letter',
        suggestedActions: [
          { id: 1, label: 'Export to Docs' },
          { id: 2, label: 'Edit Draft' },
        ],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('action-buttons')).toHaveTextContent('2 actions for offer_letter');
    });

    it('should not show ActionButtons for user messages', () => {
      const message = createMessage({
        role: 'user',
        suggestedActions: [{ id: 1, label: 'Action' }],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
    });

    it('should not show ActionButtons when array is empty', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedActions: [],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
    });

    it('should not show ActionButtons when undefined', () => {
      const message = createMessage({
        role: 'assistant',
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
    });

    it('should use "general" as fallback workflow ID for actions', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedActions: [{ id: 1, label: 'Action' }],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('action-buttons')).toHaveTextContent('1 actions for general');
    });
  });

  describe('Suggested follow-ups rendering', () => {
    it('should show suggested follow-ups for assistant messages', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: ['What else?', 'Show more details', 'Export this'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByText('Suggested follow-ups')).toBeInTheDocument();
      expect(screen.getByText('What else?')).toBeInTheDocument();
      expect(screen.getByText('Show more details')).toBeInTheDocument();
      expect(screen.getByText('Export this')).toBeInTheDocument();
    });

    it('should call onFollowUp when follow-up is clicked', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: ['Follow up 1', 'Follow up 2'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      fireEvent.click(screen.getByText('Follow up 1'));

      expect(mockOnFollowUp).toHaveBeenCalledTimes(1);
      expect(mockOnFollowUp).toHaveBeenCalledWith('Follow up 1');
    });

    it('should not show follow-ups for user messages', () => {
      const message = createMessage({
        role: 'user',
        suggestedFollowUps: ['Should not appear'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByText('Suggested follow-ups')).not.toBeInTheDocument();
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('should not show follow-ups when array is empty', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: [],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByText('Suggested follow-ups')).not.toBeInTheDocument();
    });

    it('should not show follow-ups when undefined', () => {
      const message = createMessage({
        role: 'assistant',
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.queryByText('Suggested follow-ups')).not.toBeInTheDocument();
    });

    it('should handle multiple follow-up clicks', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: ['First', 'Second', 'Third'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      fireEvent.click(screen.getByText('First'));
      fireEvent.click(screen.getByText('Third'));
      fireEvent.click(screen.getByText('Second'));

      expect(mockOnFollowUp).toHaveBeenCalledTimes(3);
      expect(mockOnFollowUp).toHaveBeenNthCalledWith(1, 'First');
      expect(mockOnFollowUp).toHaveBeenNthCalledWith(2, 'Third');
      expect(mockOnFollowUp).toHaveBeenNthCalledWith(3, 'Second');
    });

    it('should render follow-up buttons with correct styling', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: ['Test follow-up'],
      });

      const { container } = render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      const button = screen.getByText('Test follow-up');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveClass('px-3', 'py-1', 'rounded-lg', 'text-xs');
    });
  });

  describe('Component integration', () => {
    it('should render all components together for a complete assistant message', () => {
      const workflowState: WorkflowState = {
        currentStep: 'Analyzing',
        progress: 60,
        completedSteps: ['Init', 'Validate'],
        isComplete: false,
        hasActions: true,
        actionCount: 3,
      };

      const message = createMessage({
        role: 'assistant',
        content: 'Complete message with all features',
        detectedWorkflow: 'analytics',
        workflowConfidence: 92,
        workflowState,
        suggestedActions: [{ id: 1, label: 'Export' }],
        suggestedFollowUps: ['Show more', 'Export data'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      // All components should be present
      expect(screen.getByTestId('workflow-badge')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-progress')).toBeInTheDocument();
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByText('Suggested follow-ups')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should render minimal user message', () => {
      const message = createMessage({
        role: 'user',
        content: 'Simple user message',
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      // Only markdown and workflow badge should be present
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-progress')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('Suggested follow-ups')).not.toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props are the same', () => {
      const message = createMessage({ content: 'Test' });

      const { rerender } = render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      const firstRender = screen.getByTestId('markdown-content');

      rerender(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      const secondRender = screen.getByTestId('markdown-content');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Display name', () => {
    it('should have correct displayName for debugging', () => {
      expect(MessageContent.displayName).toBe('MessageContent');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long message content', () => {
      const longContent = 'A'.repeat(10000);
      const message = createMessage({ content: longContent });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('markdown-content')).toHaveTextContent(longContent);
    });

    it('should handle empty content', () => {
      const message = createMessage({ content: '' });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('should handle special characters in follow-ups', () => {
      const message = createMessage({
        role: 'assistant',
        suggestedFollowUps: ['<script>alert("xss")</script>', 'Normal follow-up'],
      });

      render(
        <MessageContent
          message={message}
          conversationId={conversationId}
          onFollowUp={mockOnFollowUp}
        />
      );

      // Should render as text, not execute script
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    });
  });
});
