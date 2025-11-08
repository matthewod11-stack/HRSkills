# Employee Store - Usage Guide

## Overview

The Employee Store is a global state management solution built with Zustand that provides a single source of truth for all employee data in the application.

## Key Features

✅ **5-Minute Caching** - Reduces API calls by caching data for 5 minutes
✅ **localStorage Persistence** - Data persists across page refreshes
✅ **Type Safety** - Full TypeScript support with `MasterEmployeeRecord`
✅ **CRUD Operations** - Complete Create, Read, Update, Delete functionality
✅ **Powerful Selectors** - Built-in filtering and search capabilities
✅ **Optimistic Updates** - UI updates immediately, syncs with API in background

---

## Basic Usage

### 1. Fetching Employees

```tsx
'use client'

import { useEffect } from 'react';
import { useEmployeeStore } from '@/lib/stores/employee-store';

function MyComponent() {
  const employees = useEmployeeStore(state => state.employees);
  const isLoading = useEmployeeStore(state => state.isLoading);
  const fetchEmployees = useEmployeeStore(state => state.fetchEmployees);

  useEffect(() => {
    fetchEmployees(); // Will use cache if available
  }, [fetchEmployees]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {employees.map(emp => (
        <li key={emp.employee_id}>{emp.full_name}</li>
      ))}
    </ul>
  );
}
```

### 2. Using Convenience Hooks

```tsx
import { useEmployees, useEmployeeLoading, useActiveEmployees } from '@/lib/stores/employee-store';

function EmployeeList() {
  const employees = useEmployees(); // All employees
  const isLoading = useEmployeeLoading(); // Loading state
  const activeEmployees = useActiveEmployees(); // Only active employees

  // ... render logic
}
```

### 3. Getting a Single Employee

```tsx
import { useEmployee } from '@/lib/stores/employee-store';

function EmployeeProfile({ employeeId }: { employeeId: string }) {
  const employee = useEmployee(employeeId);

  if (!employee) return <div>Employee not found</div>;

  return (
    <div>
      <h2>{employee.full_name}</h2>
      <p>{employee.job_title}</p>
      <p>{employee.department}</p>
    </div>
  );
}
```

---

## Advanced Usage

### Searching Employees

```tsx
import { useEmployeeStore } from '@/lib/stores/employee-store';
import { useState } from 'react';

function EmployeeSearch() {
  const [query, setQuery] = useState('');
  const searchEmployees = useEmployeeStore(state => state.searchEmployees);

  const results = searchEmployees(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search employees..."
      />
      <ul>
        {results.map(emp => (
          <li key={emp.employee_id}>{emp.full_name} - {emp.department}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Filtering by Department

```tsx
import { useEmployeeStore } from '@/lib/stores/employee-store';

