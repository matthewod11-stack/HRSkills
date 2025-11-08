# Memoization - Quick Reference

Quick reference for React memoization patterns in the HR Command Center.

---

## 🎯 When to Use Memoization

### ✅ USE React.memo when:
- Component renders frequently with same props
- Component has expensive rendering (SVG, animations, markdown)
- Component is a list item (prevents sibling re-renders)
- Component is a frequently-used primitive (Button, Badge)
- Props are stable or change infrequently

### ❌ DON'T USE React.memo when:
- Component is very simple (< 5 lines JSX)
- Props change on every render
- Component rarely renders
- Children props change frequently
- Premature optimization (measure first!)

---

## 📚 Memoization Patterns

### Pattern 1: Simple Component
```tsx
import { memo } from 'react';

const MyComponent = memo(function MyComponent({ title, value }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{value}</p>
    </div>
  );
});

MyComponent.displayName = "MyComponent";
```

---

### Pattern 2: With useMemo
```tsx
import { memo, useMemo } from 'react';

const DataCard = memo(function DataCard({ data }: Props) {
  // Expensive calculation only runs when 'data' changes
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  return <div>{processedData.map(/* ... */)}</div>;
});
```

---

### Pattern 3: With useCallback (Parent Component)
```tsx
import { useCallback } from 'react';

function ParentComponent() {
  const [items, setItems] = useState([]);

  // Stable callback reference prevents child re-renders
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div>
      {items.map(item => (
        <MemoizedItem
          key={item.id}
          item={item}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

const MemoizedItem = memo(function Item({ item, onDelete }: Props) {
  return (
    <div>
      {item.name}
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
});
```

---

### Pattern 4: With forwardRef
```tsx
import { memo, forwardRef } from 'react';

const Input = memo(forwardRef<HTMLInputElement, Props>(
  function Input({ value, onChange, ...props }, ref) {
    return (
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        {...props}
      />
    );
  }
));

Input.displayName = "Input";

// Usage
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input ref={inputRef} value="" onChange={() => {}} />;
}
```

---

### Pattern 5: List Item Extraction
```tsx
import { memo, useCallback } from 'react';

// Extract list items into memoized component
const ListItem = memo(function ListItem({
  item,
  onEdit,
  onDelete
}: ItemProps) {
  return (
    <div>
      <span>{item.name}</span>
      <button onClick={() => onEdit(item.id)}>Edit</button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
});

function List({ items }: Props) {
  // Memoize callbacks
  const handleEdit = useCallback((id: string) => {
    // Edit logic
  }, []);

  const handleDelete = useCallback((id: string) => {
    // Delete logic
  }, []);

  return (
    <div>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

---

## 🎣 useCallback Quick Reference

### Basic Usage
```tsx
const handleClick = useCallback(() => {
  doSomething();
}, []); // Empty deps = never recreated

const handleChange = useCallback((value: string) => {
  doSomething(value, id);
}, [id]); // Only recreate when 'id' changes
```

### Common Patterns
```tsx
// ✅ Good - Functional setState update
const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []); // No dependencies needed

// ✅ Good - With dependencies
const saveItem = useCallback((itemId: string) => {
  api.save(itemId, currentData);
}, [currentData]); // Recreate when currentData changes

// ❌ Bad - Missing dependencies (ESLint warning)
const badCallback = useCallback(() => {
  doSomething(value); // 'value' should be in deps
}, []); // ESLint will warn
```

---

## 💎 useMemo Quick Reference

### Basic Usage
```tsx
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]); // Only re-sort when 'data' changes

const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### When to Use
```tsx
// ✅ Good - Expensive calculation
const enrichedData = useMemo(() => {
  return data.map(item => ({
    ...item,
    calculated: complexCalculation(item),
    formatted: formatCurrency(item.amount)
  }));
}, [data]);

// ✅ Good - Object/array creation for memoized child
const config = useMemo(() => ({
  setting1: value1,
  setting2: value2
}), [value1, value2]);

<MemoizedChild config={config} />

// ❌ Bad - Premature optimization
const sum = useMemo(() => a + b, [a, b]); // Too simple!

// ❌ Bad - Defeats the purpose
const data = useMemo(() => {
  return processData(input);
}, []); // Should include 'input' in deps
```

---

## 🔍 Debugging Memoization

### React DevTools Profiler

1. Open React DevTools
2. Click "Profiler" tab
3. Click "Record" (blue circle)
4. Interact with your app
5. Click "Stop"
6. Analyze render times

