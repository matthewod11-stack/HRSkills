# UI Components Reference

Reference for shadcn/ui components used in HR Command Center.

**Last Updated:** November 6, 2025
**Location:** `webapp/components/ui/`

---

## Overview

HR Command Center uses **shadcn/ui** - a collection of re-usable components built with Radix UI and Tailwind CSS.

**Key Benefits:**
- ✅ Accessible (WCAG 2.1 AA compliant)
- ✅ Customizable (copy into your codebase)
- ✅ Unstyled foundation (style with Tailwind)
- ✅ TypeScript support

---

## Available Components (40+)

### Form Components
- **Button** - Clickable button with variants
- **Input** - Text input field
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection
- **Checkbox** - Boolean checkbox
- **Radio Group** - Radio button group
- **Switch** - Toggle switch
- **Slider** - Range slider
- **Label** - Form field label

### Layout Components
- **Card** - Container with header/footer
- **Separator** - Horizontal/vertical divider
- **Tabs** - Tabbed interface
- **Accordion** - Collapsible sections
- **Collapsible** - Expandable content
- **Scroll Area** - Scrollable container
- **Aspect Ratio** - Maintain aspect ratio

### Overlay Components
- **Dialog** - Modal dialog
- **Alert Dialog** - Confirmation dialog
- **Popover** - Floating content
- **Tooltip** - Hover tooltip
- **Hover Card** - Hover popup
- **Context Menu** - Right-click menu
- **Dropdown Menu** - Dropdown menu
- **Sheet** - Slide-in panel
- **Drawer** (vaul) - Bottom drawer

### Feedback Components
- **Alert** - Alert message
- **Toast** (sonner) - Toast notification
- **Badge** - Status badge
- **Progress** - Progress bar
- **Skeleton** - Loading placeholder

### Navigation Components
- **Navigation Menu** - Site navigation
- **Menubar** - Application menu
- **Command** (cmdk) - Command palette
- **Breadcrumb** - Breadcrumb navigation

### Data Display
- **Table** - Data table
- **Avatar** - User avatar
- **Calendar** (react-day-picker) - Date picker
- **Chart** (recharts) - Charts and graphs

### Custom Error Boundaries
- **ErrorFallbacks** - Error UI components
- **RootErrorBoundary** - App-level error boundary

### Custom Skeletons
- **ChartSkeleton** - Loading state for charts
- **ChatMessageSkeleton** - Loading state for chat
- **DialogSkeleton** - Loading state for dialogs
- **MetricCardSkeleton** - Loading state for metrics
- **TableSkeleton** - Loading state for tables

---

## Usage Examples

### Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Link</Button>
```

### Dialog
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

### Form with Validation
```tsx
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MyForm() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...register('email')} />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## Theming

Components use CSS variables defined in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  /* ... */
}
```

### Dark Mode
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  /* ... */
}
```

---

## Accessibility

All UI components include:
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ Color contrast compliance

---

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Component Patterns](./COMPONENT_PATTERNS.md)