function DepartmentView({ department }: { department: string }) {
  const filterByDepartment = useEmployeeStore(state => state.filterByDepartment);
  const employees = filterByDepartment(department);

  return (
    <div>
      <h2>{department} Team ({employees.length})</h2>
      <ul>
        {employees.map(emp => (
          <li key={emp.employee_id}>{emp.full_name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Force Refresh (Bypass Cache)

```tsx
const fetchEmployees = useEmployeeStore(state => state.fetchEmployees);

// Force refresh even if cache is valid
await fetchEmployees({ force: true });
```

### Fetch with Filters

```tsx
const fetchEmployees = useEmployeeStore(state => state.fetchEmployees);

// Fetch only active employees in Engineering department
await fetchEmployees({
  status: 'active',
  department: 'Engineering',
  sortBy: 'full_name',
  sortOrder: 'asc'
});
```

---

## CRUD Operations

### Create Employee

```tsx
const addEmployee = useEmployeeStore(state => state.addEmployee);

async function handleCreateEmployee() {
  const result = await addEmployee({
    employee_id: 'EMP001',
    full_name: 'John Doe',
    email: 'john@example.com',
    job_title: 'Software Engineer',
    department: 'Engineering',
    status: 'Active'
    // ... other fields
  });

  if (result.success) {
    console.log('Employee created!');
  } else {
    console.error('Error:', result.error);
  }
}
```

### Update Employee

```tsx
const updateEmployee = useEmployeeStore(state => state.updateEmployee);

async function handleUpdateEmployee(id: string) {
  const result = await updateEmployee(id, {
    job_title: 'Senior Software Engineer',
    base_salary: 150000
  });

  if (result.success) {
    console.log('Employee updated!');
  } else {
    console.error('Error:', result.error);
  }
}
```

### Bulk Update

```tsx
const bulkUpdateEmployees = useEmployeeStore(state => state.bulkUpdateEmployees);

async function handleBulkUpdate() {
  const result = await bulkUpdateEmployees([
    { employee_id: 'EMP001', base_salary: 150000 },
    { employee_id: 'EMP002', base_salary: 160000 },
    { employee_id: 'EMP003', base_salary: 140000 }
  ]);

  console.log(`Updated ${result.updated} employees`);
}
```

### Delete Employee

```tsx
const deleteEmployee = useEmployeeStore(state => state.deleteEmployee);

async function handleDeleteEmployee(id: string) {
  const result = await deleteEmployee(id);

  if (result.success) {
    console.log('Employee deleted!');
  } else {
    console.error('Error:', result.error);
  }
}
```

### Bulk Delete

```tsx
const bulkDeleteEmployees = useEmployeeStore(state => state.bulkDeleteEmployees);

async function handleBulkDelete(ids: string[]) {
  const result = await bulkDeleteEmployees(ids);
  console.log(`Deleted ${result.deleted} employees`);
}
```

---

## Selector Functions

All selector functions are available on the store:

```tsx
const store = useEmployeeStore();

// Get employee by ID
const employee = store.getEmployeeById('EMP001');

// Search employees
const results = store.searchEmployees('john doe');

// Filter by department
const engineers = store.filterByDepartment('Engineering');

// Filter by status
const activeEmployees = store.filterByStatus('active');

// Get active employees only
const active = store.getActiveEmployees();

// Get unique departments
const departments = store.getDepartments(); // ['Engineering', 'Sales', 'Marketing']

// Get direct reports
const reports = store.getEmployeesByManager('EMP001');
```

---

## Error Handling

```tsx
import { useEmployeeStore, useEmployeeError } from '@/lib/stores/employee-store';

function MyComponent() {
  const error = useEmployeeError();
  const clearError = useEmployeeStore(state => state.clearError);

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  // ... normal rendering
}
```

---

## Cache Management

### Invalidate Cache

```tsx
const invalidateCache = useEmployeeStore(state => state.invalidateCache);

// Force next fetch to reload from API
invalidateCache();
```

### Cache Behavior

- **Automatic Caching**: Data is cached for 5 minutes after fetch
- **Smart Refresh**: Subsequent fetches within 5 minutes use cached data
- **Force Refresh**: Use `fetchEmployees({ force: true })` to bypass cache
- **Persistence**: Cache timestamp persists in localStorage

---

## Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need to prevent unnecessary re-renders:

```tsx
// ❌ Bad - re-renders on any store change
const store = useEmployeeStore();

// ✅ Good - only re-renders when employees array changes
const employees = useEmployeeStore(state => state.employees);

// ✅ Good - only re-renders when loading state changes
const isLoading = useEmployeeStore(state => state.isLoading);
```

### Derived State with useMemo

```tsx
import { useMemo } from 'react';
import { useEmployees } from '@/lib/stores/employee-store';

function EmployeeStats() {
  const employees = useEmployees();

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'Active').length,
      byDepartment: employees.reduce((acc, e) => {
        acc[e.department || 'Unknown'] = (acc[e.department || 'Unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [employees]);

  return <div>{/* render stats */}</div>;
}
```

---

## TypeScript Types

```typescript
import { MasterEmployeeRecord } from '@/lib/types/master-employee';
import { useEmployeeStore } from '@/lib/stores/employee-store';

// All functions are fully typed
const addEmployee = useEmployeeStore(state => state.addEmployee);

// TypeScript will enforce MasterEmployeeRecord structure
const newEmployee: MasterEmployeeRecord = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  // ... TypeScript will autocomplete available fields
};

await addEmployee(newEmployee);
```

---

## Testing

```typescript
// Mock the store in tests
import { useEmployeeStore } from '@/lib/stores/employee-store';

beforeEach(() => {
  useEmployeeStore.setState({
    employees: [
      { employee_id: 'EMP001', full_name: 'Test User', department: 'Engineering' }
    ],
    isLoading: false,
    error: null,
    lastFetched: Date.now()
  });
});
```

---

## Best Practices

1. **Fetch once per page** - Call `fetchEmployees()` in your top-level page component
2. **Use selectors** - Leverage built-in selectors instead of filtering manually
3. **Handle errors** - Always check for errors after mutations
4. **Invalidate cache** - Call `invalidateCache()` after uploading new employee data
5. **Selective subscriptions** - Only subscribe to the specific state you need
6. **Use convenience hooks** - Prefer `useEmployees()` over manually subscribing

---

## Migration Guide

### Before (Prop Drilling)

```tsx
// ❌ Old way
async function ParentPage() {
  const employees = await loadEmployees();
  return <ChildComponent employees={employees} />;
}

function ChildComponent({ employees }: { employees: Employee[] }) {
  return <GrandchildComponent employees={employees} />;
}

function GrandchildComponent({ employees }: { employees: Employee[] }) {
  return <div>{employees.length} employees</div>;
}
```

### After (Global Store)

```tsx
// ✅ New way
'use client'

function ParentPage() {
  const fetchEmployees = useEmployeeStore(state => state.fetchEmployees);

  useEffect(() => {
    fetchEmployees(); // Fetch once at top level
  }, [fetchEmployees]);

  return <ChildComponent />;
}

function ChildComponent() {
  return <GrandchildComponent />; // No props needed!
}

function GrandchildComponent() {
  const employees = useEmployees(); // Direct access
  return <div>{employees.length} employees</div>;
}
```

---

## Troubleshooting

### Cache not updating

```tsx
// Invalidate cache after external changes
const invalidateCache = useEmployeeStore(state => state.invalidateCache);
invalidateCache();
await fetchEmployees({ force: true });
```

### localStorage quota exceeded

The store only persists `employees` and `lastFetched`. If you have a very large employee dataset (10,000+), consider:
- Pagination
- Removing the persist middleware
- Using server-side caching instead

### Authentication errors

The store includes credentials in all requests. Ensure your API endpoints:
- Accept cookies (`credentials: 'include'`)
- Return proper auth error responses (401/403)

---

## API Endpoint Requirements

The employee store expects these endpoints:

- `GET /api/employees` - List employees (with query params)
- `POST /api/employees` - Create employee
- `PATCH /api/employees/:id` - Update single employee
- `PATCH /api/employees` - Bulk update (body: `{ updates: [...] }`)
- `DELETE /api/employees/:id` - Delete single employee
- `DELETE /api/employees` - Bulk delete (body: `{ employee_ids: [...] }`)

All endpoints should return:
```json
{
  "success": true,
  "employee": { ... },      // for POST/single PATCH
  "employees": [ ... ],     // for GET
  "updated": 5,            // for bulk PATCH
  "deleted": 3             // for bulk DELETE
}
```

---

## Next Steps

Ready to migrate your components? See the migration examples above and start with your leaf components first, then work your way up to parent components.