**What to look for:**
- 🟢 Green = Didn't render (memoized)
- 🟡 Yellow = Rendered (< 10ms)
- 🔴 Red = Rendered (> 10ms)

### Common Issues

**Issue: Component re-renders despite memo**
```tsx
// ❌ Cause: Inline function
<MemoChild onClick={() => {}} />

// ✅ Fix: Use useCallback
const handleClick = useCallback(() => {}, []);
<MemoChild onClick={handleClick} />
```

**Issue: Component re-renders despite stable props**
```tsx
// ❌ Cause: New object every render
<MemoChild config={{ value: 1 }} />

// ✅ Fix: Use useMemo
const config = useMemo(() => ({ value: 1 }), []);
<MemoChild config={config} />
```

---

## 📋 Memoization Checklist

When creating a memoized component:

- [ ] Wrap component with `memo()`
- [ ] Add `displayName` property
- [ ] Use `useCallback` for all callback props in parent
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useMemo` for object/array props
- [ ] Test component renders correctly
- [ ] Verify memoization works in React DevTools
- [ ] Add comments explaining why it's memoized

---

## 🎯 Real-World Examples from Codebase

### MetricCard
```tsx
const { circumference, strokeDashoffset } = useMemo(() => {
  const circ = 2 * Math.PI * 36;
  const offset = circ - (progress / 100) * circ;
  return { circumference: circ, strokeDashoffset: offset };
}, [progress]);
```
**Why:** SVG calculations are expensive, only recalculate when progress changes.

---

### ChatInterface
```tsx
const toggleEdit = useCallback((messageId: number) => {
  setMessages(prev => prev.map(msg =>
    msg.id === messageId
      ? { ...msg, isEditing: !msg.isEditing }
      : msg
  ));
}, []);

const MessageItem = memo(function MessageItem({ message, onToggleEdit }) {
  return (
    <div>
      <ReactMarkdown>{message.content}</ReactMarkdown>
      <button onClick={() => onToggleEdit(message.id)}>Edit</button>
    </div>
  );
});
```
**Why:** ReactMarkdown is expensive, existing messages shouldn't re-render when new ones arrive.

---

### Badge Primitive
```tsx
const Badge = React.memo(function Badge({ variant, className, children }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
});

Badge.displayName = "Badge";
```
**Why:** Used 100+ times in tables, prevents unnecessary re-renders during sort/filter.

---

### Button Primitive
```tsx
const Button = React.memo(React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button({ variant, size, children, ...props }, ref) {
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }))} {...props}>
      {children}
    </button>
  );
}));

Button.displayName = "Button";
```
**Why:** Most frequently used component, ref forwarding needed for forms.

---

## ⚡ Performance Tips

### Tip 1: Measure First
```bash
# Use React DevTools Profiler
# Record → Interact → Stop → Analyze
```

### Tip 2: Start with List Items
List items give the biggest performance wins:
- Chat messages
- Table rows
- Notification items
- Search results

### Tip 3: Memoize Primitives
If you have a component used 50+ times per page:
- Button
- Badge
- Input
- Card

### Tip 4: Don't Over-Optimize
```tsx
// ❌ Unnecessary
const SimpleText = memo(function SimpleText({ text }) {
  return <span>{text}</span>;
});

// ✅ Just use regular component
function SimpleText({ text }) {
  return <span>{text}</span>;
}
```

---

## 🚀 Quick Wins

### 1. Memoize frequently-rendered list items
```tsx
const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      {todo.text}
    </div>
  );
});
```

### 2. Memoize expensive rendering
```tsx
const Chart = memo(function Chart({ data }) {
  // D3.js or complex visualization
  return <svg>{/* expensive rendering */}</svg>;
});
```

### 3. Memoize form fields
```tsx
const FormField = memo(function FormField({ label, value, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} />
    </div>
  );
});
```

---

## 📊 Impact By Component Type

| Component Type | Expected Improvement | Priority |
|---------------|---------------------|----------|
| List items (50+ items) | 80-95% fewer renders | 🔴 High |
| UI primitives (Button, Badge) | 30-50% faster | 🔴 High |
| Complex cards (charts, SVG) | 40-70% fewer renders | 🟡 Medium |
| Form fields | 20-40% faster | 🟡 Medium |
| Simple text components | 0-10% faster | 🟢 Low |

---

## 🔗 Related Files

- **Memoized Components:** `components/custom/*.tsx`
- **Memoized Primitives:** `components/ui/*.tsx`
- **Tests:** `__tests__/memoization.test.tsx`
- **Full Documentation:** `PHASE_3_MEMOIZATION_COMPLETE.md`

---

*Last Updated: November 5, 2025*
