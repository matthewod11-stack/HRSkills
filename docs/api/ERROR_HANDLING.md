# Error Handling Guide

Comprehensive guide to error handling in HR Command Center API.

**Last Updated:** November 6, 2025

---

## Table of Contents

- [Error Response Format](#error-response-format)
- [HTTP Status Codes](#http-status-codes)
- [Common Errors](#common-errors)
- [Error Handling Best Practices](#error-handling-best-practices)
- [Retry Strategies](#retry-strategies)
- [Client-Side Error Handling](#client-side-error-handling)

---

## Error Response Format

All API errors follow a consistent format:

### Standard Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "field": "employee_id",
    "issue": "Field is required"
  },
  "timestamp": "2025-11-06T20:30:00.000Z",
  "requestId": "req_12345"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error` | string | Human-readable error message |
| `details` | object | Optional detailed error information |
| `timestamp` | string | ISO 8601 timestamp |
| `requestId` | string | Unique request identifier for debugging |

---

## HTTP Status Codes

### 2xx Success

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |

### 4xx Client Errors

| Code | Name | When It Occurs | Solution |
|------|------|---------------|----------|
| 400 | Bad Request | Invalid request body or parameters | Check request format and required fields |
| 401 | Unauthorized | Missing or invalid authentication token | Login to get valid token |
| 403 | Forbidden | Insufficient permissions | User role doesn't have required permissions |
| 404 | Not Found | Resource doesn't exist | Verify resource ID is correct |
| 409 | Conflict | Resource already exists (duplicate) | Use different identifier or update existing |
| 422 | Unprocessable Entity | Validation failed | Fix validation errors in request |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry with exponential backoff |

### 5xx Server Errors

| Code | Name | When It Occurs | Solution |
|------|------|---------------|----------|
| 500 | Internal Server Error | Unexpected server error | Retry request, contact support if persists |
| 502 | Bad Gateway | Upstream service unavailable | Retry after short delay |
| 503 | Service Unavailable | Server temporarily unavailable | Retry with exponential backoff |
| 504 | Gateway Timeout | Request took too long | Retry or optimize request |

---

## Common Errors

### Authentication Errors

#### Missing Authorization Header

**Status:** 401 Unauthorized

```json
{
  "success": false,
  "error": "Missing authorization header",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Request doesn't include Authorization header

**Solution:**
```typescript
// ❌ Wrong
fetch('/api/employees');

// ✅ Correct
fetch('/api/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

#### Invalid or Expired Token

**Status:** 401 Unauthorized

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Causes:**
- Token has expired (> 8 hours old)
- Token is malformed
- Token was signed with different secret

**Solution:** Login again to get new token

```typescript
async function refreshToken() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { token } = await response.json();
  return token;
}
```

---

### Permission Errors

#### Insufficient Permissions

**Status:** 403 Forbidden

```json
{
  "success": false,
  "error": "Insufficient permissions to read employees",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** User role doesn't have required permission

**Solution:** Check user's role and required permissions

```typescript
// Example: employee role trying to access employees data
// employee role only has chat:read, chat:write permissions
// employees:read permission required

// Solution: Login with hr_analyst, hr_manager, hr_admin, or super_admin role
```

---

#### Role Required

**Status:** 403 Forbidden

```json
{
  "success": false,
  "error": "Admin role required to create employees",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Endpoint requires specific role (e.g., hr_admin, super_admin)

**Solution:** Use account with required role

---

### Validation Errors

#### Required Field Missing

**Status:** 400 Bad Request

```json
{
  "success": false,
  "error": "employee_id is required",
  "details": {
    "field": "employee_id",
    "issue": "missing_required_field"
  },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Solution:** Include all required fields

```typescript
// ❌ Wrong - missing employee_id
await fetch('/api/employees', {
  method: 'POST',
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john@example.com'
  })
});

// ✅ Correct - includes employee_id
await fetch('/api/employees', {
  method: 'POST',
  body: JSON.stringify({
    employee_id: 'EMP001',  // Required
    full_name: 'John Doe',
    email: 'john@example.com'
  })
});
```

---

#### Invalid Field Value

**Status:** 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid email address",
  "details": {
    "field": "email",
    "value": "invalid-email",
    "issue": "invalid_format"
  },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Solution:** Provide valid field value

```typescript
// ❌ Wrong
{ email: 'not-an-email' }

// ✅ Correct
{ email: 'john.doe@example.com' }
```

---

### Resource Errors

#### Not Found

**Status:** 404 Not Found

```json
{
  "success": false,
  "error": "Employee not found",
  "details": {
    "employee_id": "EMP999"
  },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Resource with given ID doesn't exist

**Solution:** Verify ID is correct

---

#### Already Exists

**Status:** 400 Bad Request or 409 Conflict

```json
{
  "success": false,
  "error": "Employee with this ID already exists",
  "details": {
    "employee_id": "EMP001"
  },
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Trying to create resource with duplicate unique identifier

**Solutions:**
1. Use different ID
2. Update existing resource instead (PATCH)
3. Delete existing resource first (if permitted)

---

### Rate Limiting Errors

#### Rate Limit Exceeded

**Status:** 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45,
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Exceeded rate limit for endpoint

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699564800
Retry-After: 45
```

**Solution:** Implement retry with backoff

```typescript
async function fetchWithRetry(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    console.log(`Rate limited. Retrying after ${retryAfter}s`);

    await new Promise(resolve =>
      setTimeout(resolve, parseInt(retryAfter) * 1000)
    );

    return fetchWithRetry(url, options); // Retry
  }

  return response;
}
```

---

### Server Errors

#### Internal Server Error

**Status:** 500 Internal Server Error

```json
{
  "success": false,
  "error": "An unexpected error occurred",
  "requestId": "req_12345",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Cause:** Unexpected server-side error

**Solutions:**
1. Retry request (may be transient)
2. Check request is valid
3. Contact support with `requestId` if persists

---

## Error Handling Best Practices

### 1. Always Check Success Field

```typescript
const response = await fetch('/api/employees');
const data = await response.json();

if (!data.success) {
  // Handle error
  console.error('Error:', data.error);
  throw new Error(data.error);
}

// Process successful response
const employees = data.employees;
```

---

### 2. Handle Specific Status Codes

```typescript
async function fetchEmployees() {
  const response = await fetch('/api/employees', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login
        window.location.href = '/login';
        break;

      case 403:
        // Forbidden - show permission error
        alert('You don\'t have permission to view employees');
        break;

      case 404:
        // Not found
        alert('Employees not found');
        break;

      case 429:
        // Rate limit - retry after delay
        const retryAfter = response.headers.get('Retry-After') || 60;
        setTimeout(() => fetchEmployees(), retryAfter * 1000);
        break;

      case 500:
        // Server error - show generic error
        alert('Server error. Please try again later.');
        break;

      default:
        alert(`Error: ${error.error}`);
    }

    throw new Error(error.error);
  }

  return response.json();
}
```

---

### 3. Display User-Friendly Messages

```typescript
function getErrorMessage(error: any): string {
  // Map technical errors to user-friendly messages
  const errorMessages: Record<string, string> = {
    'Missing authorization header': 'Please log in to continue',
    'Invalid or expired token': 'Your session has expired. Please log in again.',
    'Insufficient permissions': 'You don\'t have permission to perform this action',
    'Rate limit exceeded': 'Too many requests. Please wait a moment and try again.',
    'Employee not found': 'Employee not found. Please check the ID and try again.'
  };

  return errorMessages[error.error] || 'An error occurred. Please try again.';
}

// Usage
try {
  await createEmployee(data);
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message); // Show to user
  console.error('Technical error:', error); // Log for debugging
}
```

---

### 4. Log Errors for Debugging

```typescript
function logError(error: any, context: any) {
  console.error('API Error:', {
    message: error.error,
    status: error.status,
    details: error.details,
    requestId: error.requestId,
    timestamp: error.timestamp,
    context
  });

  // Send to error tracking service (e.g., Sentry)
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { api: true },
      extra: { context }
    });
  }
}
```

---

### 5. Provide Recovery Options

```typescript
function ErrorFallback({ error, resetError }: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{getErrorMessage(error)}</p>

      <button onClick={resetError}>
        Try Again
      </button>

      <button onClick={() => window.location.href = '/login'}>
        Login Again
      </button>

      <details>
        <summary>Technical Details</summary>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </details>
    </div>
  );
}
```

---

## Retry Strategies

### Exponential Backoff

```typescript
async function fetchWithExponentialBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw await response.json();
      }

      // Retry on server errors (5xx) or rate limit (429)
      if (!response.ok) {
        if (attempt === maxRetries - 1) {
          throw await response.json();
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

---

### Retry with Jitter

```typescript
async function fetchWithJitter(
  url: string,
  options: RequestInit,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && attempt < maxRetries - 1) {
        // Base delay with jitter to prevent thundering herd
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

---

## Client-Side Error Handling

### React Error Boundary

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('API Error caught by boundary:', error, errorInfo);
    logError(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div>
          <h2>Error</h2>
          <p>{getErrorMessage(this.state.error)}</p>
          <button onClick={this.resetError}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ApiErrorBoundary>
  <EmployeeList />
</ApiErrorBoundary>
```

---

### Custom Fetch Hook with Error Handling

```typescript
import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string, options?: RequestInit): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithExponentialBackoff(url, options);

      if (!response.success) {
        throw new Error(response.error);
      }

      setData(response.data || response);
    } catch (err) {
      setError(err as Error);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Usage
function EmployeeList() {
  const { data, loading, error, refetch } = useFetch<Employee[]>('/api/employees');

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div>
        <p>Error: {getErrorMessage(error)}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <ul>
      {data?.map(emp => <li key={emp.employee_id}>{emp.full_name}</li>)}
    </ul>
  );
}
```

---

## Error Codes Reference

### Authentication Errors (AUTH_XXX)

| Code | Error | Description |
|------|-------|-------------|
| AUTH_001 | Missing authorization header | No Authorization header in request |
| AUTH_002 | Invalid token format | Token doesn't match JWT format |
| AUTH_003 | Token expired | Token exp < current time |
| AUTH_004 | Invalid signature | Token signature verification failed |

### Permission Errors (PERM_XXX)

| Code | Error | Description |
|------|-------|-------------|
| PERM_001 | Insufficient permissions | User lacks required permission |
| PERM_002 | Role required | Endpoint requires specific role |

### Validation Errors (VAL_XXX)

| Code | Error | Description |
|------|-------|-------------|
| VAL_001 | Required field missing | Required field not provided |
| VAL_002 | Invalid field value | Field value doesn't match expected format |
| VAL_003 | Field too long | Field exceeds maximum length |
| VAL_004 | Field too short | Field below minimum length |

### Resource Errors (RES_XXX)

| Code | Error | Description |
|------|-------|-------------|
| RES_001 | Resource not found | Requested resource doesn't exist |
| RES_002 | Resource already exists | Duplicate unique identifier |
| RES_003 | Resource conflict | Resource state conflict |

---

## Testing Error Scenarios

### Test Authentication Errors

```bash
# Test without token
curl http://localhost:3000/api/employees
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:3000/api/employees
# Expected: 401 Unauthorized
```

### Test Permission Errors

```bash
# Get employee role token (minimal permissions)
TOKEN=$(curl -s http://localhost:3000/api/auth/demo-token?role=employee | jq -r '.token')

# Try to access employees (requires employees:read)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/employees
# Expected: 403 Forbidden
```

### Test Validation Errors

```bash
# Test missing required field
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe"}'
# Expected: 400 Bad Request - employee_id required
```

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - All API endpoints
- [Authentication Guide](./AUTHENTICATION.md) - Authentication and RBAC
- [Contributing Guidelines](../../CONTRIBUTING.md) - Development guidelines
- [Documentation Index](../README.md) - All documentation

---

**Questions or issues?** Open an issue or consult the documentation.
