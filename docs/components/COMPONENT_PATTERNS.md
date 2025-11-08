# Component Patterns & Best Practices

Best practices and patterns for building components in HR Command Center.

**Last Updated:** November 6, 2025

---

## Component Structure

### File Organization
```typescript
// components/custom/MyComponent.tsx
'use client' // If using client-side features

import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// 1. TypeScript interface
interface MyComponentProps {
  title: string;
  onAction: () => void;
  className?: string;
}

// 2. Component with memo
export const MyComponent = memo(function MyComponent({
  title,
  onAction,
  className
}: MyComponentProps) {
  // 3. Hooks
  const memoizedValue = useMemo(() => expensiveCalc(), [deps]);
  const handleClick = useCallback(() => onAction(), [onAction]);

  // 4. JSX
  return (
    <div className={className}>
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
});
```

---

## Performance Patterns

### 1. Memoization
```tsx
// Memo entire component
export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  return <div>...</div>;
});

// Memo specific values
const processedData = useMemo(
  () => heavyCalculation(data),
  [data]
);

// Memo callbacks
const handleSubmit = useCallback(
  () => submitForm(formData),
  [formData]
);
```

### 2. Code Splitting
```tsx
// Dynamic import for heavy components
const HeavyChart = dynamic(
  () => import('@/components/custom/HeavyChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);
```

### 3. Virtualization
```tsx
// Use @tanstack/react-virtual for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index}>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Error Boundaries
```tsx
import { ErrorBoundary } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

### Try-Catch in Async Operations
```tsx
const handleSubmit = async () => {
  try {
    setLoading(true);
    await api.submit(data);
    toast.success('Success!');
  } catch (error) {
    console.error('Submit error:', error);
    toast.error(error.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

---

## Accessibility Patterns

### Semantic HTML
```tsx
// ✅ Good
<button onClick={handleClick}>Click me</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
<div>Navigation</div>
<div>Main content</div>
```

### ARIA Attributes
```tsx
<button
  aria-label="Close dialog"
  aria-pressed={isActive}
  aria-expanded={isExpanded}
  aria-controls="dialog-content"
>
  Close
</button>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  id="dialog-content"
>
  <h2 id="dialog-title">Dialog Title</h2>
</div>
```

### Keyboard Navigation
```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleAction();
      break;
    case 'Escape':
      handleClose();
      break;
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleAction}
>
  Interactive Element
</div>
```

---

## State Management

### Local State (useState)
```tsx
// Simple component-local state
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);
```

### Global State (Zustand)
```tsx
// stores/employee-store.ts
import { create } from 'zustand';

export const useEmployeeStore = create((set) => ({
  employees: [],
  fetchEmployees: async () => {
    const data = await api.getEmployees();
    set({ employees: data });
  }
}));

// In component
const { employees, fetchEmployees } = useEmployeeStore();
```

### Form State (react-hook-form)
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

---

## Animation Patterns

### Framer Motion
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>

// Slide in
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// List animations
<AnimatePresence>
  {items.map((item) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Testing Patterns

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Accessibility Tests
```tsx
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Styling Patterns

### Tailwind CSS
```tsx
// Utility classes
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">
  Content
</div>

// Conditional classes
<div className={`
  base-class
  ${isActive ? 'bg-primary' : 'bg-secondary'}
  ${isLarge ? 'text-lg' : 'text-sm'}
`}>
  Content
</div>

// Using clsx/cn helper
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
  Content
</div>
```

---

## Best Practices Checklist

### Component Checklist
- [ ] TypeScript interface for props
- [ ] Proper prop validation
- [ ] Error boundary wrapping (if needed)
- [ ] Loading states
- [ ] Empty states
- [ ] Accessibility attributes
- [ ] Keyboard navigation
- [ ] Mobile responsive
- [ ] Performance optimized (memo/useMemo)
- [ ] Tests written

### Code Quality
- [ ] No console.log in production
- [ ] Proper error handling
- [ ] Clean imports (no unused)
- [ ] Consistent formatting
- [ ] Meaningful variable names
- [ ] Comments for complex logic
- [ ] No any types

---

## Resources

- [Component Library](./COMPONENT_LIBRARY.md)
- [Hooks Reference](./HOOKS_REFERENCE.md)
- [UI Components](./UI_COMPONENTS.md)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
