import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { usePIIDetection } from '@/lib/hooks/usePIIDetection';
import { detectSensitivePII } from '@/lib/pii-detector';

// Mock the PII detector
vi.mock('@/lib/pii-detector', () => ({
  detectSensitivePII: vi.fn(),
}));

const mockDetectSensitivePII = detectSensitivePII as vi.MockedFunction<typeof detectSensitivePII>;

describe('usePIIDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkForPII', () => {
    it('should return false when no PII is detected', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: false,
        types: [],
        message: '',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII('This is a safe message');
      });

      expect(isBlocked).toBe(false);
      expect(result.current.piiWarning.show).toBe(false);
      expect(result.current.hasPendingPII).toBe(false);
    });

    it('should return true and show warning when PII is detected', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN', 'Email'],
        message: 'Social Security Number and Email detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII('My SSN is 123-45-6789 and email is test@example.com');
      });

      expect(isBlocked).toBe(true);
      expect(result.current.piiWarning.show).toBe(true);
      expect(result.current.piiWarning.types).toEqual(['SSN', 'Email']);
      expect(result.current.piiWarning.message).toBe('Social Security Number and Email detected');
      expect(result.current.piiWarning.pendingText).toBe('My SSN is 123-45-6789 and email is test@example.com');
      expect(result.current.hasPendingPII).toBe(true);
      expect(result.current.piiTypes).toEqual(['SSN', 'Email']);
    });

    it('should detect credit card numbers', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['Credit Card'],
        message: 'Credit card number detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII('Card: 4111-1111-1111-1111');
      });

      expect(isBlocked).toBe(true);
      expect(result.current.piiWarning.types).toEqual(['Credit Card']);
    });

    it('should detect multiple PII types', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN', 'Phone', 'DOB', 'Address'],
        message: 'Multiple PII types detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII('SSN: 123-45-6789, Phone: 555-1234, DOB: 01/01/1990, Address: 123 Main St');
      });

      expect(isBlocked).toBe(true);
      expect(result.current.piiWarning.types).toHaveLength(4);
      expect(result.current.piiWarning.types).toContain('SSN');
      expect(result.current.piiWarning.types).toContain('Phone');
      expect(result.current.piiWarning.types).toContain('DOB');
      expect(result.current.piiWarning.types).toContain('Address');
    });
  });

  describe('handleEditMessage', () => {
    it('should clear warning and call onEdit callback', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN'],
        message: 'SSN detected',
      });

      const mockOnEdit = vi.fn();
      const { result } = renderHook(() => usePIIDetection({ onEdit: mockOnEdit }));

      // Detect PII first
      act(() => {
        result.current.checkForPII('SSN: 123-45-6789');
      });

      expect(result.current.piiWarning.show).toBe(true);

      // Edit message
      act(() => {
        result.current.handleEditMessage();
      });

      expect(result.current.piiWarning.show).toBe(false);
      expect(result.current.piiWarning.pendingText).toBe('');
      expect(result.current.hasPendingPII).toBe(false);
      expect(mockOnEdit).toHaveBeenCalledWith('SSN: 123-45-6789');
    });

    it('should focus input field when inputRef is provided', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['Email'],
        message: 'Email detected',
      });

      const mockInputRef = {
        current: {
          focus: vi.fn(),
        },
      };

      const { result } = renderHook(() => usePIIDetection({ inputRef: mockInputRef as any }));

      // Detect PII
      act(() => {
        result.current.checkForPII('Email: test@example.com');
      });

      // Edit
      act(() => {
        result.current.handleEditMessage();
      });

      expect(mockInputRef.current.focus).toHaveBeenCalled();
    });

    it('should work without callbacks', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['Phone'],
        message: 'Phone detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      act(() => {
        result.current.checkForPII('Phone: 555-1234');
      });

      // Should not throw even without callbacks
      expect(() => {
        act(() => {
          result.current.handleEditMessage();
        });
      }).not.toThrow();

      expect(result.current.piiWarning.show).toBe(false);
    });
  });

  describe('handleProceedWithPII', () => {
    it('should clear warning and call onSendWithBypass callback', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN'],
        message: 'SSN detected',
      });

      const mockOnSendWithBypass = vi.fn();
      const { result } = renderHook(() => usePIIDetection({ onSendWithBypass: mockOnSendWithBypass }));

      // Detect PII
      act(() => {
        result.current.checkForPII('SSN: 123-45-6789');
      });

      expect(result.current.piiWarning.show).toBe(true);

      // Proceed anyway
      act(() => {
        result.current.handleProceedWithPII();
      });

      expect(result.current.piiWarning.show).toBe(false);
      expect(result.current.piiWarning.pendingText).toBe('');
      expect(mockOnSendWithBypass).toHaveBeenCalledWith('SSN: 123-45-6789');
    });

    it('should work without callback', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['Email'],
        message: 'Email detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      act(() => {
        result.current.checkForPII('Email: test@example.com');
      });

      // Should not throw even without callback
      expect(() => {
        act(() => {
          result.current.handleProceedWithPII();
        });
      }).not.toThrow();

      expect(result.current.piiWarning.show).toBe(false);
    });
  });

  describe('dismissPIIWarning', () => {
    it('should clear warning without triggering callbacks', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN'],
        message: 'SSN detected',
      });

      const mockOnEdit = vi.fn();
      const mockOnSendWithBypass = vi.fn();

      const { result } = renderHook(() =>
        usePIIDetection({
          onEdit: mockOnEdit,
          onSendWithBypass: mockOnSendWithBypass,
        })
      );

      // Detect PII
      act(() => {
        result.current.checkForPII('SSN: 123-45-6789');
      });

      expect(result.current.piiWarning.show).toBe(true);

      // Dismiss
      act(() => {
        result.current.dismissPIIWarning();
      });

      expect(result.current.piiWarning.show).toBe(false);
      expect(result.current.piiWarning.pendingText).toBe('');
      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnSendWithBypass).not.toHaveBeenCalled();
    });
  });

  describe('resetPIIWarning', () => {
    it('should reset all PII warning state', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN', 'Email'],
        message: 'PII detected',
      });

      const { result } = renderHook(() => usePIIDetection());

      // Detect PII
      act(() => {
        result.current.checkForPII('SSN and Email');
      });

      expect(result.current.piiWarning.show).toBe(true);
      expect(result.current.piiWarning.types).toHaveLength(2);

      // Reset
      act(() => {
        result.current.resetPIIWarning();
      });

      expect(result.current.piiWarning).toEqual({
        show: false,
        types: [],
        message: '',
        pendingText: '',
      });
      expect(result.current.hasPendingPII).toBe(false);
      expect(result.current.piiTypes).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string input', () => {
      mockDetectSensitivePII.mockReturnValue({
        detected: false,
        types: [],
        message: '',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII('');
      });

      expect(isBlocked).toBe(false);
      expect(mockDetectSensitivePII).toHaveBeenCalledWith('');
    });

    it('should handle very long text with multiple PII types', () => {
      const longText = 'Lorem ipsum dolor sit amet... SSN: 123-45-6789... more text... Email: test@example.com... even more text...'.repeat(10);

      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN', 'Email'],
        message: 'Multiple PII types detected in long text',
      });

      const { result } = renderHook(() => usePIIDetection());

      let isBlocked: boolean = false;
      act(() => {
        isBlocked = result.current.checkForPII(longText);
      });

      expect(isBlocked).toBe(true);
      expect(result.current.piiWarning.pendingText).toBe(longText);
    });

    it('should maintain state across multiple detections', () => {
      const { result } = renderHook(() => usePIIDetection());

      // First detection
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN'],
        message: 'SSN detected',
      });

      act(() => {
        result.current.checkForPII('First: SSN 123-45-6789');
      });

      expect(result.current.piiWarning.pendingText).toBe('First: SSN 123-45-6789');

      // Dismiss
      act(() => {
        result.current.dismissPIIWarning();
      });

      // Second detection
      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['Email'],
        message: 'Email detected',
      });

      act(() => {
        result.current.checkForPII('Second: test@example.com');
      });

      expect(result.current.piiWarning.pendingText).toBe('Second: test@example.com');
      expect(result.current.piiWarning.types).toEqual(['Email']);
    });
  });

  describe('concurrent operations', () => {
    it('should handle rapid successive PII checks', () => {
      const { result } = renderHook(() => usePIIDetection());

      mockDetectSensitivePII.mockReturnValue({
        detected: true,
        types: ['SSN'],
        message: 'SSN detected',
      });

      // Multiple rapid checks
      act(() => {
        result.current.checkForPII('Text 1');
        result.current.checkForPII('Text 2');
        result.current.checkForPII('Text 3');
      });

      // Should have the last one
      expect(result.current.piiWarning.pendingText).toBe('Text 3');
    });

    it('should handle edit and proceed calls without prior detection', () => {
      const mockOnEdit = vi.fn();
      const mockOnSendWithBypass = vi.fn();

      const { result } = renderHook(() =>
        usePIIDetection({
          onEdit: mockOnEdit,
          onSendWithBypass: mockOnSendWithBypass,
        })
      );

      // Call handlers without detecting PII first
      act(() => {
        result.current.handleEditMessage();
      });

      expect(mockOnEdit).toHaveBeenCalledWith('');

      act(() => {
        result.current.handleProceedWithPII();
      });

      expect(mockOnSendWithBypass).toHaveBeenCalledWith('');
    });
  });
});
