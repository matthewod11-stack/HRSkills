/**
 * Custom Hooks Test Suite
 *
 * Comprehensive tests for all custom React hooks with React 19 compatibility.
 * Uses @testing-library/react's renderHook with proper React context.
 */

import { act, renderHook } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useArray,
  useBoolean,
  useCounter,
  useDebounce,
  useDebouncedCallback,
  useInfinitePagination,
  useLocalStorage,
  usePagination,
  useSet,
  useToggle,
} from '@/lib/hooks';

// Cleanup after each test
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  localStorage.clear();
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Still initial

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    // First change
    rerender({ value: 'first' });
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe('initial');

    // Second change (cancels first timeout)
    rerender({ value: 'second' });
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe('initial'); // Still initial (500ms hasn't passed for 'second')

    // Complete the debounce delay for 'second'
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe('second');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    rerender({ value: 'updated', delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });

  it('should handle complex object values', () => {
    const initialObj = { id: 1, name: 'initial' };
    const updatedObj = { id: 2, name: 'updated' };

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: initialObj },
    });

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toEqual(updatedObj);
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // Call multiple times rapidly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should only be called once with last argument
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });

  it('should handle multiple arguments', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));

    act(() => {
      result.current('arg1', 'arg2', 'arg3');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should reset timer on each call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Now should be called with 'second'
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('should update callback reference without resetting timer', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 300), {
      initialProps: { cb: callback1 },
    });

    act(() => {
      result.current('test');
    });

    // Change callback before timer expires
    rerender({ cb: callback2 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should call the new callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('test');
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

  it('should handle complex objects', () => {
    const initialObj = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialObj));

    expect(result.current[0]).toEqual(initialObj);

    const updatedObj = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](updatedObj);
    });

    expect(result.current[0]).toEqual(updatedObj);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(updatedObj);
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle arrays', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('numbers', []));

    act(() => {
      result.current[1]([1, 2, 3]);
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('invalid-key', 'not valid json');

    const { result } = renderHook(() => useLocalStorage('invalid-key', 'default'));

    // Should fall back to initial value
    expect(result.current[0]).toBe('default');
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
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevious).toBe(true);
    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(20);
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

  it('should not go before first page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should slice items correctly', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    const pageItems = result.current.getCurrentPageItems(items);

    expect(pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('should update when page size changes', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(5);

    act(() => {
      result.current.setPageSize(25);
    });

    expect(result.current.pageSize).toBe(25);
    expect(result.current.totalPages).toBe(4);
    expect(result.current.currentPage).toBe(1); // Reset to first page
  });

  it('should go to first and last page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10, initialPage: 5 })
    );

    act(() => {
      result.current.firstPage();
    });

    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.currentPage).toBe(10);
  });

  it('should generate page numbers with ellipsis', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10, initialPage: 5 })
    );

    const pageNumbers = result.current.pageNumbers;
    expect(pageNumbers).toContain(1);
    expect(pageNumbers).toContain(10);
    expect(pageNumbers).toContain('...');
  });

  it('should handle edge case with 0 items', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 0, itemsPerPage: 10 }));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle partial last page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 95, itemsPerPage: 10 }));

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.currentPage).toBe(10);
    expect(result.current.endIndex).toBe(95); // Not 100
  });
});

describe('useInfinitePagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should initialize with first page loaded', () => {
    const { result } = renderHook(() => useInfinitePagination(50, 10));

    expect(result.current.loadedItems).toBe(10);
    expect(result.current.loadedPages).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should load additional items asynchronously', async () => {
    const { result } = renderHook(() => useInfinitePagination(50, 10));

    expect(result.current.loadedItems).toBe(10);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      const promise = result.current.loadMore();
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.loadedItems).toBe(20);
    expect(result.current.loadedPages).toBe(2);
  });

  it('should prevent loading when already loading', async () => {
    const { result } = renderHook(() => useInfinitePagination(50, 10));

    await act(async () => {
      const promise1 = result.current.loadMore();
      const promise2 = result.current.loadMore(); // Should be ignored

      vi.advanceTimersByTime(500);
      await Promise.all([promise1, promise2]);
    });

    expect(result.current.loadedPages).toBe(2); // Not 3
  });

  it('should not load more when no items remain', async () => {
    const { result } = renderHook(() => useInfinitePagination(20, 10));

    // Load second page
    await act(async () => {
      const promise = result.current.loadMore();
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.loadedItems).toBe(20);
    expect(result.current.hasMore).toBe(false);

    // Try to load more (should be ignored)
    await act(async () => {
      const promise = result.current.loadMore();
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.loadedPages).toBe(2); // Still 2
  });

  it('should reset to first page', async () => {
    const { result } = renderHook(() => useInfinitePagination(50, 10));

    // Load more pages
    await act(async () => {
      const promise = result.current.loadMore();
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.loadedPages).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.loadedItems).toBe(10);
    expect(result.current.loadedPages).toBe(1);
    expect(result.current.isLoading).toBe(false);
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

    // Calling again should keep it true
    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe(true);
  });

  it('should set to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[3](); // setFalse
    });

    expect(result.current[0]).toBe(false);

    // Calling again should keep it false
    act(() => {
      result.current[3]();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should support setValue with boolean', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[4](true); // setValue
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[4](false);
    });

    expect(result.current[0]).toBe(false);
  });

  it('should support setValue with function', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[4]((prev) => !prev);
    });

    expect(result.current[0]).toBe(true);
  });
});

