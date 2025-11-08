import { useState, useMemo, useCallback } from 'react';

/**
 * Pagination configuration options
 */
export interface PaginationOptions {
  /** Total number of items */
  totalItems: number;
  /** Items per page (default: 10) */
  itemsPerPage?: number;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Number of page buttons to show (default: 5) */
  siblingCount?: number;
}

/**
 * Pagination state and controls
 */
export interface PaginationResult {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Starting index for current page (0-indexed) */
  startIndex: number;
  /** Ending index for current page (0-indexed) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Array of page numbers to display */
  pageNumbers: (number | string)[];
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Set items per page */
  setPageSize: (size: number) => void;
  /** Get items for current page */
  getCurrentPageItems: <T>(items: T[]) => T[];
}

/**
 * usePagination Hook
 *
 * Provides complete pagination functionality with page navigation,
 * dynamic page size, and item slicing.
 *
 * @param options - Pagination configuration
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * function EmployeeList({ employees }: { employees: Employee[] }) {
 *   const {
 *     currentPage,
 *     totalPages,
 *     pageNumbers,
 *     getCurrentPageItems,
 *     nextPage,
 *     previousPage,
 *     goToPage,
 *     hasPrevious,
 *     hasNext
 *   } = usePagination({
 *     totalItems: employees.length,
 *     itemsPerPage: 20
 *   });
 *
 *   const currentEmployees = getCurrentPageItems(employees);
 *
 *   return (
 *     <div>
 *       <EmployeeTable data={currentEmployees} />
 *       <div className="pagination">
 *         <button onClick={previousPage} disabled={!hasPrevious}>
 *           Previous
 *         </button>
 *         {pageNumbers.map((page, index) => (
 *           page === '...' ? (
 *             <span key={index}>...</span>
 *           ) : (
 *             <button
 *               key={page}
 *               onClick={() => goToPage(page as number)}
 *               className={currentPage === page ? 'active' : ''}
 *             >
 *               {page}
 *             </button>
 *           )
 *         ))}
 *         <button onClick={nextPage} disabled={!hasNext}>
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * // With dynamic page size
 * const pagination = usePagination({
 *   totalItems: 1000,
 *   itemsPerPage: 25,
 *   siblingCount: 2 // Show 2 pages before/after current
 * });
 *
 * <select onChange={(e) => pagination.setPageSize(Number(e.target.value))}>
 *   <option value={10}>10 per page</option>
 *   <option value={25}>25 per page</option>
 *   <option value={50}>50 per page</option>
 * </select>
 */
export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
  siblingCount = 1
}: PaginationOptions): PaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Ensure current page is valid when totalPages changes
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calculate start and end indices
  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  // Check for previous/next availability
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate page numbers array with ellipsis
  const pageNumbers = useMemo(() => {
    const range = (start: number, end: number): number[] => {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const totalPageNumbers = siblingCount + 5; // siblings + first + last + current + 2 ellipsis

    // If total pages is less than what we want to show, return all pages
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // No left dots, but show right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, '...', totalPages];
    }

    // Show left dots, but no right dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, '...', ...rightRange];
    }

    // Show both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    return range(1, totalPages);
  }, [totalPages, currentPage, siblingCount]);

  // Navigation functions
  const goToPage = useCallback(
    (page: number) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Helper to get current page items
  const getCurrentPageItems = useCallback(
    <T,>(items: T[]): T[] => {
      return items.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  return {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    startIndex,
    endIndex,
    hasPrevious,
    hasNext,
    pageNumbers,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize: handleSetPageSize,
    getCurrentPageItems
  };
}

/**
 * useInfinitePagination Hook
 *
 * For infinite scroll / "load more" patterns.
 * Tracks how many pages have been loaded and provides a function to load more.
 *
 * @param totalItems - Total number of items available
 * @param itemsPerPage - Items to load per page
 * @returns Infinite pagination controls
 *
 * @example
 * ```tsx
 * function InfiniteList({ allItems }: { allItems: Item[] }) {
 *   const {
 *     loadedItems,
 *     hasMore,
 *     loadMore,
 *     reset,
 *     isLoading
 *   } = useInfinitePagination(allItems.length, 20);
 *
 *   const visibleItems = allItems.slice(0, loadedItems);
 *
 *   return (
 *     <div>
 *       {visibleItems.map(item => <ItemCard key={item.id} item={item} />)}
 *       {hasMore && (
 *         <button onClick={loadMore} disabled={isLoading}>
 *           {isLoading ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfinitePagination(
  totalItems: number,
  itemsPerPage: number = 20
) {
  const [loadedPages, setLoadedPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const loadedItems = useMemo(
    () => Math.min(loadedPages * itemsPerPage, totalItems),
    [loadedPages, itemsPerPage, totalItems]
  );

  const hasMore = useMemo(
    () => loadedItems < totalItems,
    [loadedItems, totalItems]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    // Simulate async loading (remove in production)
    await new Promise(resolve => setTimeout(resolve, 500));

    setLoadedPages((prev) => prev + 1);
    setIsLoading(false);
  }, [hasMore, isLoading]);

  const reset = useCallback(() => {
    setLoadedPages(1);
    setIsLoading(false);
  }, []);

  return {
    loadedItems,
    loadedPages,
    hasMore,
    isLoading,
    loadMore,
    reset
  };
}
