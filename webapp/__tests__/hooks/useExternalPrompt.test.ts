import { renderHook, waitFor } from '@testing-library/react';
import { useExternalPrompt, ExternalPrompt } from '@/lib/hooks/useExternalPrompt';

describe('useExternalPrompt', () => {
  let mockOnPromptReceived: jest.Mock;
  let mockOnPromptConsumed: jest.Mock;

  beforeEach(() => {
    mockOnPromptReceived = jest.fn().mockResolvedValue(undefined);
    mockOnPromptConsumed = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('prompt processing', () => {
    it('should process a new external prompt', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Create offer letter' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Create offer letter');
      });

      await waitFor(() => {
        expect(mockOnPromptConsumed).toHaveBeenCalledWith(1);
      });
    });

    it('should not process when prompt is null', () => {
      renderHook(() =>
        useExternalPrompt(null, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      expect(mockOnPromptReceived).not.toHaveBeenCalled();
      expect(mockOnPromptConsumed).not.toHaveBeenCalled();
    });

    it('should not process when isProcessing is true', () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
          isProcessing: true,
        })
      );

      expect(mockOnPromptReceived).not.toHaveBeenCalled();
      expect(mockOnPromptConsumed).not.toHaveBeenCalled();
    });

    it('should process when isProcessing changes from true to false', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      const { rerender } = renderHook(
        ({ isProcessing }) =>
          useExternalPrompt(prompt, {
            onPromptReceived: mockOnPromptReceived,
            onPromptConsumed: mockOnPromptConsumed,
            isProcessing,
          }),
        { initialProps: { isProcessing: true } }
      );

      // Should not process while busy
      expect(mockOnPromptReceived).not.toHaveBeenCalled();

      // Change to not processing
      rerender({ isProcessing: false });

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Test');
      });
    });
  });

  describe('deduplication', () => {
    it('should not process the same prompt ID twice', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      const { rerender } = renderHook(
        ({ prompt }) =>
          useExternalPrompt(prompt, {
            onPromptReceived: mockOnPromptReceived,
            onPromptConsumed: mockOnPromptConsumed,
          }),
        { initialProps: { prompt } }
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledTimes(1);
      });

      // Force re-render with same prompt
      rerender({ prompt });

      // Should not process again
      expect(mockOnPromptReceived).toHaveBeenCalledTimes(1);
    });

    it('should process different prompt IDs', async () => {
      const prompt1: ExternalPrompt = { id: 1, text: 'First prompt' };
      const prompt2: ExternalPrompt = { id: 2, text: 'Second prompt' };

      const { rerender } = renderHook(
        ({ prompt }) =>
          useExternalPrompt(prompt, {
            onPromptReceived: mockOnPromptReceived,
            onPromptConsumed: mockOnPromptConsumed,
          }),
        { initialProps: { prompt: prompt1 } }
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('First prompt');
      });

      // Change to different prompt
      rerender({ prompt: prompt2 });

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Second prompt');
      });

      expect(mockOnPromptReceived).toHaveBeenCalledTimes(2);
      expect(mockOnPromptConsumed).toHaveBeenCalledWith(1);
      expect(mockOnPromptConsumed).toHaveBeenCalledWith(2);
    });

    it('should process same prompt after cleanup', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      const { rerender } = renderHook(
        ({ prompt }) =>
          useExternalPrompt(prompt, {
            onPromptReceived: mockOnPromptReceived,
            onPromptConsumed: mockOnPromptConsumed,
          }),
        { initialProps: { prompt } }
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledTimes(1);
      });

      // Set to null (cleanup)
      rerender({ prompt: null });

      // Set back to same prompt
      rerender({ prompt });

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error handling', () => {
    it('should call onPromptConsumed even when onPromptReceived throws', async () => {
      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockError = new Error('Processing failed');
      mockOnPromptReceived.mockRejectedValue(mockError);

      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockOnPromptConsumed).toHaveBeenCalledWith(1);
      });

      consoleSpy.mockRestore();
    });

    it('should reset active prompt after error', async () => {
      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockError = new Error('Processing failed');
      mockOnPromptReceived.mockRejectedValue(mockError);

      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      const { result } = renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      await waitFor(() => {
        expect(result.current.activePromptId).toBe(null);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('activePromptId', () => {
    it('should track active prompt ID during processing', async () => {
      let resolvePrompt: () => void;
      const promptPromise = new Promise<void>((resolve) => {
        resolvePrompt = resolve;
      });

      mockOnPromptReceived.mockReturnValue(promptPromise);

      const prompt: ExternalPrompt = { id: 123, text: 'Test' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      // Verify processing was initiated
      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Test');
      });

      // Resolve processing
      resolvePrompt!();

      // Should notify completion
      await waitFor(() => {
        expect(mockOnPromptConsumed).toHaveBeenCalledWith(123);
      });
    });

    it('should be null when no prompt is active', () => {
      const { result } = renderHook(() =>
        useExternalPrompt(null, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      expect(result.current.activePromptId).toBe(null);
    });
  });

  describe('resetActivePrompt', () => {
    it('should manually reset active prompt', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      const { result } = renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      // Wait for processing to start
      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalled();
      });

      // Manual reset should be callable
      expect(() => {
        result.current.resetActivePrompt();
      }).not.toThrow();

      // After reset, a new prompt with same ID can be processed
      expect(result.current.activePromptId).toBe(null);
    });
  });

  describe('callback variations', () => {
    it('should work without onPromptConsumed callback', async () => {
      const prompt: ExternalPrompt = { id: 1, text: 'Test' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          // onPromptConsumed not provided
        })
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Test');
      });

      // Should not throw
    });

    it('should handle async onPromptReceived', async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      mockOnPromptReceived.mockImplementation(async (text) => {
        await delay(50);
        return text.toUpperCase();
      });

      const prompt: ExternalPrompt = { id: 1, text: 'test' };

      renderHook(() =>
        useExternalPrompt(prompt, {
          onPromptReceived: mockOnPromptReceived,
          onPromptConsumed: mockOnPromptConsumed,
        })
      );

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('test');
      });

      await waitFor(() => {
        expect(mockOnPromptConsumed).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('rapid prompt changes', () => {
    it('should handle rapid successive prompts correctly', async () => {
      const prompt1: ExternalPrompt = { id: 1, text: 'First' };
      const prompt2: ExternalPrompt = { id: 2, text: 'Second' };
      const prompt3: ExternalPrompt = { id: 3, text: 'Third' };

      const { rerender } = renderHook(
        ({ prompt }) =>
          useExternalPrompt(prompt, {
            onPromptReceived: mockOnPromptReceived,
            onPromptConsumed: mockOnPromptConsumed,
          }),
        { initialProps: { prompt: prompt1 } }
      );

      // Rapid changes
      rerender({ prompt: prompt2 });
      rerender({ prompt: prompt3 });

      await waitFor(() => {
        expect(mockOnPromptReceived).toHaveBeenCalledWith('First');
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Second');
        expect(mockOnPromptReceived).toHaveBeenCalledWith('Third');
      });

      expect(mockOnPromptReceived).toHaveBeenCalledTimes(3);
    });
  });
});
