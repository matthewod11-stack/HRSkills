# Authentication Guide

Complete guide to authentication and authorization in HR Command Center.

**Last Updated:** November 6, 2025

---

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [JWT Tokens](#jwt-tokens)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Using Authentication](#using-authentication)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

HR Command Center uses **JWT (JSON Web Token)** based authentication with **Role-Based Access Control (RBAC)** for authorization.

### Key Concepts

- **Authentication** - Verifying user identity (via JWT tokens)
- **Authorization** - Determining what authenticated users can do (via RBAC)
- **Permissions** - Granular access control (read, write, delete, export)
- **Roles** - Collections of permissions assigned to users

---

## Authentication Flow

### 1. User Login

```
User → POST /api/auth/login
     ← JWT Token (8-hour expiry)
```

### 2. Authenticated Requests

```
User → GET /api/employees
     → Header: Authorization: Bearer <token>
     ← Employee data
```

### 3. Token Expiration

```
User → GET /api/employees
     → Header: Authorization: Bearer <expired-token>
     ← 401 Unauthorized
```

**Solution:** Request new token via `/api/auth/login`

---

## JWT Tokens

### Token Structure

JWT tokens consist of three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.      ← Header
eyJ1c2VySWQiOiJ1c2VyXzEyMyIsImVtYWlsIjoi... ← Payload
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature
```

### Token Payload

Decoded JWT payload contains:

```json
{
  "userId": "user_123",
  "email": "admin@example.com",
  "name": "Admin User",
  "roles": [
    {
      "id": "role_hr_admin",
      "name": "hr_admin",
      "permissions": [
        {
          "resource": "employees",
          "actions": ["read", "write", "export"]
        },
        {
          "resource": "analytics",
          "actions": ["read", "export"]
        }
      ]
    }
  ],
  "sessionId": "session_456",
  "iat": 1699564800,  // Issued at (Unix timestamp)
  "exp": 1699593600   // Expiration (Unix timestamp)
}
```

### Token Expiration

- **Default expiry:** 8 hours
- **Check expiration:** Compare `exp` field with current time
- **Refresh:** Login again to get new token

---

## Role-Based Access Control (RBAC)

### Permission Model

```typescript
interface Permission {
  resource: 'employees' | 'analytics' | 'chat' | 'data_upload' | 'settings' | 'audit';
  actions: ('read' | 'write' | 'delete' | 'export')[];
}
```

### Available Roles

#### 1. Super Admin
**Full system access with all permissions**

```typescript
{
  name: 'super_admin',
  permissions: [
    { resource: 'employees', actions: ['read', 'write', 'delete', 'export'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'chat', actions: ['read', 'write'] },
    { resource: 'data_upload', actions: ['read', 'write', 'delete'] },
    { resource: 'settings', actions: ['read', 'write'] },
    { resource: 'audit', actions: ['read', 'export'] }
  ]
}
```

**Can do:**
- ✅ Everything (create, read, update, delete)
- ✅ Delete employees and data sources
- ✅ Modify system settings
- ✅ Access audit logs

---

#### 2. HR Admin
**Full HR operations access**

```typescript
{
  name: 'hr_admin',
  permissions: [
    { resource: 'employees', actions: ['read', 'write', 'export'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'chat', actions: ['read', 'write'] },
    { resource: 'data_upload', actions: ['read', 'write'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'audit', actions: ['read'] }
  ]
}
```

**Can do:**
- ✅ Create, read, update employees (not delete)
- ✅ Upload and import data
- ✅ Use AI chat features
- ✅ View analytics and export reports
- ✅ View audit logs (read-only)
- ✅ View settings (read-only)

**Cannot do:**
- ❌ Delete employees
- ❌ Modify system settings
- ❌ Delete data sources

---

#### 3. HR Manager
**Department-level HR operations**

```typescript
{
  name: 'hr_manager',
  permissions: [
    { resource: 'employees', actions: ['read', 'write', 'export'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'chat', actions: ['read', 'write'] },
    { resource: 'data_upload', actions: ['read'] }
  ]
}
```

**Can do:**
- ✅ Read and update employees
- ✅ Use AI chat features
- ✅ View analytics (read-only)
- ✅ Export employee data

**Cannot do:**
- ❌ Create new employees
- ❌ Delete employees
- ❌ Upload data
- ❌ Access audit logs or settings

---

#### 4. HR Analyst
**Analytics and reporting focus**

```typescript
{
  name: 'hr_analyst',
  permissions: [
    { resource: 'employees', actions: ['read', 'export'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'chat', actions: ['read', 'write'] }
  ]
}
```

**Can do:**
- ✅ View employees (read-only)
- ✅ View and export analytics
- ✅ Use AI chat for analysis
- ✅ Export reports

**Cannot do:**
- ❌ Create or update employees
- ❌ Upload data
- ❌ Delete anything
- ❌ Access settings or audit logs

---

#### 5. Employee
**Self-service access only**

```typescript
{
  name: 'employee',
  permissions: [
    { resource: 'chat', actions: ['read', 'write'] }
  ]
}
```

**Can do:**
- ✅ Use AI chat for personal queries
- ✅ Ask HR-related questions

**Cannot do:**
- ❌ View other employees
- ❌ Access analytics
- ❌ Upload data
- ❌ Any admin functions

---

## Using Authentication

### Step 1: Obtain JWT Token

**Development/Testing:**
```bash
# Quick demo token
curl http://localhost:3000/api/auth/demo-token?role=hr_admin
```

**Production Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password",
    "role": "hr_admin"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@example.com",
    "name": "admin",
    "role": "hr_admin"
  }
}
```

---

### Step 2: Include Token in Requests

**Header format:**
```
Authorization: Bearer <your-jwt-token>
```

**cURL example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/employees
```

**Fetch API example:**
```typescript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch('/api/employees', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Axios example:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const employees = await api.get('/employees');
```

---

### Step 3: Handle Authentication Errors

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Missing authorization header",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Solution:** Include Authorization header with valid token

**401 Invalid Token:**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Solution:** Login again to get new token

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions to read employees",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

**Solution:** User role doesn't have required permissions

---

## Permission Checking

### How Permissions Are Checked

1. **Authenticate user** - Verify JWT token
2. **Extract roles** - Get user's roles from token payload
3. **Check permissions** - Verify role has required resource + action

### Example Permission Check

```typescript
// User wants to create an employee
// Requires: employees:write permission

// Step 1: Extract user from JWT
const user = {
  roles: [
    {
      name: 'hr_admin',
      permissions: [
        { resource: 'employees', actions: ['read', 'write', 'export'] }
      ]
    }
  ]
};

// Step 2: Check if user has permission
function hasPermission(user, resource, action) {
  return user.roles.some(role =>
    role.permissions.some(
      perm => perm.resource === resource && perm.actions.includes(action)
    )
  );
}

// Step 3: Verify
hasPermission(user, 'employees', 'write'); // ✅ true
hasPermission(user, 'employees', 'delete'); // ❌ false
```

---

## Security Best Practices

### 1. Token Storage

**DO:**
- ✅ Store in memory (React state, Zustand store)
- ✅ Store in httpOnly cookies (server-set)
- ✅ Store in secure session storage (with encryption)

**DON'T:**
- ❌ Store in localStorage (vulnerable to XSS)
- ❌ Store in regular cookies (vulnerable to CSRF)
- ❌ Embed in URL parameters
- ❌ Log tokens in console or analytics

### 2. Token Transmission

**DO:**
- ✅ Always use HTTPS in production
- ✅ Include in Authorization header
- ✅ Implement token refresh before expiry

**DON'T:**
- ❌ Send over HTTP (unencrypted)
- ❌ Include in query parameters
- ❌ Share tokens between users

### 3. Token Expiration

**DO:**
- ✅ Set reasonable expiration (8 hours default)
- ✅ Implement auto-refresh mechanism
- ✅ Clear token on logout
- ✅ Revoke tokens on security events

**DON'T:**
- ❌ Use tokens without expiration
- ❌ Keep expired tokens in storage
- ❌ Ignore expiration errors

### 4. Environment Security

**DO:**
- ✅ Use strong JWT secrets (32+ characters)
- ✅ Store secrets in environment variables
- ✅ Rotate secrets periodically
- ✅ Use different secrets per environment

**DON'T:**
- ❌ Hardcode secrets in code
- ❌ Commit secrets to version control
- ❌ Use weak or default secrets
- ❌ Share secrets across environments

### 5. Rate Limiting

**DO:**
- ✅ Monitor rate limit headers
- ✅ Implement exponential backoff
- ✅ Cache responses when possible

**DON'T:**
- ❌ Ignore rate limit errors
- ❌ Retry immediately without backoff
- ❌ Make unnecessary API calls

---

## Token Refresh Pattern

### Client-Side Token Refresh

```typescript
class AuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { token } = await response.json();
    this.setToken(token);
    return token;
  }

  setToken(token: string) {
    this.token = token;
    // Decode JWT to get expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.tokenExpiry = payload.exp * 1000; // Convert to milliseconds
  }

  async getToken(): Promise<string | null> {
    // Check if token exists
    if (!this.token) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 5 * 60 * 1000) {
      // Token expired or about to expire - need to refresh
      console.warn('Token expired or about to expire');
      return null; // User must login again
    }

    return this.token;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('No valid token - please login');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

// Usage
const auth = new AuthService();
await auth.login('admin@example.com', 'password');

// Automatically handles token expiration
const response = await auth.makeAuthenticatedRequest('/api/employees');
```

---

## Troubleshooting

### "Missing authorization header"

**Problem:** Request doesn't include Authorization header

**Solution:**
```typescript
// ❌ Wrong - no Authorization header
fetch('/api/employees');

// ✅ Correct - include Authorization header
fetch('/api/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### "Invalid or expired token"

**Problem:** Token is malformed, invalid, or expired

**Solutions:**
1. Check token format (should have 3 parts separated by dots)
2. Verify token hasn't expired (check `exp` field)
3. Login again to get new token
4. Ensure JWT_SECRET matches on client and server

---

### "Insufficient permissions"

**Problem:** User role doesn't have required permissions

**Solutions:**
1. Check user's role and permissions
2. Request admin to upgrade user role
3. Use different endpoint that matches user permissions

```typescript
// Example: HR Analyst trying to create employee
// ❌ Will fail - hr_analyst doesn't have employees:write
await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ ... })
});
// Error: "Insufficient permissions to create employees"

// ✅ Will succeed - hr_analyst has employees:read
await fetch('/api/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### "Rate limit exceeded"

**Problem:** Too many requests in short time

**Solutions:**
1. Implement exponential backoff
2. Cache responses
3. Reduce request frequency

```typescript
// Retry with exponential backoff
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
      console.log(`Rate limited, retrying in ${retryAfter}s`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

---

## Testing Authentication

### Get Demo Token
```bash
curl http://localhost:3000/api/auth/demo-token?role=hr_admin
```

### Test Authenticated Endpoint
```bash
# Save token to variable
TOKEN=$(curl -s http://localhost:3000/api/auth/demo-token?role=hr_admin | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/employees
```

### Test Permission Levels

```bash
# 1. Employee role (minimal permissions)
TOKEN_EMP=$(curl -s http://localhost:3000/api/auth/demo-token?role=employee | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN_EMP" \
  http://localhost:3000/api/employees
# Should get 403 Forbidden

# 2. HR Analyst (read-only)
TOKEN_ANALYST=$(curl -s http://localhost:3000/api/auth/demo-token?role=hr_analyst | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN_ANALYST" \
  http://localhost:3000/api/employees
# Should succeed (read permission)

# 3. HR Admin (read + write)
TOKEN_ADMIN=$(curl -s http://localhost:3000/api/auth/demo-token?role=hr_admin | jq -r '.token')
curl -X POST -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"TEST001","full_name":"Test User"}' \
  http://localhost:3000/api/employees
# Should succeed (write permission)
```

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - All API endpoints
- [Error Handling](./ERROR_HANDLING.md) - Error handling patterns
- [Security Guide](../guides/SECURITY_IMPLEMENTATION_PLAN.md) - Security architecture
- [Contributing](../guides/CONTRIBUTING.md) - Development guidelines

---

**Questions?** Open an issue or consult the [Documentation Index](../README.md).
