# Code Splitting & Lazy Loading - Quick Reference

Quick reference for code splitting patterns in the HR Command Center.

---

## 🎯 When to Use Code Splitting

### ✅ USE Dynamic Imports when:
- Component is not needed for initial page render
- Component contains heavy dependencies (> 50KB)
- Component is behind user interaction (modal, dialog)
- Component is route-specific
- Component uses expensive libraries (charts, parsers)

### ❌ DON'T Use Dynamic Imports when:
- Component is above the fold (First Contentful Paint)
- Component is very small (< 10KB)
- Component is needed immediately
- Dependencies are already loaded
- Over-optimization (premature optimization)

---

## 📚 Code Splitting Patterns

### Pattern 1: Basic Dynamic Import
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Client-side only
});

export default function Page() {
  return <HeavyComponent />;
}
```

---

### Pattern 2: Named Export
```tsx
import dynamic from 'next/dynamic';

const Dialog = dynamic(
  () => import('./Dialog').then(mod => ({ default: mod.Dialog })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false
  }
);
```

---

### Pattern 3: With Suspense Boundary
```tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('./Chart'), {
  ssr: false
});

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Chart data={data} />
    </Suspense>
  );
}
```

---

### Pattern 4: Conditional Loading
```tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <Skeleton />,
  ssr: false
});

