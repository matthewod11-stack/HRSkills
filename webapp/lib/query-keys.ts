/**
 * Centralized Query Keys for React Query
 *
 * Following React Query best practices for query key management:
 * - Hierarchical structure (e.g., ['employees'], ['employees', id])
 * - Type-safe with TypeScript
 * - Consistent naming across the app
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

export const queryKeys = {
  /**
   * Employee-related queries
   */
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
  },

  /**
   * Setup and initialization queries
   */
  setup: {
    init: ['setup', 'init'] as const,
  },

  /**
   * AI provider configuration queries
   */
  ai: {
    config: ['ai', 'config'] as const,
    quota: ['ai', 'quota'] as const,
    health: ['ai', 'health'] as const,
  },

  /**
   * Data sources and file management
   */
  data: {
    list: ['data', 'list'] as const,
    preview: (fileId: string) => ['data', 'preview', fileId] as const,
  },
} as const;

/**
 * Type helper for extracting query key types
 */
export type QueryKeys = typeof queryKeys;
