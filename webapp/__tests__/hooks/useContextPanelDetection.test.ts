import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useContextPanelDetection } from '@/lib/hooks/useContextPanelDetection';
import { detectContext } from '@/lib/workflows/context-detector';
import type { ContextPanelData } from '@/components/custom/ContextPanel';

// Mock the context detector
vi.mock('@/lib/workflows/context-detector', () => ({
  detectContext: vi.fn(),
}));

const mockDetectContext = detectContext as vi.MockedFunction<typeof detectContext>;

describe('useContextPanelDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enhancePanelData', () => {
    it('should return null for null input', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const enhanced = result.current.enhancePanelData(null);

      expect(enhanced).toBeNull();
    });

    it('should add timestamp to panel data', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const panelData: ContextPanelData = {
        type: 'analytics',
        title: 'Test Panel',
        data: {},
      };

      const enhanced = result.current.enhancePanelData(panelData);

      expect(enhanced).toMatchObject({
        type: 'analytics',
        title: 'Test Panel',
        data: {},
      });
      expect(enhanced?.timestamp).toBeDefined();
      expect(typeof enhanced?.timestamp).toBe('string');
    });

    it('should sanitize PIP document content', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const validPipContent = `# Performance Improvement Plan

## Performance Issues
- Issue 1
- Issue 2

## Improvement Goals
- Goal 1
- Goal 2

## Support & Resources
- Resource 1
- Resource 2

## Check-In Schedule
- Week 1
- Week 2`;

      const panelData: ContextPanelData = {
        type: 'document',
        title: 'PIP Document',
        data: { content: validPipContent },
        config: { documentType: 'pip' },
      };

      const enhanced = result.current.enhancePanelData(panelData);

      expect(enhanced?.data?.content).toBeTruthy();
      expect(enhanced?.data?.content).toContain('Performance Improvement Plan');
    });

    it('should reject invalid PIP content (missing sections)', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const invalidPipContent = `# Performance Improvement Plan

## Performance Issues
- Issue 1

## Improvement Goals
- Goal 1`;
      // Missing required sections

      const panelData: ContextPanelData = {
        type: 'document',
        title: 'PIP Document',
        data: { content: invalidPipContent },
        config: { documentType: 'pip' },
      };

      const enhanced = result.current.enhancePanelData(panelData);

      expect(enhanced?.data?.content).toBe('');
    });

    it('should reject PIP content with less than 10 lines', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const shortPipContent = `# Performance Improvement Plan
Line 2
Line 3
Line 4
Line 5`;

      const panelData: ContextPanelData = {
        type: 'document',
        title: 'PIP Document',
        data: { content: shortPipContent },
        config: { documentType: 'pip' },
      };

      const enhanced = result.current.enhancePanelData(panelData);

      expect(enhanced?.data?.content).toBe('');
    });

    it('should pass through non-PIP documents unchanged', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const offerContent = 'Offer letter content';

      const panelData: ContextPanelData = {
        type: 'document',
        title: 'Offer Letter',
        data: { content: offerContent },
        config: { documentType: 'offer' },
      };

      const enhanced = result.current.enhancePanelData(panelData);

      expect(enhanced?.data?.content).toBe(offerContent);
    });
  });

  describe('sanitizeDocumentContent', () => {
    it('should sanitize PIP content removing AI prompts', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const pipWithPrompt = `# Performance Improvement Plan

## Performance Issues
- Issue 1

## Improvement Goals
- Goal 1

## Support & Resources
- Resource 1

## Check-In Schedule
- Week 1

Once you provide the details, I can help you further.`;

      const sanitized = result.current.sanitizeDocumentContent(pipWithPrompt, 'pip');

      expect(sanitized).not.toContain('Once you provide the details');
    });

    it('should return empty string for PIP without marker', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const invalidPip = 'Some content without PIP marker';

      const sanitized = result.current.sanitizeDocumentContent(invalidPip, 'pip');

      expect(sanitized).toBe('');
    });

    it('should pass through non-PIP document types unchanged', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      const content = 'Regular document content';

      const sanitized = result.current.sanitizeDocumentContent(content, 'offer');

      expect(sanitized).toBe(content);
    });
  });

  describe('detectAndUpdatePanel', () => {
    it('should use server-side detection when provided', () => {
      const mockOnPanelChange = vi.fn();
      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
        })
      );

      const serverPanel: ContextPanelData = {
        type: 'analytics',
        title: 'Server Panel',
        data: { metric: 'headcount' },
      };

      act(() => {
        result.current.detectAndUpdatePanel('Show headcount', 'Here is the data', serverPanel);
      });

      expect(mockOnPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'analytics',
          title: 'Server Panel',
        })
      );
      expect(result.current.lastDetectedPanel).toEqual(serverPanel);
      expect(result.current.lastConfidence).toBe(100);
    });

    it('should fall back to client-side detection when no server panel', () => {
      const mockOnPanelChange = vi.fn();

      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Client Panel',
          data: {},
        },
        confidence: 85,
      });

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
        })
      );

      act(() => {
        result.current.detectAndUpdatePanel('Show metrics', 'Here are the metrics');
      });

      expect(mockDetectContext).toHaveBeenCalledWith('Show metrics', 'Here are the metrics');
      expect(mockOnPanelChange).toHaveBeenCalled();
      expect(result.current.lastConfidence).toBe(85);
    });

    it('should not show panel if client detection confidence is below threshold', () => {
      const mockOnPanelChange = vi.fn();

      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Low Confidence Panel',
          data: {},
        },
        confidence: 50, // Below default threshold of 70
      });

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
          confidenceThreshold: 70,
        })
      );

      act(() => {
        result.current.detectAndUpdatePanel('Vague query', 'Vague response');
      });

      expect(mockOnPanelChange).toHaveBeenCalledWith(null);
      expect(result.current.lastDetectedPanel).toBeNull();
    });

    it('should respect custom confidence threshold', () => {
      const mockOnPanelChange = vi.fn();

      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Panel',
          data: {},
        },
        confidence: 60,
      });

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
          confidenceThreshold: 50, // Custom lower threshold
        })
      );

      act(() => {
        result.current.detectAndUpdatePanel('Query', 'Response');
      });

      expect(mockOnPanelChange).toHaveBeenCalled();
      expect(result.current.lastConfidence).toBe(60);
    });

    it('should work without onPanelChange callback', () => {
      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Panel',
          data: {},
        },
        confidence: 80,
      });

      const { result } = renderHook(() => useContextPanelDetection());

      expect(() => {
        act(() => {
          result.current.detectAndUpdatePanel('Query', 'Response');
        });
      }).not.toThrow();

      expect(result.current.lastConfidence).toBe(80);
    });

    it('should enhance panel data before notifying parent', () => {
      const mockOnPanelChange = vi.fn();

      const serverPanel: ContextPanelData = {
        type: 'document',
        title: 'Document',
        data: { content: 'Test content' },
      };

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
        })
      );

      act(() => {
        result.current.detectAndUpdatePanel('Create document', 'Here it is', serverPanel);
      });

      // Verify timestamp was added
      expect(mockOnPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document',
          title: 'Document',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('state tracking', () => {
    it('should track last detected panel', () => {
      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'analytics',
          title: 'Panel 1',
          data: {},
        },
        confidence: 80,
      });

      const { result } = renderHook(() => useContextPanelDetection());

      act(() => {
        result.current.detectAndUpdatePanel('Query 1', 'Response 1');
      });

      expect(result.current.lastDetectedPanel).toMatchObject({
        type: 'analytics',
        title: 'Panel 1',
      });

      // Update with new panel
      mockDetectContext.mockReturnValue({
        panelData: {
          type: 'document',
          title: 'Panel 2',
          data: {},
        },
        confidence: 90,
      });

      act(() => {
        result.current.detectAndUpdatePanel('Query 2', 'Response 2');
      });

      expect(result.current.lastDetectedPanel).toMatchObject({
        type: 'document',
        title: 'Panel 2',
      });
    });

    it('should track confidence scores', () => {
      const { result } = renderHook(() => useContextPanelDetection());

      expect(result.current.lastConfidence).toBe(0);

      // Server detection
      act(() => {
        result.current.detectAndUpdatePanel('Query', 'Response', {
          type: 'analytics',
          title: 'Server',
          data: {},
        });
      });

      expect(result.current.lastConfidence).toBe(100);

      // Client detection
      mockDetectContext.mockReturnValue({
        panelData: { type: 'analytics', title: 'Client', data: {} },
        confidence: 75,
      });

      act(() => {
        result.current.detectAndUpdatePanel('Query', 'Response');
      });

      expect(result.current.lastConfidence).toBe(75);
    });
  });

  describe('integration scenarios', () => {
    it('should handle analytics panel from server', () => {
      const mockOnPanelChange = vi.fn();

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
        })
      );

      const analyticsPanel: ContextPanelData = {
        type: 'analytics',
        title: 'Headcount Analysis',
        data: {
          chartData: [{ month: 'Jan', count: 100 }],
        },
        config: {
          chartType: 'bar',
        },
      };

      act(() => {
        result.current.detectAndUpdatePanel('Show headcount by month', 'Here is the data', analyticsPanel);
      });

      expect(mockOnPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'analytics',
          title: 'Headcount Analysis',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle document panel with PIP sanitization', () => {
      const mockOnPanelChange = vi.fn();

      const { result } = renderHook(() =>
        useContextPanelDetection({
          onPanelChange: mockOnPanelChange,
        })
      );

      const validPipContent = `# Performance Improvement Plan

## Performance Issues
- Issue 1
- Issue 2
- Issue 3

## Improvement Goals
- Goal 1
- Goal 2
- Goal 3

## Support & Resources
- Resource 1
- Resource 2

## Check-In Schedule
- Week 1
- Week 2`;

      const pipPanel: ContextPanelData = {
        type: 'document',
        title: 'PIP for John Doe',
        data: { content: validPipContent },
        config: { documentType: 'pip' },
      };

      act(() => {
        result.current.detectAndUpdatePanel('Create PIP for John', 'Here is the plan', pipPanel);
      });

      expect(mockOnPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document',
          title: 'PIP for John Doe',
          data: expect.objectContaining({
            content: expect.stringContaining('Performance Improvement Plan'),
          }),
        })
      );
    });
  });
});
