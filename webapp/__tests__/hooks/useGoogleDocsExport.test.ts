import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useGoogleDocsExport } from '@/lib/hooks/useGoogleDocsExport';
import type { Message } from '@/components/custom/chat/ChatContext';

// Mock fetch
global.fetch = vi.fn();

// Mock window methods
global.confirm = vi.fn();
global.alert = vi.fn();

describe('useGoogleDocsExport', () => {
  let mockGetAuthHeaders: vi.Mock;
  let mockOnError: vi.Mock;
  let consoleSpy: vi.SpyInstance;

  beforeEach(() => {
    mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
    mockOnError = vi.fn();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation();

    // Reset fetch mock
    (global.fetch as vi.Mock).mockClear();
    (global.confirm as vi.Mock).mockClear();
    (global.alert as vi.Mock).mockClear();

    // Mock window.open
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('detectDocumentType', () => {
    it('should detect document type from workflow', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Some content',
        timestamp: new Date(),
        detectedWorkflow: 'hiring',
      };

      const type = result.current.detectDocumentType(message);
      expect(type).toBe('Job Description');
    });

    it('should detect performance document from workflow', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Performance review content',
        timestamp: new Date(),
        detectedWorkflow: 'performance',
      };

      expect(result.current.detectDocumentType(message)).toBe('Performance Document');
    });

    it('should detect document type from content (offer letter)', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'This is an offer letter for John Doe',
        timestamp: new Date(),
      };

      const type = result.current.detectDocumentType(message);
      expect(type).toBe('Offer Letter');
    });

    it('should detect PIP from content', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Performance Improvement Plan for Jane Smith',
        timestamp: new Date(),
      };

      expect(result.current.detectDocumentType(message)).toBe('PIP');
    });

    it('should detect termination letter from content', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Termination of employment effective immediately',
        timestamp: new Date(),
      };

      expect(result.current.detectDocumentType(message)).toBe('Termination Letter');
    });

    it('should detect job description from content', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Job description for Software Engineer position',
        timestamp: new Date(),
      };

      expect(result.current.detectDocumentType(message)).toBe('Job Description');
    });

    it('should use workflow detection first, then content detection', () => {
      const { result} = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      // When workflow is present, use it first
      const messageWithWorkflow: Message = {
        id: 1,
        role: 'assistant',
        content: 'This is an offer letter',
        timestamp: new Date(),
        detectedWorkflow: 'hiring',
      };

      const typeWithWorkflow = result.current.detectDocumentType(messageWithWorkflow);
      expect(typeWithWorkflow).toBe('Job Description'); // Workflow takes precedence

      // When no workflow, use content detection
      const messageWithoutWorkflow: Message = {
        id: 2,
        role: 'assistant',
        content: 'This is an offer letter',
        timestamp: new Date(),
      };

      const typeFromContent = result.current.detectDocumentType(messageWithoutWorkflow);
      expect(typeFromContent).toBe('Offer Letter'); // Content detection used
    });

    it('should return "Document" as fallback when no match', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Some random content',
        timestamp: new Date(),
      };

      const type = result.current.detectDocumentType(message);
      expect(type).toBe('Document');
    });
  });

  describe('generateDocumentTitle', () => {
    it('should generate title with document type and date', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const date = new Date('2025-11-14T10:30:00Z');
      const title = result.current.generateDocumentTitle('Offer Letter', date);

      expect(title).toBe('Offer Letter_2025-11-14');
    });

    it('should format date correctly', () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const date = new Date('2025-01-05T15:45:00Z');
      const title = result.current.generateDocumentTitle('PIP', date);

      expect(title).toBe('PIP_2025-01-05');
    });
  });

  describe('exportToGoogleDocs', () => {
    it('should successfully export document', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Offer letter content',
        timestamp: new Date('2025-11-14'),
        detectedWorkflow: 'hiring',
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          editLink: 'https://docs.google.com/document/d/abc123/edit',
          webViewLink: 'https://docs.google.com/document/d/abc123/view',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/documents/export-to-google-docs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: expect.stringContaining('Offer letter content'),
        })
      );

      expect(window.open).toHaveBeenCalledWith(
        'https://docs.google.com/document/d/abc123/edit',
        '_blank'
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should include correct metadata in export request', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'PIP content',
        timestamp: new Date('2025-11-14'),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          editLink: 'https://docs.google.com/document/d/abc123/edit',
          webViewLink: 'https://docs.google.com/document/d/abc123/view',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toMatchObject({
        title: 'PIP_2025-11-14',
        content: 'PIP content',
        documentType: 'PIP',
        metadata: {
          date: '2025-11-14',
        },
      });
    });

    it('should prompt for OAuth when needsAuth is true', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        timestamp: new Date(),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          needsAuth: true,
        }),
      });

      (global.confirm as vi.Mock).mockReturnValue(true);

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(global.confirm).toHaveBeenCalledWith(
        'You need to connect your Google account to export documents. You will be redirected to Google. Connect now?'
      );
      // Note: We can't test window.location.href in jsdom as it doesn't support navigation
      // The hook will attempt to redirect, which is the expected behavior
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should not redirect if user declines OAuth', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        timestamp: new Date(),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          needsAuth: true,
        }),
      });

      (global.confirm as vi.Mock).mockReturnValue(false);

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
      // Just verify confirm was called - we can't easily test location.href wasn't set without complex mocking
    });

    it('should handle export errors with custom error handler', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        timestamp: new Date(),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Permission denied',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to export document: Permission denied'
      );
    });

    it('should handle export errors without custom error handler', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        timestamp: new Date(),
      };

      (global.fetch as vi.Mock).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Google Docs export error:',
        expect.any(Error)
      );
      expect(global.alert).toHaveBeenCalledWith('Failed to export document: Network error');

      consoleErrorSpy.mockRestore();
    });

    it('should handle API error response', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        timestamp: new Date(),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Document creation failed',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Document creation failed',
        }),
        'Failed to export document: Document creation failed'
      );
    });

    it('should use default timestamp if message has none', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Document content',
        // No timestamp
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          editLink: 'https://docs.google.com/document/d/abc123/edit',
          webViewLink: 'https://docs.google.com/document/d/abc123/view',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should have a title and metadata.date (using current date)
      expect(requestBody.title).toMatch(/Document_\d{4}-\d{2}-\d{2}/);
      expect(requestBody.metadata.date).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow-based export', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'Comprehensive performance review document...',
        timestamp: new Date('2025-11-14'),
        detectedWorkflow: 'performance',
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          editLink: 'https://docs.google.com/document/d/perf123/edit',
          webViewLink: 'https://docs.google.com/document/d/perf123/view',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.documentType).toBe('Performance Document');
      expect(requestBody.title).toBe('Performance Document_2025-11-14');
      expect(window.open).toHaveBeenCalledWith(
        'https://docs.google.com/document/d/perf123/edit',
        '_blank'
      );
    });

    it('should handle complete content-based export', async () => {
      const { result } = renderHook(() =>
        useGoogleDocsExport({
          getAuthHeaders: mockGetAuthHeaders,
          onError: mockOnError,
        })
      );

      const message: Message = {
        id: 1,
        role: 'assistant',
        content: 'This is a reference letter for John Doe who worked here for 5 years...',
        timestamp: new Date('2025-11-14'),
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          editLink: 'https://docs.google.com/document/d/ref123/edit',
          webViewLink: 'https://docs.google.com/document/d/ref123/view',
        }),
      });

      await act(async () => {
        await result.current.exportToGoogleDocs(message);
      });

      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.documentType).toBe('Reference Letter');
      expect(requestBody.title).toBe('Reference Letter_2025-11-14');
    });
  });
});
