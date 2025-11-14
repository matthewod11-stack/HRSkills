import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useDebounce
 * Returns a debounced value that only updates after the specified delay.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback
 * Returns a debounced version of the provided callback.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  debouncedFn.cancel = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  };

  return debouncedFn;
}

/**
 * useDebounceEffect
 * Runs a side effect after the provided dependencies stop changing for the delay.
 */
export function useDebounceEffect(effect: () => void | (() => void), deps: any[], delay = 300) {
  const cleanupRef = useRef<void | (() => void)>();

  useEffect(() => {
    const handler = window.setTimeout(() => {
      cleanupRef.current = effect();
    }, delay);

    return () => {
      window.clearTimeout(handler);
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