export default function Dashboard({ isAdmin }) {
  return (
    <div>
      <h1>Dashboard</h1>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

---

### Pattern 5: Library-Level Code Splitting
```tsx
// Before: Always loaded
import Papa from 'papaparse';

// After: Load on demand
const handleFileUpload = async (file) => {
  const Papa = await import('papaparse');
  Papa.default.parse(file, { /* options */ });
};
```

---

### Pattern 6: Chart Library Lazy Loading
```tsx
import dynamic from 'next/dynamic';

// Lazy load chart components with configuration
const Bar = dynamic(
  () => import('@/lib/chartjs-config')
    .then(() => import('react-chartjs-2').then(mod => mod.Bar)),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={400} />
  }
);

export default function ChartPage() {
  return <Bar data={chartData} options={chartOptions} />;
}
```

---

## 🎨 Skeleton Components

### MetricCardSkeleton
```tsx
import { MetricCardSkeleton } from '@/components/ui/skeletons';

const MetricCard = dynamic(() => import('./MetricCard'), {
  loading: () => <MetricCardSkeleton />
});
```

### DialogSkeleton
```tsx
import { DialogSkeleton } from '@/components/ui/skeletons';

const Dialog = dynamic(() => import('./Dialog'), {
  loading: () => <DialogSkeleton />,
  ssr: false
});
```

### ChartSkeleton
```tsx
import { ChartSkeleton } from '@/components/ui/skeletons';

<Suspense fallback={<ChartSkeleton height={300} title={true} />}>
  <Chart />
</Suspense>
```

### TableSkeleton
```tsx
import { TableSkeleton } from '@/components/ui/skeletons';

<Suspense fallback={<TableSkeleton rows={10} columns={5} />}>
  <DataTable />
</Suspense>
```

### ChatMessageSkeleton
```tsx
import { ChatMessageSkeleton } from '@/components/ui/skeletons';

{isLoading && <ChatMessageSkeleton isUser={false} />}
```

---

## 🔍 Bundle Analysis

### Run Bundle Analyzer
```bash
npm run build:analyze
```

This will:
1. Build the production bundle
2. Generate interactive visualizations
3. Open in browser automatically
4. Show bundle sizes for all chunks

### What to Look For:
- **Main bundle**: Should be < 500KB (gzipped)
- **Page chunks**: Should be split per route
- **Shared chunks**: Common code across pages
- **Heavy dependencies**: Identify large libraries

---

## ⚡ Performance Checklist

### Before Lazy Loading:
- [ ] Identify components > 50KB
- [ ] Check if component is above the fold
- [ ] Measure current bundle size
- [ ] Note current page load time

### During Implementation:
- [ ] Add `dynamic()` import
- [ ] Create loading skeleton
- [ ] Add Suspense boundary
- [ ] Test loading state appears
- [ ] Verify component still works

### After Lazy Loading:
- [ ] Run bundle analyzer
- [ ] Check bundle size reduction
- [ ] Measure page load improvement
- [ ] Test on slow 3G network
- [ ] Verify no layout shift (CLS)

---

## 📊 Expected Improvements

### Homepage Optimization:
| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| MetricDetailsDialog | Always loaded | Lazy loaded | ~30KB saved |
| CommandPalette | Always loaded | Lazy loaded | ~20KB saved |
| Total Bundle | ~800KB | ~400KB | 50% reduction |

### Page Load Performance:
| Metric | Before | Target | Expected |
|--------|--------|--------|----------|
| Initial Bundle | 800KB | < 500KB | ~400KB |
| TTI (Time to Interactive) | 2.5s | < 1.5s | ~1.2s |
| FCP (First Contentful Paint) | 1.5s | < 1s | ~0.8s |

---

## 🚀 Real-World Examples

### Example 1: Dialog Lazy Loading
**File:** `app/page.tsx`

```tsx
import dynamic from 'next/dynamic';
import { DialogSkeleton } from '@/components/ui/skeletons';

const MetricDetailsDialog = dynamic(
  () => import('@/components/custom/MetricDetailsDialog')
    .then(mod => ({ default: mod.MetricDetailsDialog })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false
  }
);

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setDialogOpen(true)}>
        Open Details
      </button>

      <Suspense fallback={<DialogSkeleton />}>
        <MetricDetailsDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Suspense>
    </div>
  );
}
```

**Result:** Dialog code only loads when user clicks button, saving ~30KB on initial load.

---

### Example 2: Chart Components
**File:** `app/analytics/page.tsx`

```tsx
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/skeletons';

const Bar = dynamic(
  () => import('@/lib/chartjs-config')
    .then(() => import('react-chartjs-2').then(mod => mod.Bar)),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={400} />
  }
);

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <Suspense fallback={<ChartSkeleton height={400} title={true} />}>
        <Bar data={chartData} options={chartOptions} />
      </Suspense>
    </div>
  );
}
```

**Result:** Chart.js (~100KB) only loads on analytics page, not homepage.

---

### Example 3: Conditional Admin Features
```tsx
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(
  () => import('./AdminDashboard'),
  { loading: () => <div>Loading admin panel...</div> }
);

export default function Dashboard({ user }) {
  return (
    <div>
      <h1>Dashboard</h1>
      {user.isAdmin && <AdminDashboard />}
    </div>
  );
}
```

**Result:** Admin code only downloaded for admin users.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module" Error
**Problem:** Named export not found
```tsx
// ❌ Wrong
const Dialog = dynamic(() => import('./Dialog'));
```

**Solution:** Extract named export
```tsx
// ✅ Correct
const Dialog = dynamic(
  () => import('./Dialog').then(mod => ({ default: mod.Dialog }))
);
```

---

### Issue 2: Hydration Mismatch
**Problem:** Server-rendered content doesn't match client

**Solution:** Disable SSR for client-only components
```tsx
const ClientOnly = dynamic(
  () => import('./ClientOnly'),
  { ssr: false }
);
```

---

### Issue 3: Flash of Loading State
**Problem:** Skeleton appears briefly even when cached

**Solution:** Use better loading detection
```tsx
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  // Delay showing loading state
  const timer = setTimeout(() => setIsReady(true), 100);
  return () => clearTimeout(timer);
}, []);

{!isReady && <Skeleton />}
```

---

### Issue 4: Multiple Loads of Same Component
**Problem:** Component loaded multiple times

**Solution:** Hoist dynamic import outside component
```tsx
// ❌ Wrong - creates new import on every render
function MyComponent() {
  const Heavy = dynamic(() => import('./Heavy'));
  return <Heavy />;
}

// ✅ Correct - imports once
const Heavy = dynamic(() => import('./Heavy'));

function MyComponent() {
  return <Heavy />;
}
```

---

## 📈 Monitoring Bundle Size

### Add to CI/CD Pipeline:
```bash
# .github/workflows/bundle-size.yml
- name: Analyze Bundle
  run: |
    npm run build
    npx -p nextjs-bundle-analysis report
```

### Track Over Time:
- Use Bundlephobia API
- Monitor with relative-ci
- Set budget in `next.config.js`

### Bundle Size Budget:
```js
// next.config.js
module.exports = {
  experimental: {
    bundlePagesRouterDependencies: true,
    bundleMiddleware: true
  },
  webpack: (config) => {
    config.performance = {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    };
    return config;
  }
};
```

---

## 🔗 Related Files

- **Implementation Plan:** `PHASE_4_CODE_SPLITTING_PLAN.md`
- **Complete Docs:** `PHASE_4_CODE_SPLITTING_COMPLETE.md`
- **Skeleton Components:** `components/ui/skeletons/`
- **Tests:** `__tests__/code-splitting.test.tsx`

---

*Last Updated: November 5, 2025*
