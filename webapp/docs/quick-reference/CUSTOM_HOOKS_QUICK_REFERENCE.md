# Custom Hooks - Quick Reference

Quick reference for all custom hooks in the HR Command Center.

---

## 🔍 Search & Debouncing

### useDebounce

```tsx
const debouncedValue = useDebounce(value, 500);
```

- Delays value updates by specified milliseconds
- Perfect for search inputs

### useDebouncedCallback

```tsx
const debouncedFn = useDebouncedCallback(callback, 500);
```

- Debounces function calls
- Use for auto-save, resize handlers

---

## 💾 Storage & Persistence

### useLocalStorage

```tsx
const [value, setValue, removeValue] = useLocalStorage('key', initialValue);
```

- Syncs state with localStorage
- SSR-safe, auto-serializes JSON
- Cross-tab synchronization

### useSessionStorage

```tsx
const [value, setValue, removeValue] = useSessionStorage('key', initialValue);
```

- Same as useLocalStorage but session-scoped

### useLocalStorageWithExpiry

```tsx
const [value, setValue, remove, isExpired] = useLocalStorageWithExpiry(
  'key',
  initialValue,
  5 * 60 * 1000 // 5 minutes
);
```

- Auto-expiring cache
- Perfect for temporary data

---

## 📄 Pagination

### usePagination

```tsx
const {
  currentPage,
  totalPages,
  pageNumbers, // [1, 2, '...', 10]
  getCurrentPageItems,
  nextPage,
  previousPage,
  goToPage,
  setPageSize,
} = usePagination({
  totalItems: 100,
  itemsPerPage: 20,
});

const currentItems = getCurrentPageItems(allItems);
```

### useInfinitePagination

```tsx
const { loadedItems, hasMore, loadMore, reset } = useInfinitePagination(totalItems, 20);
```

- Infinite scroll / "Load More"

---

## 🌐 Async & Data Fetching

### useAsync

```tsx
const { data, error, isLoading, isSuccess, isError, execute, reset } = useAsync(
  asyncFunction,
  immediate
);
```

- Generic async operation handler
- Race condition safe

### useFetch

```tsx
const { data, error, isLoading, refetch } = useFetch<User>('/api/users');
```

- HTTP request wrapper
- Auto JSON parsing

### useAsyncWithRetry

```tsx
const { data, retryCount, canRetry, retry } = useAsyncWithRetry(asyncFn, maxRetries, delay);
```

- Auto-retry on failure

---

## 🎛️ State Management

### useToggle

```tsx
const [value, toggle, setTrue, setFalse, setValue] = useToggle(false);
```

- Boolean state with helpers
- Perfect for modals, checkboxes

### useBoolean

```tsx
const bool = useBoolean(false);
bool.value; // current value
bool.on(); // set true
bool.off(); // set false
bool.toggle(); // toggle
```

- Object API for boolean

### useCounter

```tsx
const { count, increment, decrement, reset, setValue } = useCounter(0, {
  min: 0,
  max: 100,
  step: 1,
});
```

- Numeric state with bounds

### useArray

```tsx
const { value, push, remove, removeById, filter, update, updateById, clear, reset } =
  useArray<Todo>([]);
```

- Array manipulation utilities

### useSet

```tsx
const { set, add, remove, toggle, has, clear, size } = useSet<string>(['item1']);
```

- Set data structure management

---

## 📋 Common Patterns

### Search with Debouncing

```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### API Call with Loading

```tsx
const { data, isLoading, error } = useFetch<User[]>('/api/users');

if (isLoading) return <Spinner />;
if (error) return <Error />;
return <UserList users={data} />;
```

### Modal Toggle

```tsx
const [isOpen, toggle, open, close] = useToggle();

<button onClick={open}>Open</button>
<Modal isOpen={isOpen} onClose={close} />
```

### Persistent Theme

```tsx
const [theme, setTheme] = useLocalStorage('theme', 'light');

<button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle Theme</button>;
```

### Paginated Table

```tsx
const pagination = usePagination({
  totalItems: employees.length,
  itemsPerPage: 25
});

const currentEmployees = pagination.getCurrentPageItems(employees);

<EmployeeTable data={currentEmployees} />
<Pagination {...pagination} />
```

### Counter with Bounds

```tsx
const { count, increment, decrement } = useCounter(1, {
  min: 1,
  max: 99
});

<button onClick={decrement}>-</button>
<span>{count}</span>
<button onClick={increment}>+</button>
```

---

## 🎯 When to Use Which Hook

| Scenario          | Hook              | Why                     |
| ----------------- | ----------------- | ----------------------- |
| Search input      | `useDebounce`     | Reduce API calls        |
| User preferences  | `useLocalStorage` | Persist across sessions |
| Table pagination  | `usePagination`   | Built-in page logic     |
| API data fetch    | `useFetch`        | Handles loading/error   |
| Modal visibility  | `useToggle`       | Clean boolean state     |
| Quantity selector | `useCounter`      | Min/max bounds          |
| Todo list         | `useArray`        | Array helpers           |
| Tag selection     | `useSet`          | Unique items only       |

---

## 💡 Tips & Best Practices

### TypeScript Generics

```tsx
// ✅ Good - Type-safe
const [user, setUser] = useLocalStorage<User>('user', null);

// ❌ Bad - No type safety
const [user, setUser] = useLocalStorage('user', null);
```

### Debounce Delay Guidelines

- **Instant feedback:** 0-100ms (autocomplete)
- **Search:** 200-300ms
- **Auto-save:** 500-1000ms
- **Expensive ops:** 1000+ ms

### Pagination Best Practices

```tsx
// ✅ Good - Responsive page size
const [pageSize] = useLocalStorage('page-size', 25);
usePagination({ totalItems, itemsPerPage: pageSize });

// ✅ Good - Reset on filter change
useEffect(() => {
  pagination.goToPage(1);
}, [filters]);
```

### Async Error Handling

```tsx
// ✅ Good - Handle errors
const { data, error } = useFetch('/api/data');
if (error) {
  logApiError(error, '/api/data');
  return <ErrorFallback error={error} />;
}

// ❌ Bad - Ignore errors
const { data } = useFetch('/api/data');
// No error handling
```

---

## 🔗 Related Files

- **Implementation:** `lib/hooks/`
- **Tests:** `__tests__/hooks.test.tsx`
- **Documentation:** `PHASE_2_CUSTOM_HOOKS_COMPLETE.md`

---

_Last Updated: November 5, 2025_
