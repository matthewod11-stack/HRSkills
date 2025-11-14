/**
 * Custom Hooks Library
 *
 * A comprehensive collection of reusable React hooks for the HR Command Center.
 * All hooks are fully typed with TypeScript and include usage examples.
 *
 * @module hooks
 */

export { useDebounce, useDebouncedCallback, useDebounceEffect } from './useDebounce';
export { useLocalStorage, useSessionStorage, useLocalStorageWithExpiry } from './useLocalStorage';
export {
  usePagination,
  useInfinitePagination,
  type PaginationOptions,
  type PaginationResult,
} from './usePagination';
export { useToggle, useBoolean, useCounter, useArray, useSet } from './useToggle';

// Re-export commonly used hooks for convenience
export { useState, useEffect, useCallback, useMemo, useRef } from 'react';
