/**
 * Custom Hooks Library
 *
 * A comprehensive collection of reusable React hooks for the HR Command Center.
 * All hooks are fully typed with TypeScript and include usage examples.
 *
 * @module hooks
 */

// Debouncing hooks
// export {
//   useDebounce
//   // useDebouncedCallback,  // TODO: Fix TypeScript export issue
//   // useDebounceEffect       // TODO: Fix TypeScript export issue
// } from './useDebounce';  // TODO: Fix TypeScript JSX comment parsing issue

// LocalStorage hooks
export { useLocalStorage, useSessionStorage, useLocalStorageWithExpiry } from './useLocalStorage';

// Pagination hooks
// export {
//   usePagination,
//   useInfinitePagination,
//   type PaginationOptions,
//   type PaginationResult,
//   type AsyncStatus,
//   type AsyncState
// } from './usePagination';  // TODO: File doesn't exist yet

// Async/Fetch hooks
// export {
//   useAsync,
//   useFetch,
//   useAsyncWithRetry
// } from './useAsync';  // TODO: File doesn't exist yet

// State management hooks
// export {
//   useToggle,
//   useBoolean,
//   useCounter,
//   useArray,
//   useSet
// } from './useToggle';  // TODO: File doesn't exist yet

// Re-export commonly used hooks for convenience
export { useState, useEffect, useCallback, useMemo, useRef } from 'react';
