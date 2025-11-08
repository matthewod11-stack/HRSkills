import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * useLocalStorage Hook
 *
 * Syncs state with localStorage, persisting data across sessions.
 * Automatically serializes/deserializes JSON and handles SSR safely.
 *
 * @template T - The type of value to store
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * function UserPreferences() {
 *   const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('dark')}>Dark Mode</button>
 *       <button onClick={() => setTheme('light')}>Light Mode</button>
 *       <button onClick={removeTheme}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * // With complex objects
 * const [user, setUser] = useLocalStorage('user', {
 *   name: 'Guest',
 *   preferences: { notifications: true }
 * });
 *
 * @example
 * // With array
 * const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
 *   'recent-searches',
 *   []
 * );
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error (e.g., invalid JSON), return initialValue
      console.warn(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value: SetStateAction<T>) => {
      try {
        // Allow value to be a function (same API as useState)
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useSessionStorage Hook
 *
 * Similar to useLocalStorage but uses sessionStorage instead.
 * Data persists only for the current browser session.
 *
 * @template T - The type of value to store
 * @param key - sessionStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * function WizardForm() {
 *   const [wizardStep, setWizardStep] = useSessionStorage('wizard-step', 1);
 *
 *   return (
 *     <div>
 *       <p>Step {wizardStep} of 3</p>
 *       <button onClick={() => setWizardStep(s => s + 1)}>Next</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error loading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value: SetStateAction<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useLocalStorageWithExpiry Hook
 *
 * LocalStorage with automatic expiration.
 * Useful for caching data that should expire after a certain time.
 *
 * @template T - The type of value to store
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist or is expired
 * @param expiryMs - Expiration time in milliseconds
 * @returns Tuple of [value, setValue, removeValue, isExpired]
 *
 * @example
 * ```tsx
 * function CachedData() {
 *   const [data, setData, , isExpired] = useLocalStorageWithExpiry(
 *     'api-cache',
 *     null,
 *     5 * 60 * 1000 // 5 minutes
 *   );
 *
 *   useEffect(() => {
 *     if (!data || isExpired) {
 *       fetchDataFromApi().then(setData);
 *     }
 *   }, [isExpired]);
 *
 *   return <div>{data ? 'Cached' : 'Loading...'}</div>;
 * }
 * ```
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  expiryMs: number
): [T, Dispatch<SetStateAction<T>>, () => void, boolean] {
  const [isExpired, setIsExpired] = useState(false);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (parsed.expiry && now > parsed.expiry) {
        window.localStorage.removeItem(key);
        setIsExpired(true);
        return initialValue;
      }

      return parsed.value as T;
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value: SetStateAction<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setIsExpired(false);

        if (typeof window !== 'undefined') {
          const now = Date.now();
          const item = {
            value: valueToStore,
            expiry: now + expiryMs
          };
          window.localStorage.setItem(key, JSON.stringify(item));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, expiryMs]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      setIsExpired(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isExpired];
}
