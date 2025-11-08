# Error Boundary Quick Reference Guide

Quick guide for using error boundaries in the HR Command Center application.

---

## 🚀 Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';

<ErrorBoundary
  level="section"
  onError={(error, errorInfo) => {
    logComponentError(error, errorInfo, 'YourComponent');
  }}
>
  <YourComponent />
</ErrorBoundary>
```

---

## 📊 Boundary Levels

### App Level
- **Use for:** Root layout, entire application
- **Behavior:** Full-screen error UI with home navigation
- **Visual:** Maximum prominence

```tsx
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>
```

### Page Level
- **Use for:** Individual pages, routes
- **Behavior:** Page-sized error UI, stays within layout
- **Visual:** Medium prominence

```tsx
<ErrorBoundary level="page">
  <EmployeesPage />
</ErrorBoundary>
```

### Section Level
- **Use for:** Individual components, widgets
- **Behavior:** Inline error UI, minimal disruption
- **Visual:** Low prominence

```tsx
<ErrorBoundary level="section">
  <ChatWidget />
</ErrorBoundary>
```

---

## 🎨 Specialized Fallback Components

### Data Loading Errors
```tsx
import { DataLoadingError } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary fallback={<DataLoadingError onRetry={refetch} />}>
  <DataTable />
</ErrorBoundary>
```

### Chart Rendering Errors
```tsx
import { ChartRenderError } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary fallback={<ChartRenderError onReset={resetChart} />}>
  <AnalyticsChart />
</ErrorBoundary>
```

### Form Submission Errors
```tsx
import { FormSubmissionError } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary fallback={<FormSubmissionError onRetry={resubmit} />}>
  <EmployeeForm />
</ErrorBoundary>
```

### Authentication Errors
```tsx
import { AuthenticationError } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary fallback={<AuthenticationError />}>
  <ProtectedContent />
</ErrorBoundary>
```

### Network Errors
```tsx
import { NetworkError } from '@/components/ui/ErrorFallbacks';

<ErrorBoundary fallback={<NetworkError onRetry={reconnect} />}>
  <LiveDataFeed />
</ErrorBoundary>
```

---

## 📝 Error Logging

### Component Errors (Automatic)
```tsx
// Automatically logged when boundary catches error
<ErrorBoundary
  onError={(error, errorInfo) => {
    logComponentError(error, errorInfo, 'ComponentName');
  }}
>
  <Component />
</ErrorBoundary>
```

### API Errors (Manual)
```tsx
import { logApiError } from '@/lib/errorLogging';

try {
  await fetch('/api/users');
} catch (error) {
  logApiError(error as Error, '/api/users', 'GET');
}
```

### User Action Errors (Manual)
```tsx
import { logUserActionError } from '@/lib/errorLogging';

try {
  handleButtonClick();
} catch (error) {
  logUserActionError(error as Error, 'button_click', {
    buttonId: 'submit-btn'
  });
}
```

### Custom Error Logging
```tsx
import { errorLogger, ErrorSeverity } from '@/lib/errorLogging';

errorLogger.logError(
  new Error('Custom error'),
  undefined,
  ErrorSeverity.HIGH,
  {
    component: 'CustomComponent',
    action: 'custom_action',
    userId: 'user123'
  }
);
```

---

## 🔧 Advanced Patterns

### Multiple Nested Boundaries
```tsx
<ErrorBoundary level="app">
  <App>
    <ErrorBoundary level="page">
      <Page>
        <ErrorBoundary level="section">
          <CriticalWidget />
        </ErrorBoundary>
      </Page>
    </ErrorBoundary>
  </App>
</ErrorBoundary>
```

### Manual Error Triggering
```tsx
import { useErrorHandler } from '@/components/ui/ErrorBoundary';

function Component() {
  const throwError = useErrorHandler();

  const riskyOperation = () => {
    try {
      // dangerous code
    } catch (e) {
      throwError(e as Error);
    }
  };
}
```

### Custom Fallback with Props
```tsx
const customFallback = (
  <div className="p-4 bg-red-50 rounded">
    <h3>Oops! Custom Error</h3>
    <button onClick={() => window.location.reload()}>
      Reload Page
    </button>
  </div>
);

<ErrorBoundary fallback={customFallback}>
  <Component />
</ErrorBoundary>
```

---

## 📊 Error Severity Levels

| Level | Use Case | Example |
|-------|----------|---------|
| **LOW** | User actions, recoverable errors | Form validation, button clicks |
| **MEDIUM** | API errors, network issues | Failed fetch, timeout |
| **HIGH** | Component errors, render failures | Null reference, type error |
| **CRITICAL** | App-breaking errors | Auth failure, missing dependencies |

---

## 🧪 Testing Error Boundaries

### Trigger Test Error
```tsx
function TestError() {
  throw new Error('Test error');
  return <div>Won't render</div>;
}

<ErrorBoundary>
  <TestError />
</ErrorBoundary>
```

### Test Error Recovery
```tsx
const [shouldError, setShouldError] = useState(false);

<ErrorBoundary>
  <TestComponent shouldError={shouldError} />
</ErrorBoundary>

// Trigger error
setShouldError(true);

// Click "Try Again" button
// Then set back to false
setShouldError(false);
```

---

## 📍 Where Boundaries Are Currently Used

```
✅ app/layout.tsx (app-level)
✅ app/page.tsx (section-level, ChatInterface)
✅ app/employees/page.tsx (page-level)
✅ app/analytics/page.tsx (page-level)
```

---

## ⚡ Common Patterns

### Protecting Data Fetching
```tsx
function DataComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(err => logApiError(err, '/api/data'));
  }, []);

  return <ErrorBoundary level="section">
    {data ? <DataView data={data} /> : <Loading />}
  </ErrorBoundary>;
}
```

### Protecting Forms
```tsx
<ErrorBoundary
  level="section"
  fallback={<FormSubmissionError onRetry={handleSubmit} />}
>
  <form onSubmit={handleSubmit}>
    {/* form fields */}
  </form>
</ErrorBoundary>
```

### Protecting Charts
```tsx
<ErrorBoundary
  level="section"
  fallback={<ChartRenderError />}
>
  <Chart data={chartData} />
</ErrorBoundary>
```

---

## 🚨 When NOT to Use Error Boundaries

Error boundaries **cannot** catch:
- Errors in event handlers (use try/catch)
- Errors in async code (use try/catch)
- Errors in server-side rendering
- Errors thrown in the boundary itself

**Instead, use manual error handling:**
```tsx
// ❌ Won't be caught by boundary
async function handleClick() {
  await riskyAsyncOperation();
}

// ✅ Will be properly handled
async function handleClick() {
  try {
    await riskyAsyncOperation();
  } catch (error) {
    logUserActionError(error, 'async_click');
    showErrorToast(error.message);
  }
}
```

---

## 📚 Related Files

- **ErrorBoundary:** `webapp/components/ui/ErrorBoundary.tsx`
- **Fallbacks:** `webapp/components/ui/ErrorFallbacks.tsx`
- **Logging:** `webapp/lib/errorLogging.ts`
- **Tests:** `webapp/__tests__/ErrorBoundary.test.tsx`
- **Documentation:** `webapp/PHASE_1_ERROR_BOUNDARY_COMPLETE.md`

---

## 🔗 Resources

- [React Error Boundaries Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Boundary Best Practices](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)

---

*Last Updated: November 5, 2025*
