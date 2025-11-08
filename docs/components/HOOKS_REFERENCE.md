# Custom Hooks Reference

Reference guide for all custom React hooks in HR Command Center.

**Last Updated:** November 6, 2025
**Location:** `webapp/lib/hooks/`

---

## Available Hooks

### useLocalStorage
Persist state to localStorage with automatic JSON serialization.

**Signature:**
```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void]
```

**Returns:** `[value, setValue, removeValue]`

**Example:**
```typescript
const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

// Update
setTheme('dark');

// Remove
removeTheme();
```

**Variants:**
- `useSessionStorage` - Session-only storage
- `useLocalStorageWithExpiry` - Auto-expiring storage

---

### usePagination
Complete pagination logic with navigation and item slicing.

**Signature:**
```typescript
function usePagination(options: PaginationOptions): PaginationResult
```

**Example:**
```typescript
const {
  currentPage,
  totalPages,
  pageNumbers,
  getCurrentPageItems,
  nextPage,
  previousPage,
  goToPage
} = usePagination({
  totalItems: employees.length,
  itemsPerPage: 25
});

const currentEmployees = getCurrentPageItems(employees);
```

**Features:**
- Page navigation (next, previous, first, last, goTo)
- Dynamic page size
- Ellipsis in page numbers
- Helper to get current page items

---

### useToggle
Boolean state management with toggle function.

**Signature:**
```typescript
function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void]
```

**Returns:** `[value, toggle, setTrue, setFalse]`

**Example:**
```typescript
const [isOpen, toggle, open, close] = useToggle(false);

<Dialog open={isOpen} onOpenChange={toggle}>
  <DialogTrigger onClick={open}>Open</DialogTrigger>
  <DialogClose onClick={close}>Close</DialogClose>
</Dialog>
```

---

## Hook Patterns

### State Persistence
```typescript
// Persist user preferences
const [preferences, setPreferences] = useLocalStorage('user-prefs', {
  notifications: true,
  theme: 'dark'
});
```

### List Pagination
```typescript
const pagination = usePagination({
  totalItems: data.length,
  itemsPerPage: 20,
  siblingCount: 2
});

const visibleItems = pagination.getCurrentPageItems(data);
```

### Modal State
```typescript
const [isOpen, toggle, open, close] = useToggle();

// In component
<button onClick={open}>Open Dialog</button>
<Dialog open={isOpen} onClose={close}>...</Dialog>
```

---

## Best Practices

1. **SSR Safety:** All hooks handle server-side rendering
2. **TypeScript:** Use generic types for type safety
3. **Cleanup:** Hooks handle cleanup automatically
4. **Performance:** Memoized with useCallback/useMemo

---

For complete examples and advanced usage, see source files in `webapp/lib/hooks/`.
