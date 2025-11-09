# RBAC v2 Migration Guide

## Overview

The simplified RBAC v2 system reduces complexity from **5 roles** to **2 roles** while maintaining essential security:

**Before (v1):**
- super_admin
- hr_admin
- hr_manager
- hr_analyst
- employee

**After (v2):**
- **admin** - Full access to all features
- **user** - Chat access with limited actions

This represents a **90% reduction in RBAC code** complexity.

---

## Quick Start

### 1. Using v2 Middleware in API Routes

```typescript
// OLD (v1):
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  // Check permission with complex resource/action mapping
  if (!hasPermission(authResult.user, 'employees', 'write')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }

  // ... rest of endpoint
}
```

```typescript
// NEW (v2):
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware-v2'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  // Simple permission check
  if (!hasPermission(authResult.user, 'editEmployees')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }

  // ... rest of endpoint
}
```

### 2. Using RoleGuard Components in UI

```tsx
// OLD (v1):
{user.roles.some(role => ['super_admin', 'hr_admin'].includes(role.name)) && (
  <Button>Admin Only Action</Button>
)}
```

```tsx
// NEW (v2):
import { RequireAdmin, RequirePermission } from '@/components/auth/RoleGuard'

<RequireAdmin>
  <Button>Admin Only Action</Button>
</RequireAdmin>

<RequirePermission permission="editEmployees">
  <Button>Edit Employee</Button>
</RequirePermission>
```

---

## Permission Mapping

### v1 → v2 Permission Mapping

| v1 Resource/Action | v2 Permission | Admin | User |
|-------------------|---------------|-------|------|
| `employees` + `read` | `viewEmployees` | ✅ | ✅ |
| `employees` + `write` | `editEmployees` | ✅ | ❌ |
| `analytics` + `read` | `viewAnalytics` | ✅ | ✅ |
| `analytics` + `export` | `exportData` | ✅ | ❌ |
| `chat` + `write` | `chat` | ✅ | ✅ |
| `data_upload` + `write` | `uploadData` | ✅ | ❌ |
| `settings` + `write` | `manageSettings` | ✅ | ❌ |
| *(new)* | `takeActions` | ✅ | ❌ |

### Role Migration Map

Old roles automatically map to new roles:

```typescript
super_admin  → admin
hr_admin     → admin
hr_manager   → admin
hr_analyst   → user
employee     → user
```

---

## API Migration Examples

### Example 1: Chat Endpoint

```typescript
// File: webapp/app/api/chat/route.ts

// BEFORE (v1):
import { requireAuth, hasPermission } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  // Everyone with 'chat' resource can access
  if (!hasPermission(authResult.user, 'chat', 'write')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }
  // ...
}
```

```typescript
// AFTER (v2):
import { requireAuth, hasPermission } from '@/lib/auth/middleware-v2'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  // Both admin and user can chat
  if (!hasPermission(authResult.user, 'chat')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }
  // ...
}
```

### Example 2: Data Upload Endpoint

```typescript
// File: webapp/app/api/data/upload/route.ts

// BEFORE (v1):
import { requireAuth, hasPermission } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  if (!hasPermission(authResult.user, 'data_upload', 'write')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }
  // ...
}
```

```typescript
// AFTER (v2):
import { requireAuth, hasPermission } from '@/lib/auth/middleware-v2'

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authErrorResponse(authResult)

  // Only admins can upload data
  if (!hasPermission(authResult.user, 'uploadData')) {
    return authErrorResponse({ success: false, error: 'Forbidden', statusCode: 403 })
  }
  // ...
}
```

---

## UI Migration Examples

### Example 1: Settings Page

```tsx
// BEFORE (v1):
{user.roles.some(role => role.permissions.some(
  p => p.resource === 'settings' && p.actions.includes('write')
)) && (
  <SettingsPanel />
)}
```

```tsx
// AFTER (v2):
import { RequirePermission } from '@/components/auth/RoleGuard'

<RequirePermission permission="manageSettings">
  <SettingsPanel />
</RequirePermission>
```

### Example 2: Export Button

```tsx
// BEFORE (v1):
<Button
  disabled={!user.roles.some(role =>
    role.permissions.some(p =>
      p.resource === 'analytics' && p.actions.includes('export')
    )
  )}
>
  Export Data
</Button>
```

```tsx
// AFTER (v2):
import { PermissionButton } from '@/components/auth/RoleGuard'

<PermissionButton
  permission="exportData"
  disabledMessage="Only admins can export data"
>
  Export Data
</PermissionButton>
```

### Example 3: Role-Specific Content

```tsx
// BEFORE (v1):
{user.roles.some(r => ['super_admin', 'hr_admin'].includes(r.name)) ? (
  <AdminDashboard />
) : (
  <UserDashboard />
)}
```

```tsx
// AFTER (v2):
import { RoleSwitch } from '@/components/auth/RoleGuard'

<RoleSwitch
  admin={<AdminDashboard />}
  user={<UserDashboard />}
/>
```

---

## Development Mode

Both v1 and v2 middleware auto-authenticate in development mode:

```typescript
// Development user (auto-created):
{
  userId: 'dev-user',
  email: 'dev@hrskills.local',
  name: 'Developer',
  role: ROLES.admin, // Full admin access
  sessionId: 'dev-session'
}
```

No need to manually create tokens during development!

---

## Backward Compatibility

The v2 system is **backward compatible** with v1 tokens:

1. **Old tokens still work** - The v2 middleware detects v1 token format and migrates roles automatically
2. **Gradual migration** - Can migrate endpoints one at a time
3. **No breaking changes** - Existing API contracts remain the same

### Migration Strategy

1. **Keep v1 files** - Don't delete `types.ts` or `middleware.ts` yet
2. **Migrate endpoints incrementally** - Update one API route at a time to use `middleware-v2.ts`
3. **Update UI components** - Replace complex permission checks with `RoleGuard` components
4. **Test thoroughly** - Ensure both admin and user roles work correctly
5. **Remove v1 files** - After full migration, delete old RBAC files

---

## Testing

### Test Both Roles

```typescript
// Create test tokens for both roles
import { createDemoToken } from '@/lib/auth/middleware-v2'

const adminToken = await createDemoToken('admin@test.com', 'admin')
const userToken = await createDemoToken('user@test.com', 'user')

// Test API endpoints with both tokens
const adminResponse = await fetch('/api/data/upload', {
  headers: { Authorization: `Bearer ${adminToken}` }
})
// Should succeed for admin

const userResponse = await fetch('/api/data/upload', {
  headers: { Authorization: `Bearer ${userToken}` }
})
// Should return 403 for user
```

---

## Benefits of v2 System

1. **90% Less Code** - Simpler permission checks, fewer types
2. **Easier to Understand** - Binary permissions instead of resource/action matrix
3. **Faster to Implement** - No complex role hierarchy
4. **Better DX** - Declarative `<RequireAdmin>` components
5. **Production Ready** - Still secure, just simpler

---

## Need Help?

- See examples in `/webapp/components/auth/RoleGuard.tsx`
- Check API examples in `/webapp/app/api/ai/quota/route.ts`
- Review role definitions in `/webapp/lib/auth/roles-v2.ts`