describe('useBoolean', () => {
  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useBoolean());

    expect(result.current.value).toBe(false);
  });

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

  it('should support setValue', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.setValue((prev) => !prev);
    });

    expect(result.current.value).toBe(false);
  });
});

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('should increment', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(2);
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

  it('should support custom step value', () => {
    const { result } = renderHook(() => useCounter(0, { step: 5 }));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(5);

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);
  });

  it('should support setValue', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.setValue(10);
    });

    expect(result.current.count).toBe(10);
  });

  it('should support setValue with function', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.setValue((prev) => prev * 2);
    });

    expect(result.current.count).toBe(10);
  });

  it('should clamp setValue to min/max bounds', () => {
    const { result } = renderHook(() => useCounter(5, { min: 0, max: 10 }));

    act(() => {
      result.current.setValue(15);
    });

    expect(result.current.count).toBe(10);

    act(() => {
      result.current.setValue(-5);
    });

    expect(result.current.count).toBe(0);
  });
});

describe('useArray', () => {
  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useArray());

    expect(result.current.value).toEqual([]);
  });

  it('should initialize with provided array', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    expect(result.current.value).toEqual([1, 2, 3]);
  });

  it('should push items', () => {
    const { result } = renderHook(() => useArray<number>());

    act(() => {
      result.current.push(1);
    });

    expect(result.current.value).toEqual([1]);

    act(() => {
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

  it('should update items by index', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.update(1, 10);
    });

    expect(result.current.value).toEqual([1, 10, 3]);
  });

  it('should update items with function', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.update(1, (old) => old * 2);
    });

    expect(result.current.value).toEqual([1, 4, 3]);
  });

  it('should clear array', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.clear();
    });

    expect(result.current.value).toEqual([]);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useArray([1, 2, 3]));

    act(() => {
      result.current.push(4);
    });

    expect(result.current.value).toEqual([1, 2, 3, 4]);

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toEqual([1, 2, 3]);
  });

  it('should handle complex objects', () => {
    type User = { id: number; name: string };
    const { result } = renderHook(() =>
      useArray<User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    );

    act(() => {
      result.current.push({ id: 3, name: 'Charlie' });
    });

    expect(result.current.value).toHaveLength(3);
    expect(result.current.value[2].name).toBe('Charlie');
  });
});

describe('useSet', () => {
  it('should initialize with empty set', () => {
    const { result } = renderHook(() => useSet<number>());

    expect(result.current.set.size).toBe(0);
    expect(result.current.size).toBe(0);
  });

  it('should initialize with array', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));

    expect(result.current.size).toBe(3);
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(2)).toBe(true);
    expect(result.current.has(3)).toBe(true);
  });

  it('should add items', () => {
    const { result } = renderHook(() => useSet<number>());

    act(() => {
      result.current.add(1);
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has(1)).toBe(true);

    act(() => {
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
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(3)).toBe(true);
  });

  it('should toggle items', () => {
    const { result } = renderHook(() => useSet([1, 2]));

    act(() => {
      result.current.toggle(2); // Remove
      result.current.toggle(3); // Add
    });

    expect(result.current.has(2)).toBe(false);
    expect(result.current.has(3)).toBe(true);
    expect(result.current.size).toBe(2);
  });

  it('should clear set', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));

    act(() => {
      result.current.clear();
    });

    expect(result.current.size).toBe(0);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));

    act(() => {
      result.current.add(4);
    });

    expect(result.current.size).toBe(4);

    act(() => {
      result.current.reset();
    });

    expect(result.current.size).toBe(3);
    expect(result.current.has(4)).toBe(false);
  });

  it('should handle string values', () => {
    const { result } = renderHook(() => useSet(['a', 'b']));

    act(() => {
      result.current.add('c');
    });

    expect(result.current.size).toBe(3);
    expect(result.current.has('c')).toBe(true);
  });

  it('should maintain uniqueness', () => {
    const { result } = renderHook(() => useSet<number>());

    act(() => {
      result.current.add(1);
      result.current.add(1);
      result.current.add(1);
    });

    expect(result.current.size).toBe(1);
  });
});

// Restore real timers at the end of all tests
afterAll(() => {
  vi.useRealTimers();
});
