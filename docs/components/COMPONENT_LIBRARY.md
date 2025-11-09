# Component Library

Complete reference for HR Command Center custom React components.

**Last Updated:** November 6, 2025

---

## Table of Contents

- [Overview](#overview)
- [Dashboard & Metrics](#dashboard--metrics)
- [Chat & AI](#chat--ai)
- [Data Management](#data-management)
- [Employee Management](#employee-management)
- [UI Enhancements](#ui-enhancements)
- [Usage Patterns](#usage-patterns)

---

## Overview

HR Command Center includes **17 custom React components** built with:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React.memo** for performance optimization
- **shadcn/ui** as the base UI library

### Component Location
```
webapp/components/custom/
├── AIMetricsDashboard.tsx
├── ChatInterface.tsx
├── CommandPalette.tsx
├── DataSourceManager.tsx
├── EmployeeTableEditor.tsx
├── FileUpload.tsx
├── FloatingOrbs.tsx
├── MappingPreviewModal.tsx
├── MetricCard.tsx
├── MetricDetailsDialog.tsx
├── MonitoringProvider.tsx
├── NotificationsPanel.tsx
├── QuickActionCard.tsx
├── SmartFileUpload.tsx
├── SmartPrefetch.tsx
└── UpcomingEvents.tsx
```

---

## Dashboard & Metrics

### MetricCard

Displays a single metric with animated progress circle and hover effects.

**Props:**
```typescript
interface MetricCardProps {
  title: string;              // Metric name
  value: string | number;     // Current value
  change: string;             // Change indicator (e.g., "+12%")
  isPositive: boolean;        // Whether change is positive
  icon: LucideIcon;           // Icon component
  progress: number;           // Progress percentage (0-100)
  delay?: number;             // Animation delay (ms)
  onClick?: () => void;       // Click handler
}
```

**Example:**
```tsx
import { MetricCard } from '@/components/custom/MetricCard';
import { Users } from 'lucide-react';

<MetricCard
  title="Total Employees"
  value={150}
  change="+8.2%"
  isPositive={true}
  icon={Users}
  progress={75}
  onClick={() => showDetails('employees')}
/>
```

**Features:**
- ✅ Animated SVG progress circle
- ✅ Hover effects with Framer Motion
- ✅ Memoized for performance
- ✅ Click to show details

---

### AIMetricsDashboard

Real-time AI cost tracking and optimization metrics dashboard.

**Props:**
```typescript
interface AIMetricsDashboardProps {
  className?: string;
}
```

**Example:**
```tsx
import { AIMetricsDashboard } from '@/components/custom/AIMetricsDashboard';

<AIMetricsDashboard />
```

**Features:**
- ✅ Real-time cost tracking
- ✅ Token usage analytics
- ✅ Cache hit rate metrics
- ✅ Cost optimization recommendations
- ✅ Automatic data refresh

**Data Displayed:**
- Total AI costs
- Token usage (input/output/cached)
- Cost per query
- Cache savings
- Top skills by cost

---

### MetricDetailsDialog

Modal dialog showing detailed metric breakdown with drill-down capability.

**Props:**
```typescript
interface MetricDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    title: string;
    value: string | number;
    breakdown: Record<string, number>;
    trend: Array<{ date: string; value: number }>;
  };
}
```

**Example:**
```tsx
import { MetricDetailsDialog } from '@/components/custom/MetricDetailsDialog';

<MetricDetailsDialog
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  metric={{
    title: "Attrition Rate",
    value: "12.5%",
    breakdown: {
      "Engineering": 15.0,
      "Sales": 10.2,
      "Marketing": 8.5
    },
    trend: [
      { date: "2025-01", value: 11.5 },
      { date: "2025-02", value: 12.5 }
    ]
  }}
/>
```

---

## Chat & AI

### ChatInterface

Main AI chat interface with skill detection and conversation management.

**Props:**
```typescript
interface ChatInterfaceProps {
  className?: string;
}
```

**Example:**
```tsx
import { ChatInterface } from '@/components/custom/ChatInterface';

<ChatInterface />
```

**Features:**
- ✅ **Automatic skill detection** based on query keywords
- ✅ **27 specialized skills** available
- ✅ **Conversation history** with local storage
- ✅ **PII detection** and warnings
- ✅ **Message editing** and copying
- ✅ **Markdown rendering** with code syntax highlighting
- ✅ **Typing indicators** and loading states
- ✅ **Smart suggestions** for common tasks

**Skills Available:**
- HR Document Generator
- Job Description Writer
- Performance Insights Analyst
- Skills Gap Analyzer
- Onboarding Program Builder
- And 22 more...

**Usage Pattern:**
```tsx
// Component handles all chat logic internally
// Authentication required via useAuth hook
function DashboardPage() {
  return (
    <div className="container">
      <ChatInterface />
    </div>
  );
}
```

---

### CommandPalette

Keyboard-accessible command palette (Cmd+K) for quick actions.

**Props:**
```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Example:**
```tsx
import { CommandPalette } from '@/components/custom/CommandPalette';
import { useHotkeys } from 'react-hotkeys-hook';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys('mod+k', () => setIsOpen(true));

  return (
    <>
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Features:**
- ✅ Fuzzy search
- ✅ Keyboard navigation
- ✅ Recent actions
- ✅ Quick navigation to pages
- ✅ Execute common tasks

---

## Data Management

### DataSourceManager

Manage uploaded employee data sources with preview and import capabilities.

**Props:**
```typescript
interface DataSourceManagerProps {
  onDataImported?: () => void;
}
```

**Example:**
```tsx
import { DataSourceManager } from '@/components/custom/DataSourceManager';

<DataSourceManager
  onDataImported={() => {
    toast.success('Data imported successfully');
    refreshEmployees();
  }}
/>
```

**Features:**
- ✅ List all uploaded data sources
- ✅ Preview before import
- ✅ Column mapping interface
- ✅ Data validation
- ✅ Import progress tracking
- ✅ Delete data sources

---

### SmartFileUpload

Enhanced file upload component with drag-and-drop, validation, and preview.

**Props:**
```typescript
interface SmartFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;              // File types (e.g., '.csv,.xlsx')
  maxSize?: number;             // Max file size in bytes
  multiple?: boolean;           // Allow multiple files
  disabled?: boolean;
}
```

**Example:**
```tsx
import { SmartFileUpload } from '@/components/custom/SmartFileUpload';

<SmartFileUpload
  onFileSelect={(file) => {
    console.log('Selected:', file.name);
    uploadFile(file);
  }}
  accept=".csv,.xlsx"
  maxSize={10 * 1024 * 1024} // 10 MB
  disabled={isUploading}
/>
```

**Features:**
- ✅ Drag-and-drop support
- ✅ File type validation
- ✅ Size validation
- ✅ Preview selected files
- ✅ Progress indicators
- ✅ Error handling

---

### FileUpload

Basic file upload component.

**Props:**
```typescript
interface FileUploadProps {
  onUpload: (file: File) => void | Promise<void>;
  accept?: string;
  maxSize?: number;
}
```

**Example:**
```tsx
import { FileUpload } from '@/components/custom/FileUpload';

<FileUpload
  onUpload={async (file) => {
    await uploadToServer(file);
  }}
  accept=".csv"
  maxSize={5 * 1024 * 1024}
/>
```

---

### MappingPreviewModal

Preview and map CSV/Excel columns to expected employee fields.

**Props:**
```typescript
interface MappingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<Record<string, any>>;
  onConfirm: (mapping: Record<string, string>) => void;
}
```

**Example:**
```tsx
import { MappingPreviewModal } from '@/components/custom/MappingPreviewModal';

<MappingPreviewModal
  isOpen={showMapping}
  onClose={() => setShowMapping(false)}
  data={csvData}
  onConfirm={(mapping) => {
    importData(csvData, mapping);
  }}
/>
```

**Features:**
- ✅ Automatic column detection
- ✅ Manual mapping override
- ✅ Data preview
- ✅ Validation warnings

---

## Employee Management

### EmployeeTableEditor

Editable data table for managing employee records.

**Props:**
```typescript
interface EmployeeTableEditorProps {
  employees: MasterEmployeeRecord[];
  onUpdate: (updates: Partial<MasterEmployeeRecord>[]) => Promise<void>;
  onDelete?: (employeeIds: string[]) => Promise<void>;
  isLoading?: boolean;
}
```

**Example:**
```tsx
import { EmployeeTableEditor } from '@/components/custom/EmployeeTableEditor';
import { useEmployeeStore } from '@/lib/stores/employee-store';

function EmployeesPage() {
  const { employees, updateEmployees, deleteEmployees, isLoading } = useEmployeeStore();

  return (
    <EmployeeTableEditor
      employees={employees}
      onUpdate={updateEmployees}
      onDelete={deleteEmployees}
      isLoading={isLoading}
    />
  );
}
```

**Features:**
- ✅ Inline editing
- ✅ Bulk selection
- ✅ Bulk updates
- ✅ Sort by column
- ✅ Filter by status/department
- ✅ Search functionality
- ✅ Pagination (25/50/100 per page)
- ✅ Export to CSV
- ✅ Undo/redo capability

---

## UI Enhancements

### FloatingOrbs

Animated background orbs for visual enhancement.

**Props:**
```typescript
interface FloatingOrbsProps {
  count?: number;     // Number of orbs (default: 3)
  opacity?: number;   // Opacity 0-1 (default: 0.4)
}
```

**Example:**
```tsx
import { FloatingOrbs } from '@/components/custom/FloatingOrbs';

<div className="relative">
  <FloatingOrbs count={5} opacity={0.3} />
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

**Features:**
- ✅ Smooth animations
- ✅ Gradient colors
- ✅ Blur effects
- ✅ Performance optimized

---

### MonitoringProvider

Context provider for performance monitoring and error tracking.

**Props:**
```typescript
interface MonitoringProviderProps {
  children: React.ReactNode;
}
```

**Example:**
```tsx
import { MonitoringProvider } from '@/components/custom/MonitoringProvider';

function App({ children }) {
  return (
    <MonitoringProvider>
      {children}
    </MonitoringProvider>
  );
}
```

**Features:**
- ✅ Performance metrics collection
- ✅ Error boundary integration
- ✅ API call tracking
- ✅ User interaction tracking

---

### NotificationsPanel

Notification center with toast notifications and history.

**Props:**
```typescript
interface NotificationsPanelProps {
  className?: string;
}
```

**Example:**
```tsx
import { NotificationsPanel } from '@/components/custom/NotificationsPanel';

<NotificationsPanel />
```

**Features:**
- ✅ Toast notifications
- ✅ Notification history
- ✅ Mark as read
- ✅ Clear all
- ✅ Auto-dismiss

---

### QuickActionCard

Clickable card for common quick actions.

**Props:**
```typescript
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient?: string;
}
```

**Example:**
```tsx
import { QuickActionCard } from '@/components/custom/QuickActionCard';
import { FileText } from 'lucide-react';

<QuickActionCard
  title="Generate Offer Letter"
  description="Create a customized offer letter"
  icon={FileText}
  onClick={() => navigateTo('/generate/offer')}
  gradient="from-blue-500 to-cyan-500"
/>
```

---

### SmartPrefetch

Intelligent component prefetching for improved performance.

**Props:**
```typescript
interface SmartPrefetchProps {
  route: string;
  children: React.ReactNode;
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
}
```

**Example:**
```tsx
import { SmartPrefetch } from '@/components/custom/SmartPrefetch';

<SmartPrefetch
  route="/employees"
  prefetchOnHover={true}
>
  <Link href="/employees">View Employees</Link>
</SmartPrefetch>
```

---

### UpcomingEvents

Display upcoming HR events and reminders.

**Props:**
```typescript
interface UpcomingEventsProps {
  events: Array<{
    id: string;
    title: string;
    date: Date;
    type: 'anniversary' | 'birthday' | 'review' | 'other';
  }>;
}
```

**Example:**
```tsx
import { UpcomingEvents } from '@/components/custom/UpcomingEvents';

<UpcomingEvents
  events={[
    {
      id: '1',
      title: "John's 5 Year Anniversary",
      date: new Date('2025-11-15'),
      type: 'anniversary'
    },
    {
      id: '2',
      title: "Q4 Performance Reviews",
      date: new Date('2025-12-01'),
      type: 'review'
    }
  ]}
/>
```

---

## Usage Patterns

### Performance Optimization

Components are optimized with:

**1. React.memo:**
```tsx
export const MetricCard = memo(function MetricCard(props) {
  // Component only re-renders when props change
});
```

**2. useMemo for expensive calculations:**
```tsx
const { circumference, strokeDashoffset } = useMemo(() => {
  const circ = 2 * Math.PI * 36;
  const offset = circ - (progress / 100) * circ;
  return { circumference: circ, strokeDashoffset: offset };
}, [progress]);
```

**3. useCallback for stable functions:**
```tsx
const handleClick = useCallback(() => {
  onClick?.(metricId);
}, [onClick, metricId]);
```

---

### Error Handling

All components include error boundaries:

```tsx
import { ErrorBoundary } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <ChatInterface />
</ErrorBoundary>
```

---

### Accessibility

All components follow WCAG 2.1 Level AA:

- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast ratios
- ✅ Screen reader support

**Example:**
```tsx
<button
  aria-label="Send message"
  aria-pressed={isSending}
  aria-disabled={!canSend}
  disabled={!canSend}
  onClick={sendMessage}
>
  Send
</button>
```

---

### Theming

Components use CSS variables for theming:

```tsx
// Tailwind classes reference CSS variables
<div className="bg-card text-foreground border-border">
  {/* Automatically adapts to light/dark theme */}
</div>
```

**Available theme colors:**
- `--card` - Card background
- `--foreground` - Text color
- `--border` - Border color
- `--primary` - Primary accent
- `--secondary` - Secondary accent
- `--success` - Success state
- `--error` - Error state

---

## Best Practices

### 1. Import Components
```tsx
// ✅ Correct - named import
import { ChatInterface } from '@/components/custom/ChatInterface';

// ❌ Wrong - default import
import ChatInterface from '@/components/custom/ChatInterface';
```

### 2. TypeScript Props
```tsx
// ✅ Always define prop interfaces
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // ...
}
```

### 3. Error Boundaries
```tsx
// ✅ Wrap interactive components
<ErrorBoundary>
  <ChatInterface />
</ErrorBoundary>

// ✅ Provide fallback UI
<ErrorBoundary fallback={<ErrorMessage />}>
  <DataSourceManager />
</ErrorBoundary>
```

### 4. Loading States
```tsx
// ✅ Show loading UI
{isLoading ? (
  <Skeleton className="h-32" />
) : (
  <MetricCard {...props} />
)}
```

### 5. Memoization
```tsx
// ✅ Memoize expensive components
const MemoizedChart = memo(Chart);

// ✅ Use in parent
<MemoizedChart data={chartData} />
```

---

## Additional Resources

- [Hooks Reference](./HOOKS_REFERENCE.md) - Custom React hooks
- [UI Components](./UI_COMPONENTS.md) - shadcn/ui components
- [Component Patterns](./COMPONENT_PATTERNS.md) - Best practices and patterns
- [API Reference](../api/API_REFERENCE.md) - API documentation
- [Contributing Guide](../guides/CONTRIBUTING.md) - Development guidelines

---

**Questions?** Open an issue or consult the [Documentation Index](../README.md).
