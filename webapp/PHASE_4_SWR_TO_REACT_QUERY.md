# Phase 4: SWR to React Query Migration

## Migration Overview

**Goal:** Replace SWR with TanStack React Query (v5) for improved data fetching, caching, and developer experience.

**Scope:** 3 files with minimal SWR usage - straightforward migration

**Estimated Time:** 1-2 hours

## Why React Query?

1. **Better TypeScript support** - Full type inference for queries and mutations
2. **More powerful caching** - Fine-grained cache control and invalidation
3. **DevTools** - React Query DevTools for debugging and cache inspection
4. **Better mutations** - Built-in optimistic updates and rollback
5. **Larger ecosystem** - More widely adopted, better documentation
6. **Next.js 15+ compatibility** - Official Next.js integration

## Current SWR Usage Analysis

### Files to Migrate

1. **lib/hooks/use-employees.ts** (167 lines)
   - Primary employee data hook with CRUD operations
   - Uses: `useSWR`, `mutate`, conditional fetching (`enabled`)
   - Complexity: Medium (custom mutations with optimistic updates)

2. **components/custom/DataSourceManager.tsx** (363 lines)
   - Simple data fetching for first-run status
   - Uses: Basic `useSWR` with fetcher
   - Complexity: Low (read-only)

3. **app/settings/page.tsx** (800 lines)
   - Multiple SWR hooks with polling
   - Uses: `useSWR` with `refreshInterval`, `mutate`
   - Complexity: Medium (polling + mutations)

### SWR Patterns Used

| Pattern | Usage Count | React Query Equivalent |
|---------|-------------|------------------------|
| Basic fetch | 3 | `useQuery` |
| Conditional fetching (`enabled`) | 1 | `useQuery({ enabled })` |
| Polling (`refreshInterval`) | 2 | `useQuery({ refetchInterval })` |
| Manual revalidation (`mutate`) | 4 | `queryClient.invalidateQueries()` |
| Custom fetcher | 3 | `queryFn` |

## Migration Steps

### Step 1: Install React Query
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 2: Set Up QueryClientProvider
Create `app/providers.tsx` with React Query provider wrapping the app.

### Step 3: Migrate Each File

#### 3.1: use-employees.ts
**Before:**
```typescript
const { data, error, isLoading, mutate } = useSWR<EmployeesResponse>(
  shouldFetch ? '/api/employees' : null,
  fetchEmployees,
  { revalidateOnFocus: false, keepPreviousData: true }
);
```

**After:**
```typescript
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['employees'],
  queryFn: () => fetchEmployees('/api/employees'),
  enabled: shouldFetch,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
});
```

#### 3.2: DataSourceManager.tsx
**Before:**
```typescript
const { data: firstRunData } = useSWR('/api/setup/init', fetcher);
```

**After:**
```typescript
const { data: firstRunData } = useQuery({
  queryKey: ['setup', 'init'],
  queryFn: () => fetcher('/api/setup/init'),
});
```

#### 3.3: settings/page.tsx
**Before:**
```typescript
const { data: aiConfigData, mutate: mutateAIConfig } = useSWR(
  '/api/ai/config',
  fetcher,
  { refreshInterval: 30000 }
);
```

**After:**
```typescript
const { data: aiConfigData } = useQuery({
  queryKey: ['ai', 'config'],
  queryFn: () => fetcher('/api/ai/config'),
  refetchInterval: 30000,
});

// For mutations:
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
```

### Step 4: Create Shared Query Keys
Create `lib/query-keys.ts` for centralized query key management:
```typescript
export const queryKeys = {
  employees: ['employees'],
  setup: {
    init: ['setup', 'init'],
  },
  ai: {
    config: ['ai', 'config'],
    quota: ['ai', 'quota'],
  },
};
```

### Step 5: Remove SWR
```bash
npm uninstall swr
```

## Migration Checklist

- [ ] Install @tanstack/react-query and devtools
- [ ] Create app/providers.tsx with QueryClientProvider
- [ ] Update app/layout.tsx to wrap children with providers
- [ ] Create lib/query-keys.ts for centralized keys
- [ ] Migrate lib/hooks/use-employees.ts
  - [ ] Replace useSWR with useQuery
  - [ ] Update mutations to use queryClient.invalidateQueries
  - [ ] Test refresh, add, bulkUpdate, bulkDelete functions
- [ ] Migrate components/custom/DataSourceManager.tsx
  - [ ] Replace useSWR with useQuery
  - [ ] Test data fetching and display
- [ ] Migrate app/settings/page.tsx
  - [ ] Replace all useSWR calls with useQuery
  - [ ] Update polling configuration
  - [ ] Fix manual revalidation to use invalidateQueries
- [ ] Remove swr from package.json
- [ ] Run build to verify no SWR imports remain
- [ ] Test all affected features:
  - [ ] Employee data table loads correctly
  - [ ] Add/update/delete employee operations work
  - [ ] Settings page loads AI config
  - [ ] Polling works for AI config and quota
  - [ ] First-run data displays correctly
- [ ] Update MIGRATION_STATUS.md

## React Query Configuration

### QueryClient Options
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Match current SWR behavior
      retry: 1, // Retry failed requests once
    },
  },
});
```

### DevTools (Development Only)
```typescript
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

## Benefits After Migration

1. **Type Safety**: Full TypeScript inference for all queries
2. **DevTools**: Visual cache inspection and debugging
3. **Better DX**: More intuitive API for mutations and invalidation
4. **Performance**: Same or better caching performance
5. **Future-Proof**: Active development, Next.js 15+ integration

## Rollback Plan

If critical issues arise:
1. Revert commits from Phase 4
2. `npm install swr@2.3.0`
3. Restore original SWR code from git history

## Testing Strategy

### Manual Testing
1. Test employee table CRUD operations
2. Verify settings page AI provider configuration
3. Check polling for AI config and quota
4. Confirm first-run data displays
5. Test error states and loading states

### Automated Testing
- Existing tests will need minor updates for React Query
- Testing strategy deferred to Phase 3.5 when test ecosystem is stable

---

**Status:** ✅ COMPLETE
**Started:** November 17, 2024
**Completed:** November 17, 2024
**Duration:** ~1.5 hours
**Build Status:** ✅ Production build successful
**Test Status:** Deferred (Phase 3.5 test ecosystem issues)
