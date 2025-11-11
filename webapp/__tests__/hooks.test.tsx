/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useDebounce,
  useDebouncedCallback,
  useLocalStorage,
  usePagination,
  useAsync,
  useFetch,
  useToggle,
  useBoolean,
  useCounter,
  useArray,
  useSet,
} from '@/lib/hooks';

// Mock timers for debounce tests
jest.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Still initial

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'first' });
    act(() => jest.advanceTimersByTime(250));

    rerender({ value: 'second' });
    act(() => jest.advanceTimersByTime(250));

    // Should still be initial (500ms hasn't passed for 'second')
    expect(result.current).toBe('initial');

    act(() => jest.advanceTimersByTime(250));

    // Now should be 'second'
    expect(result.current).toBe('second');
  });
});

describe('useDebouncedCallback', () => {
  it('should debounce callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // Call multiple times rapidly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only be called once with last argument
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe('"updated"');
  });

  it('should load existing value from localStorage', () => {
    localStorage.setItem('test-key', '"existing"');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('existing');
  });

  it('should remove value from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('value');
    });

    expect(localStorage.getItem('test-key')).toBe('"value"');

    act(() => {
      result.current[2](); // removeValue
    });

    expect(localStorage.getItem('test-key')).toBeNull();
    expect(result.current[0]).toBe('initial');
  });
});

describe('usePagination', () => {
  it('should initialize with correct values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(10);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.hasNext).toBe(true);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevious).toBe(true);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10, initialPage: 5 })
    );

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(4);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(7);
    });

    expect(result.current.currentPage).toBe(7);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10, initialPage: 10 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(10);
  });

  it('should slice items correctly', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    const pageItems = result.current.getCurrentPageItems(items);

    expect(pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('useAsync', () => {
  it('should start in idle state', () => {
    const asyncFn = jest.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful async operation', async () => {
    const asyncFn = jest.fn(() => Promise.resolve('success'));
    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('should handle failed async operation', async () => {
    const error = new Error('Failed');
    const asyncFn = jest.fn(() => Promise.reject(error));
    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => {
      result.current.execute().catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it('should reset state', async () => {
    const asyncFn = jest.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.data).toBeNull();
  });
});

describe('useToggle', () => {
  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useToggle());

    expect(result.current[0]).toBe(false);
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useToggle(true));

    expect(result.current[0]).toBe(true);
  });

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // toggle again
    });

    expect(result.current[0]).toBe(false);
  });

  it('should set to true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[2](); // setTrue
    });

    expect(result.current[0]).toBe(true);
  });

  it('should set to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[3](); // setFalse
    });

    expect(result.current[0]).toBe(false);
  });
});

describe('useBoolean', () => {
  it('should work with object API', () => {
    const { result } = renderHook(() => useBoolean(false));

    expect(result.current.value).toBe(false);

    act(() => {
      result.current.on();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.off();
    });

    expect(result.current.value).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);
  });
});

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should increment', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should respect min value', () => {
    const { result } = renderHook(() => useCounter(0, { min: 0 }));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);
  });

  it('should respect max value', () => {
    const { result } = renderHook(() => useCounter(10, { max: 10 }));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(10);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});

describe('useArray', () => {
  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useArray());

    expect(result.current.value).toEqual([]);
  });

  it('should push items', () => {
    const { result } = renderHook(() => useArray<number>());

    act(() => {
      result.current.push(1);
      result.current.push(2);
    });

    expect(result.current.value).toEqual([1, 2]);
  });

  it('should remove items by index', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.remove(1); // Remove index 1 (value 2)
    });

    expect(result.current.value).toEqual([1, 3]);
  });

  it('should filter items', () => {
    const { result } = renderHook(() => useArray([1, 2, 3, 4, 5]));

    act(() => {
      result.current.filter((n) => n % 2 === 0); // Keep even numbers
    });

    expect(result.current.value).toEqual([2, 4]);
  });

  it('should clear array', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.clear();
    });

    expect(result.current.value).toEqual([]);
  });
});

describe('useSet', () => {
  it('should initialize with empty set', () => {
    const { result } = renderHook(() => useSet<number>());

    expect(result.current.set.size).toBe(0);
  });

  it('should add items', () => {
    const { result } = renderHook(() => useSet<number>());

    act(() => {
      result.current.add(1);
      result.current.add(2);
      result.current.add(1); // Duplicate
    });

    expect(result.current.size).toBe(2);
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(2)).toBe(true);
  });

  it('should remove items', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));

    act(() => {
      result.current.remove(2);
    });

    expect(result.current.size).toBe(2);
    expect(result.current.has(2)).toBe(false);
  });

  it('should toggle items', () => {
    const { result } = renderHook(() => useSet([1, 2]));

    act(() => {
      result.current.toggle(2); // Remove
      result.current.toggle(3); // Add
    });

    expect(result.current.has(2)).toBe(false);
    expect(result.current.has(3)).toBe(true);
  });

  it('should clear set', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));

    act(() => {
      result.current.clear();
    });

    expect(result.current.size).toBe(0);
  });
});

// Restore real timers
afterAll(() => {
  jest.useRealTimers();
});
