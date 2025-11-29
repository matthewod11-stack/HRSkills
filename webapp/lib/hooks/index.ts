/**
 * Custom Hooks Library
 *
 * A comprehensive collection of reusable React hooks for the HR Command Center.
 * All hooks are fully typed with TypeScript and include usage examples.
 *
 * @module hooks
 */

// Re-export commonly used hooks for convenience
export { useCallback, useEffect, useMemo, useRef, useState } from 'react';
export { useDebounce, useDebouncedCallback, useDebounceEffect } from './useDebounce';
export { useLocalStorage, useLocalStorageWithExpiry, useSessionStorage } from './useLocalStorage';
export {
  type PaginationOptions,
  type PaginationResult,
  useInfinitePagination,
  usePagination,
} from './usePagination';
export { useArray, useBoolean, useCounter, useSet, useToggle } from './useToggle';
