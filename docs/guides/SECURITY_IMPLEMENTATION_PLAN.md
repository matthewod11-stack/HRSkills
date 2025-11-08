# HR COMMAND CENTER - SECURITY IMPLEMENTATION PLAN

**Generated:** November 4, 2025
**Based on:** Security Audit Report (01-Security-Audit-Report.md)
**Status:** Ready for Implementation
**Total Estimated Time:** 8-12 weeks

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Phase 1: Critical Fixes (24-48 hours)](#phase-1-critical-fixes-24-48-hours)
3. [Phase 2: High Priority (1 week)](#phase-2-high-priority-1-week)
4. [Phase 3: Important Enhancements (2-4 weeks)](#phase-3-important-enhancements-2-4-weeks)
5. [Testing Strategy](#testing-strategy)
6. [Success Criteria](#success-criteria)
7. [Rollback Plan](#rollback-plan)

---

## OVERVIEW

### Current Security Posture
**Risk Level:** 🔴 CRITICAL (9.2/10)

### Critical Issues Count
- **8 Critical** vulnerabilities requiring immediate action
- **12 High** priority issues
- **7 Medium** priority concerns

### Implementation Approach
1. **Incremental deployment** - Fix and test each component
2. **Backward compatibility** - Maintain API contracts where possible
3. **Feature flags** - Enable progressive rollout
4. **Monitoring first** - Deploy logging before enforcement

---

## PHASE 1: CRITICAL FIXES (24-48 hours)

**Priority:** 🔴 IMMEDIATE
**Team Required:** 2 engineers (1 security-focused, 1 full-stack)
**Total Estimated Time:** 16-24 hours

### Task 1.1: Implement Authentication Middleware (6 hours)

**Priority:** CRITICAL-01
**Files to Create:** `webapp/lib/auth/middleware.ts`, `webapp/lib/auth/types.ts`
**Files to Modify:** All API routes in `webapp/app/api/*`

#### Step 1: Install Dependencies (15 minutes)
```bash
cd webapp
npm install jsonwebtoken @types/jsonwebtoken bcrypt @types/bcrypt
npm install jose # Modern JWT library for Next.js Edge runtime
```

#### Step 2: Create Authentication Types (30 minutes)

**File:** `webapp/lib/auth/types.ts`
```typescript
export interface UserRole {
  id: string;
  name: 'super_admin' | 'hr_admin' | 'hr_manager' | 'hr_analyst' | 'employee';
  permissions: Permission[];
}

export interface Permission {
  resource: 'employees' | 'analytics' | 'chat' | 'data_upload' | 'settings';
  actions: ('read' | 'write' | 'delete' | 'export')[];
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: UserRole[];
  employeeId?: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  success: true;
  user: AuthUser;
} | {
  success: false;
  error: string;
  statusCode: 401 | 403;
}
```

#### Step 3: Create Auth Middleware (2 hours)

**File:** `webapp/lib/auth/middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { AuthUser, AuthResult, Permission } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION'
);

const JWT_ALGORITHM = 'HS256';
const TOKEN_EXPIRY = '8h';

/**
 * Verify JWT token and extract user information
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    return {
      success: true,
      user: payload as AuthUser,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: Omit<AuthUser, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing authorization header',
      statusCode: 401,
    };
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Permission check middleware
 */
export function hasPermission(
  user: AuthUser,
  resource: Permission['resource'],
  action: Permission['actions'][number]
): boolean {
  return user.roles.some(role =>
    role.permissions.some(
      perm => perm.resource === resource && perm.actions.includes(action)
    )
  );
}

/**
 * Role-based access control middleware
 */
export function requireRole(user: AuthUser, ...allowedRoles: string[]): boolean {
  return user.roles.some(role => allowedRoles.includes(role.name));
}

/**
 * Create error response for auth failures
 */
export function authErrorResponse(result: AuthResult): NextResponse {
  if (result.success) {
    throw new Error('Cannot create error response for successful auth');
  }

  return NextResponse.json(
    {
      success: false,
      error: result.error,
      timestamp: new Date().toISOString(),
    },
    {
      status: result.statusCode,
      headers: {
        'WWW-Authenticate': 'Bearer realm="HR Command Center"',
      },
    }
  );
}
```

#### Step 4: Apply Authentication to All API Routes (3 hours)

**Example: Update Employees Route**

**File:** `webapp/app/api/employees/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, requireRole, authErrorResponse } from '@/lib/auth/middleware';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

// ... existing helper functions ...

/**
 * GET /api/employees - List all employees
 * Requires: Authentication + 'employees' read permission
 */
export async function GET(request: NextRequest) {
  // Step 1: Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Step 2: Check permissions
  if (!hasPermission(authResult.user, 'employees', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    let employees = await loadMasterData();

    // Apply filters...
    if (status) {
      employees = employees.filter(emp => emp.status?.toLowerCase() === status.toLowerCase());
    }

    if (department) {
      employees = employees.filter(emp => emp.department === department);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employee_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting...
    if (sortBy) {
      employees.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return NextResponse.json({
      success: true,
      employees,
      count: employees.length
    });

  } catch (error: any) {
    console.error('Get employees error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load employees'
    }, { status: 500 });
  }
}

/**
 * POST /api/employees - Create new employee
 * Requires: Authentication + hr_admin role + 'employees' write permission
 */
export async function POST(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check role
  if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Admin role required' },
      { status: 403 }
    );
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'employees', 'write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Input validation happens in Task 2.1
    const newEmployee: MasterEmployeeRecord = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!newEmployee.employee_id) {
      return NextResponse.json({
        success: false,
        error: 'employee_id is required'
      }, { status: 400 });
    }

    const employees = await loadMasterData();

    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      return NextResponse.json({
        success: false,
        error: 'Employee with this ID already exists'
      }, { status: 400 });
    }

    employees.push(newEmployee);
    await saveMasterData(employees);

    return NextResponse.json({
      success: true,
      employee: newEmployee
    });

  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create employee'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/employees - Bulk delete employees
 * Requires: Authentication + super_admin role + 'employees' delete permission
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Only super_admin can delete
  if (!requireRole(authResult.user, 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Super admin role required for deletion' },
      { status: 403 }
    );
  }

  if (!hasPermission(authResult.user, 'employees', 'delete')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const employeeIds: string[] = body.employee_ids;

    if (!Array.isArray(employeeIds)) {
      return NextResponse.json({
        success: false,
        error: 'employee_ids must be an array'
      }, { status: 400 });
    }

    const employees = await loadMasterData();
    const idsToDelete = new Set(employeeIds);
    const remaining = employees.filter(emp => !idsToDelete.has(emp.employee_id));

    await saveMasterData(remaining);

    return NextResponse.json({
      success: true,
      deleted: employees.length - remaining.length
    });

  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete employees'
    }, { status: 500 });
  }
}
```

**Estimated Time:** Apply same pattern to 18 API routes (15-20 min per route)

#### Testing Task 1.1
```bash
# Test 1: Unauthenticated request (should fail)
curl -X GET http://localhost:3000/api/employees
# Expected: 401 Unauthorized

# Test 2: Invalid token (should fail)
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test 3: Valid token (should succeed)
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${VALID_TOKEN}"
# Expected: 200 OK with employee data

# Test 4: Insufficient permissions (should fail)
curl -X DELETE http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${ANALYST_TOKEN}" \
  -d '{"employee_ids": ["EMP001"]}'
# Expected: 403 Forbidden
```

**Success Criteria:**
- ✅ All API endpoints reject unauthenticated requests
- ✅ Valid tokens are accepted and decoded correctly
- ✅ Role-based access control enforces permissions
- ✅ Error messages don't leak sensitive information

---

### Task 1.2: Configure CORS and Security Headers (2 hours)

**Priority:** CRITICAL-03
**Files to Modify:** `webapp/next.config.js`

#### Step 1: Update next.config.js (1 hour)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  generateEtags: true,
  swcMinify: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ============================================
  // SECURITY HEADERS
  // ============================================
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
          "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.anthropic.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // CORS configuration for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'https://hr.yourcompany.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },
    ];
  },

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'HR Command Center',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },

  // ============================================
  // EXPERIMENTAL FEATURES
  // ============================================
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'hr.yourcompany.com',
      ],
    },
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

module.exports = nextConfig;
```

#### Step 2: Create Environment Configuration (30 minutes)

**File:** `.env.development`
```bash
# Development Environment Configuration
NODE_ENV=development

# Authentication
JWT_SECRET=dev_secret_change_in_production_min_32_characters_required

# CORS
ALLOWED_ORIGIN=http://localhost:3000

# API Keys (server-side only)
ANTHROPIC_API_KEY=your_dev_api_key
RIPPLING_API_KEY=your_dev_rippling_key
NOTION_TOKEN=your_dev_notion_token

# Public Variables
NEXT_PUBLIC_APP_NAME=HR Command Center (Dev)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**File:** `.env.production`
```bash
# Production Environment Configuration
NODE_ENV=production

# Authentication (MUST be set via environment variables in deployment)
# JWT_SECRET=<generate-secure-secret-min-32-chars>

# CORS
ALLOWED_ORIGIN=https://hr.yourcompany.com

# API Keys (MUST be set via secure secret management)
# ANTHROPIC_API_KEY=<prod-key>
# RIPPLING_API_KEY=<prod-key>
# NOTION_TOKEN=<prod-token>

# Public Variables
NEXT_PUBLIC_APP_NAME=HR Command Center
NEXT_PUBLIC_API_URL=https://hr.yourcompany.com
```

#### Step 3: Add CORS Preflight Handler (30 minutes)

**File:** `webapp/middleware.ts` (create new file)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### Testing Task 1.2
```bash
# Test 1: Check security headers
curl -I http://localhost:3000
# Expected: All security headers present

# Test 2: CORS preflight
curl -X OPTIONS http://localhost:3000/api/employees \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: GET"
# Expected: 200 OK with CORS headers

# Test 3: Verify CSP
curl -I http://localhost:3000 | grep -i "content-security-policy"
# Expected: CSP header with correct directives

# Test 4: Test HSTS
curl -I https://localhost:3000 | grep -i "strict-transport"
# Expected: HSTS header with max-age
```

**Success Criteria:**
- ✅ All security headers present on all routes
- ✅ CORS only allows configured origins
- ✅ CSP blocks inline scripts (except Next.js required)
- ✅ HSTS enforces HTTPS
- ✅ X-Frame-Options prevents clickjacking

---

### Task 1.3: Update Vulnerable xlsx Dependency (30 minutes)

**Priority:** CRITICAL-08
**Files to Modify:** `webapp/package.json`

#### Step 1: Update Dependency
```bash
cd webapp
npm uninstall xlsx
npm install xlsx@0.20.3
npm audit fix
npm audit # Verify no critical vulnerabilities remain
```

#### Step 2: Verify Functionality
Test all file upload/download features to ensure compatibility with new version.

**Test Script:** `webapp/scripts/test-xlsx.ts`
```typescript
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';

async function testXLSX() {
  console.log('Testing xlsx library version:', XLSX.version);

  // Test 1: Read Excel file
  const testData = await readFile('./test-data/employees.xlsx');
  const workbook = XLSX.read(testData);
  console.log('✅ Read Excel file successfully');

  // Test 2: Write Excel file
  const ws = XLSX.utils.json_to_sheet([
    { name: 'John', department: 'Engineering' },
    { name: 'Jane', department: 'Sales' },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  const buffer = XLSX.write(wb, { type: 'buffer' });
  console.log('✅ Write Excel file successfully');

  console.log('All xlsx tests passed!');
}

testXLSX();
```

#### Testing Task 1.3
```bash
# Run test script
npx ts-node webapp/scripts/test-xlsx.ts

# Check for vulnerabilities
npm audit --audit-level=high

# Test upload endpoint
curl -X POST http://localhost:3000/api/data/upload \
  -F "file=@test-employees.xlsx" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Success Criteria:**
- ✅ xlsx upgraded to 0.20.3 or later
- ✅ No critical/high vulnerabilities in npm audit
- ✅ All file upload/download functionality works
- ✅ No breaking changes in application

---

### Task 1.4: Remove API Keys from Client Bundle (1 hour)

**Priority:** CRITICAL-07
**Files to Modify:** `webapp/next.config.js` (already done in Task 1.2)

#### Step 1: Verify next.config.js (15 minutes)
Ensure no backend secrets in `env` config (completed in Task 1.2).

#### Step 2: Scan for Hardcoded Secrets (30 minutes)
```bash
# Search for potential hardcoded API keys
cd webapp
grep -r "ANTHROPIC_API_KEY" app/ --include="*.tsx" --include="*.ts"
grep -r "sk-ant-" app/ --include="*.tsx" --include="*.ts"
grep -r "Bearer.*sk-" app/ --include="*.tsx" --include="*.ts"

# Search for other secrets
grep -r "password.*=.*['\"]" app/ --include="*.tsx" --include="*.ts"
grep -r "token.*=.*['\"]" app/ --include="*.tsx" --include="*.ts"
```

#### Step 3: Verify Client Bundle (15 minutes)
```bash
# Build and inspect client bundle
npm run build
grep -r "ANTHROPIC_API_KEY" .next/static/chunks/
grep -r "sk-ant-" .next/static/chunks/

# Should find NO matches
```

#### Testing Task 1.4
```bash
# Test 1: Build application
npm run build
# Expected: No errors, no warnings about exposed secrets

# Test 2: Inspect browser bundle
# Open DevTools > Sources > webpack://
# Search for "ANTHROPIC_API_KEY"
# Expected: No results

# Test 3: Check window object
# In browser console:
console.log(process.env)
# Expected: Only NEXT_PUBLIC_* variables
```

**Success Criteria:**
- ✅ No backend API keys in next.config.js env section
- ✅ No hardcoded secrets in source code
- ✅ Client bundle doesn't contain API keys
- ✅ Only NEXT_PUBLIC_* variables accessible in browser

---

### Phase 1 Summary

**Total Time:** 16-24 hours
**Tasks Completed:** 4 critical vulnerabilities fixed

**Checklist:**
- ✅ Task 1.1: Authentication middleware implemented
- ✅ Task 1.2: CORS and security headers configured
- ✅ Task 1.3: xlsx dependency updated
- ✅ Task 1.4: API keys secured

**Deployment Steps:**
1. Merge Phase 1 changes to staging branch
2. Deploy to staging environment
3. Run automated test suite
4. Manual security testing (see Testing Strategy)
5. Deploy to production with monitoring
6. Verify authentication works for all users

---

## PHASE 2: HIGH PRIORITY (1 week)

**Priority:** 🟡 URGENT
**Team Required:** 2-3 engineers
**Total Estimated Time:** 40 hours

### Task 2.1: Implement Input Validation with Zod (8 hours)

**Priority:** CRITICAL-05
**Files to Create:** `webapp/lib/validation/schemas.ts`, `webapp/lib/validation/middleware.ts`

#### Step 1: Install Zod (5 minutes)
```bash
npm install zod
```

#### Step 2: Create Validation Schemas (3 hours)

**File:** `webapp/lib/validation/schemas.ts`
```typescript
import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

const EmailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

const EmployeeIdSchema = z.string()
  .min(1, 'Employee ID required')
  .max(50, 'Employee ID too long')
  .regex(/^[A-Z0-9-]+$/, 'Employee ID must be alphanumeric with hyphens')
  .trim();

const DateSchema = z.string()
  .datetime({ message: 'Invalid ISO 8601 date format' })
  .or(z.date());

const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
  .optional();

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const EmployeeStatusSchema = z.enum([
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'pending',
]);

export const JobLevelSchema = z.enum([
  'IC1', 'IC2', 'IC3', 'IC4', 'IC5', 'IC6',
  'M1', 'M2', 'M3', 'M4', 'M5',
  'E1', 'E2', 'E3',
]);

export const CreateEmployeeSchema = z.object({
  employee_id: EmployeeIdSchema,
  first_name: z.string().min(1).max(100).trim(),
  last_name: z.string().min(1).max(100).trim(),
  email: EmailSchema,

  // Optional fields
  personal_email: EmailSchema.optional(),
  phone: PhoneSchema,
  date_of_birth: DateSchema.optional(),

  // Employment details
  hire_date: DateSchema,
  termination_date: DateSchema.optional(),
  status: EmployeeStatusSchema.default('active'),

  // Job information
  job_title: z.string().min(1).max(200).trim(),
  department: z.string().min(1).max(100).trim(),
  level: JobLevelSchema,
  manager_id: EmployeeIdSchema.optional(),
  location: z.string().min(1).max(200).trim().optional(),

  // Compensation
  salary: z.number().positive().max(10_000_000).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),

  // Demographics (optional, for EEOC compliance)
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  ethnicity: z.string().max(100).optional(),

  // Performance
  performance_rating: z.number().min(1).max(5).optional(),
  last_review_date: DateSchema.optional(),
})
.strict() // Reject unknown properties (prevent prototype pollution)
.refine(
  (data) => {
    // If terminated, must have termination date
    if (data.status === 'terminated' && !data.termination_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Termination date required for terminated employees',
    path: ['termination_date'],
  }
);

export const UpdateEmployeeSchema = CreateEmployeeSchema
  .partial() // All fields optional for updates
  .required({ employee_id: true }); // Except employee_id

export const BulkUpdateEmployeesSchema = z.object({
  updates: z.array(UpdateEmployeeSchema).min(1).max(1000),
});

export const BulkDeleteEmployeesSchema = z.object({
  employee_ids: z.array(EmployeeIdSchema).min(1).max(1000),
});

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const EmployeeQuerySchema = z.object({
  sortBy: z.enum(['first_name', 'last_name', 'email', 'hire_date', 'department', 'level']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: EmployeeStatusSchema.optional(),
  department: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});

// ============================================
// FILE UPLOAD SCHEMAS
// ============================================

export const FileUploadSchema = z.object({
  fileType: z.enum([
    'employees',
    'performance_reviews',
    'compensation',
    'demographics',
    'time_off',
  ]),
  fileName: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9-_. ]+$/, 'Invalid filename'),
  fileSize: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  mimeType: z.enum([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const AnalyticsQuerySchema = z.object({
  message: z.string()
    .min(5, 'Query too short')
    .max(2000, 'Query too long')
    .trim(),
  context: z.enum(['headcount', 'attrition', 'performance', 'compensation', 'general']).optional(),
  includeCharts: z.boolean().default(true),
});

export const SQLQuerySchema = z.object({
  sql: z.string()
    .min(1)
    .max(5000)
    .trim()
    .refine(
      (sql) => sql.toUpperCase().startsWith('SELECT'),
      { message: 'Only SELECT queries allowed' }
    ),
  intent: z.enum(['simple_metric', 'filtered', 'comparative', 'temporal', 'aggregation', 'correlation']),
  explanation: z.string().min(10).max(500),
});

// ============================================
// CHAT SCHEMAS
// ============================================

export const ChatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long')
    .trim(),
  context: z.record(z.unknown()).optional(),
  employeeId: EmployeeIdSchema.optional(),
});

// ============================================
// EXPORT TYPES
// ============================================

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeQuery = z.infer<typeof EmployeeQuerySchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
```

#### Step 3: Create Validation Middleware (1 hour)

**File:** `webapp/lib/validation/middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

/**
 * Validate request body against Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        }, { status: 400 }),
      };
    }

    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: 'Invalid JSON payload',
      }, { status: 400 }),
    };
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const data = schema.parse(query);

    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        }, { status: 400 }),
      };
    }

    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
      }, { status: 400 }),
    };
  }
}

/**
 * Sanitize object to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key of Object.keys(obj)) {
    // Skip prototype properties
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
```

#### Step 4: Apply Validation to Employee Routes (2 hours)

**Update:** `webapp/app/api/employees/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, requireRole, authErrorResponse } from '@/lib/auth/middleware';
import { validateBody, validateQuery } from '@/lib/validation/middleware';
import {
  CreateEmployeeSchema,
  EmployeeQuerySchema,
  BulkUpdateEmployeesSchema,
  BulkDeleteEmployeesSchema,
} from '@/lib/validation/schemas';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

// ... existing helper functions ...

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  if (!hasPermission(authResult.user, 'employees', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Validate query parameters
  const queryResult = validateQuery(request, EmployeeQuerySchema);
  if (!queryResult.success) {
    return queryResult.response;
  }

  const { sortBy, sortOrder, status, department, search, page, limit } = queryResult.data;

  try {
    let employees = await loadMasterData();

    // Apply filters...
    if (status) {
      employees = employees.filter(emp => emp.status?.toLowerCase() === status.toLowerCase());
    }

    if (department) {
      employees = employees.filter(emp => emp.department === department);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employee_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting...
    if (sortBy) {
      employees.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedEmployees = employees.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      employees: paginatedEmployees,
      pagination: {
        page,
        limit,
        total: employees.length,
        totalPages: Math.ceil(employees.length / limit),
      },
    });

  } catch (error: any) {
    console.error('Get employees error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load employees'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Admin role required' },
      { status: 403 }
    );
  }

  if (!hasPermission(authResult.user, 'employees', 'write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Validate request body
  const bodyResult = await validateBody(request, CreateEmployeeSchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const newEmployee = {
    ...bodyResult.data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as MasterEmployeeRecord;

  try {
    const employees = await loadMasterData();

    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      return NextResponse.json({
        success: false,
        error: 'Employee with this ID already exists'
      }, { status: 400 });
    }

    employees.push(newEmployee);
    await saveMasterData(employees);

    return NextResponse.json({
      success: true,
      employee: newEmployee
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create employee'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Admin role required' },
      { status: 403 }
    );
  }

  // Validate request body
  const bodyResult = await validateBody(request, BulkUpdateEmployeesSchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { updates } = bodyResult.data;

  try {
    const employees = await loadMasterData();
    const employeeMap = new Map(employees.map(emp => [emp.employee_id, emp]));

    let updatedCount = 0;

    for (const update of updates) {
      const existing = employeeMap.get(update.employee_id);
      if (existing) {
        const merged = {
          ...existing,
          ...update,
          employee_id: existing.employee_id,
          updated_at: new Date().toISOString()
        };
        employeeMap.set(existing.employee_id, merged);
        updatedCount++;
      }
    }

    await saveMasterData(Array.from(employeeMap.values()));

    return NextResponse.json({
      success: true,
      updated: updatedCount
    });

  } catch (error: any) {
    console.error('Bulk update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update employees'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  if (!requireRole(authResult.user, 'super_admin')) {
    return NextResponse.json(
      { success: false, error: 'Super admin role required for deletion' },
      { status: 403 }
    );
  }

  // Validate request body
  const bodyResult = await validateBody(request, BulkDeleteEmployeesSchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { employee_ids } = bodyResult.data;

  try {
    const employees = await loadMasterData();
    const idsToDelete = new Set(employee_ids);
    const remaining = employees.filter(emp => !idsToDelete.has(emp.employee_id));

    await saveMasterData(remaining);

    return NextResponse.json({
      success: true,
      deleted: employees.length - remaining.length
    });

  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete employees'
    }, { status: 500 });
  }
}
```

#### Step 5: Apply to Other Routes (2 hours)

Apply validation to:
- `/api/chat/route.ts` - Use `ChatMessageSchema`
- `/api/analytics/chat/route.ts` - Use `AnalyticsQuerySchema`
- `/api/data/upload/route.ts` - Use `FileUploadSchema`

#### Testing Task 2.1
```bash
# Test 1: Valid input
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "hire_date": "2024-01-15T00:00:00Z",
    "job_title": "Software Engineer",
    "department": "Engineering",
    "level": "IC3"
  }'
# Expected: 201 Created

# Test 2: Invalid email
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "employee_id": "EMP002",
    "email": "not-an-email",
    ...
  }'
# Expected: 400 Bad Request with validation error

# Test 3: Prototype pollution attempt
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "__proto__": { "isAdmin": true },
    "employee_id": "EMP003",
    ...
  }'
# Expected: 400 Bad Request (field rejected)

# Test 4: SQL injection in search
curl -X GET "http://localhost:3000/api/employees?search='; DROP TABLE employees;--" \
  -H "Authorization: Bearer ${TOKEN}"
# Expected: 200 OK (safely escaped, no SQL execution)

# Test 5: XSS in employee name
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "first_name": "<script>alert(1)</script>",
    ...
  }'
# Expected: 400 Bad Request (invalid characters)
```

**Success Criteria:**
- ✅ All inputs validated before processing
- ✅ Prototype pollution attempts rejected
- ✅ SQL injection attempts safely handled
- ✅ XSS payloads rejected
- ✅ Clear error messages for validation failures
- ✅ No stack traces in error responses

---

### Task 2.2: Fix SQL Injection in Analytics Chat (6 hours)

**Priority:** CRITICAL-02
**Files to Modify:** `webapp/app/api/analytics/chat/route.ts`
**Files to Create:** `webapp/lib/analytics/sql-validator.ts`

#### Step 1: Install SQL Parser (5 minutes)
```bash
npm install node-sql-parser
npm install --save-dev @types/node-sql-parser
```

#### Step 2: Create SQL Validator (3 hours)

**File:** `webapp/lib/analytics/sql-validator.ts`
```typescript
import { Parser } from 'node-sql-parser';

const parser = new Parser();

export interface SQLValidationResult {
  valid: boolean;
  error?: string;
  sanitizedSQL?: string;
  metadata?: {
    tables: string[];
    columns: string[];
    hasSubqueries: boolean;
    hasJoins: boolean;
  };
}

// Whitelist of allowed tables
const ALLOWED_TABLES = new Set([
  'employees',
  'performance_reviews',
  'compensation',
  'time_off',
  'demographics',
]);

// Whitelist of allowed columns per table
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  employees: new Set([
    'id', 'employee_id', 'first_name', 'last_name', 'email',
    'department', 'level', 'manager_id', 'hire_date',
    'termination_date', 'status', 'location', 'job_title',
  ]),
  performance_reviews: new Set([
    'id', 'employee_id', 'review_date', 'rating', 'reviewer_id',
    'goals_met', 'strengths', 'areas_for_improvement',
  ]),
  compensation: new Set([
    'id', 'employee_id', 'effective_date', 'salary', 'currency',
    'bonus_target', 'equity_grants',
  ]),
  // ... other tables
};

// Blacklist of dangerous SQL keywords and functions
const DANGEROUS_KEYWORDS = new Set([
  'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
  'TRUNCATE', 'REPLACE', 'MERGE', 'GRANT', 'REVOKE',
  'EXEC', 'EXECUTE', 'PRAGMA', 'ATTACH', 'DETACH',
]);

const DANGEROUS_FUNCTIONS = new Set([
  'load_extension', 'readfile', 'writefile', 'system',
  'shell', 'eval', 'compile', 'char', 'hex',
]);

/**
 * Validate SQL query using AST parsing
 */
export function validateSQL(sql: string): SQLValidationResult {
  try {
    // Step 1: Basic syntax validation
    const normalized = sql.trim().toUpperCase();

    // Must start with SELECT
    if (!normalized.startsWith('SELECT')) {
      return {
        valid: false,
        error: 'Only SELECT queries are allowed',
      };
    }

    // Check for dangerous keywords
    for (const keyword of DANGEROUS_KEYWORDS) {
      // Use word boundaries to avoid false positives (e.g., "SELECT" contains "ELECT")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sql)) {
        return {
          valid: false,
          error: `Dangerous keyword detected: ${keyword}`,
        };
      }
    }

    // Check for dangerous functions
    for (const func of DANGEROUS_FUNCTIONS) {
      const regex = new RegExp(`\\b${func}\\s*\\(`, 'i');
      if (regex.test(sql)) {
        return {
          valid: false,
          error: `Dangerous function detected: ${func}`,
        };
      }
    }

    // Check for SQL comments (potential injection bypass)
    if (sql.includes('--') || sql.includes('/*') || sql.includes('*/')) {
      return {
        valid: false,
        error: 'SQL comments are not allowed',
      };
    }

    // Step 2: Parse SQL using AST parser
    let ast;
    try {
      ast = parser.astify(sql, { database: 'SQLite' });
    } catch (parseError: any) {
      return {
        valid: false,
        error: `SQL parsing error: ${parseError.message}`,
      };
    }

    // Ensure it's a SELECT statement
    if (ast.type !== 'select') {
      return {
        valid: false,
        error: 'Only SELECT statements are allowed',
      };
    }

    // Step 3: Extract and validate table references
    const tables = new Set<string>();
    const columns: string[] = [];

    // Extract table names from FROM clause
    if (ast.from) {
      for (const fromItem of ast.from) {
        if (fromItem.table) {
          const tableName = fromItem.table.toLowerCase();

          if (!ALLOWED_TABLES.has(tableName)) {
            return {
              valid: false,
              error: `Access to table '${tableName}' is not allowed`,
            };
          }

          tables.add(tableName);
        }
      }
    }

    // Extract column references
    if (ast.columns) {
      for (const col of ast.columns) {
        if (col.expr && col.expr.column) {
          const columnName = col.expr.column.toLowerCase();
          const tableName = col.expr.table?.toLowerCase();

          // Validate column access
          if (tableName && ALLOWED_COLUMNS[tableName]) {
            if (!ALLOWED_COLUMNS[tableName].has(columnName)) {
              return {
                valid: false,
                error: `Access to column '${tableName}.${columnName}' is not allowed`,
              };
            }
          }

          columns.push(columnName);
        }
      }
    }

    // Step 4: Additional security checks
    const hasSubqueries = JSON.stringify(ast).includes('"type":"select"');
    const hasJoins = ast.from && ast.from.some((f: any) => f.join);

    // Limit complexity
    if (hasSubqueries && JSON.stringify(ast).split('"type":"select"').length > 3) {
      return {
        valid: false,
        error: 'Too many nested subqueries (max 2 levels)',
      };
    }

    // Step 5: Sanitize and return
    return {
      valid: true,
      sanitizedSQL: sql.trim(),
      metadata: {
        tables: Array.from(tables),
        columns,
        hasSubqueries,
        hasJoins: !!hasJoins,
      },
    };

  } catch (error: any) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`,
    };
  }
}

/**
 * Execute SQL query safely with parameterization
 */
export async function executeSQL(
  db: any,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  // Validate first
  const validation = validateSQL(sql);
  if (!validation.valid) {
    throw new Error(`SQL validation failed: ${validation.error}`);
  }

  // Use prepared statements to prevent injection
  const stmt = db.prepare(validation.sanitizedSQL);
  const results = stmt.all(...params);
  stmt.finalize();

  return results;
}

/**
 * Sanitize SQL result for PII protection
 */
export function sanitizeResults(
  results: any[],
  piiFields: Set<string> = new Set(['email', 'phone', 'personal_email', 'date_of_birth'])
): any[] {
  return results.map(row => {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(row)) {
      if (piiFields.has(key.toLowerCase())) {
        // Redact PII unless explicitly requested
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  });
}
```

#### Step 3: Update Analytics Chat Route (2 hours)

**File:** `webapp/app/api/analytics/chat/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { validateBody } from '@/lib/validation/middleware';
import { AnalyticsQuerySchema, SQLQuerySchema } from '@/lib/validation/schemas';
import { validateSQL, executeSQL, sanitizeResults } from '@/lib/analytics/sql-validator';
import { loadDataFileByType, initDatabase } from '@/lib/analytics/utils';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ... existing cache and tool definitions ...

export async function POST(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Validate request body
  const bodyResult = await validateBody(request, AnalyticsQuerySchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { message, context, includeCharts } = bodyResult.data;

  try {
    // Generate SQL using Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      tools: [SQL_GENERATION_TOOL],
      messages: [{
        role: 'user',
        content: `Generate a SQL query for: ${message}`,
      }],
    });

    // Extract SQL from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate SQL query',
      }, { status: 500 });
    }

    const { sql, intent, explanation } = toolUse.input as any;

    // CRITICAL: Validate SQL before execution
    const validation = validateSQL(sql);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'SQL validation failed',
        details: validation.error,
        // Don't expose the generated SQL to prevent learning attack patterns
      }, { status: 400 });
    }

    // Initialize database
    const db = await initDatabase();

    // Execute SQL safely with prepared statements
    let results;
    try {
      results = await executeSQL(db, validation.sanitizedSQL);
    } catch (execError: any) {
      console.error('SQL execution error:', execError);
      return NextResponse.json({
        success: false,
        error: 'Query execution failed',
        // Don't expose technical details
      }, { status: 500 });
    }

    // Sanitize PII from results
    const sanitizedResults = sanitizeResults(results);

    // Generate charts if requested
    let charts;
    if (includeCharts && sanitizedResults.length > 0) {
      charts = generateChartsFromResults(sanitizedResults, intent);
    }

    return NextResponse.json({
      success: true,
      query: {
        intent,
        explanation,
        // Don't return the actual SQL to users
      },
      results: sanitizedResults,
      charts,
      rowCount: sanitizedResults.length,
    });

  } catch (error: any) {
    console.error('Analytics chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process analytics query',
    }, { status: 500 });
  }
}

// Helper function to generate charts
function generateChartsFromResults(results: any[], intent: string): any[] {
  // Implementation depends on chart library
  return [];
}
```

#### Testing Task 2.2
```bash
# Test 1: Valid analytics query
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "How many employees in Engineering?",
    "context": "headcount"
  }'
# Expected: 200 OK with results

# Test 2: SQL injection attempt - DROP TABLE
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "SELECT * FROM employees; DROP TABLE employees;--"
  }'
# Expected: 400 Bad Request (validation failure)

# Test 3: load_extension attack
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "SELECT load_extension('\''malicious.so'\'');"
  }'
# Expected: 400 Bad Request (dangerous function detected)

# Test 4: Nested subquery bomb
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "SELECT * FROM (SELECT * FROM (SELECT * FROM employees)))"
  }'
# Expected: 400 Bad Request (too many nested subqueries)

# Test 5: Access forbidden table
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "SELECT * FROM system_config"
  }'
# Expected: 400 Bad Request (table not allowed)
```

**Success Criteria:**
- ✅ All SQL queries parsed with AST
- ✅ Table/column access validated against whitelist
- ✅ Dangerous functions blocked
- ✅ SQL injection attempts rejected
- ✅ PII fields redacted in results
- ✅ Prepared statements used for execution

---

### Task 2.3: Implement Audit Logging (8 hours)

**Priority:** HIGH-02
**Files to Create:** `webapp/lib/audit/logger.ts`, `webapp/lib/audit/types.ts`

#### Step 1: Design Audit Log Schema (1 hour)

**File:** `webapp/lib/audit/types.ts`
```typescript
export interface AuditLogEntry {
  // Identity
  id: string; // UUID
  timestamp: string; // ISO 8601

  // User context
  userId: string;
  userEmail: string;
  userRole: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;

  // Action details
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;

  // Request details
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  statusCode: number;

  // PII access tracking
  piiAccessed?: string[]; // List of PII fields accessed
  recordCount?: number; // Number of records affected

  // Outcome
  success: boolean;
  errorMessage?: string;

  // Additional context
  metadata?: Record<string, any>;

  // Compliance
  complianceFlags?: ('GDPR' | 'CCPA' | 'SOC2' | 'HIPAA')[];
}

export type AuditAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'bulk_update'
  | 'bulk_delete'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'password_reset'
  | 'file_upload'
  | 'file_download'
  | 'sql_query'
  | 'ai_chat'
  | 'data_import';

export type AuditResource =
  | 'employee'
  | 'performance_review'
  | 'compensation'
  | 'analytics'
  | 'chat'
  | 'file'
  | 'user'
  | 'role'
  | 'permission';

export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  success?: boolean;
  piiAccessed?: boolean;
  limit?: number;
  offset?: number;
}
```

#### Step 2: Create Audit Logger (3 hours)

**File:** `webapp/lib/audit/logger.ts`
```typescript
import { v4 as uuidv4 } from 'uuid';
import { writeFile, appendFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { AuthUser } from '@/lib/auth/types';
import { AuditLogEntry, AuditAction, AuditResource } from './types';

const AUDIT_LOG_DIR = path.join(process.cwd(), '..', 'audit-logs');
const CURRENT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'current.ndjson');

// Ensure audit log directory exists
async function ensureLogDirectory() {
  try {
    await mkdir(AUDIT_LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create audit log directory:', error);
  }
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  request: NextRequest,
  user: AuthUser | null,
  action: AuditAction,
  resource: AuditResource,
  options: {
    resourceId?: string;
    success: boolean;
    statusCode: number;
    errorMessage?: string;
    piiAccessed?: string[];
    recordCount?: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await ensureLogDirectory();

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),

      // User context
      userId: user?.userId || 'anonymous',
      userEmail: user?.email || 'anonymous',
      userRole: user?.roles[0]?.name || 'none',
      sessionId: user?.sessionId || 'none',
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',

      // Action details
      action,
      resource,
      resourceId: options.resourceId,

      // Request details
      method: request.method as any,
      endpoint: request.nextUrl.pathname,
      statusCode: options.statusCode,

      // PII tracking
      piiAccessed: options.piiAccessed,
      recordCount: options.recordCount,

      // Outcome
      success: options.success,
      errorMessage: options.errorMessage,

      // Metadata
      metadata: options.metadata,

      // Compliance flags
      complianceFlags: determineComplianceFlags(action, resource, options.piiAccessed),
    };

    // Write to NDJSON log file (one JSON object per line)
    const logLine = JSON.stringify(entry) + '\n';
    await appendFile(CURRENT_LOG_FILE, logLine, 'utf-8');

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', {
        user: entry.userEmail,
        action: entry.action,
        resource: entry.resource,
        success: entry.success,
      });
    }

    // Check if log rotation is needed
    await rotateLogsIfNeeded();

  } catch (error) {
    // CRITICAL: Never fail the request due to logging errors
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (not reliable in production)
  return 'unknown';
}

/**
 * Determine compliance flags based on action and resource
 */
function determineComplianceFlags(
  action: AuditAction,
  resource: AuditResource,
  piiAccessed?: string[]
): ('GDPR' | 'CCPA' | 'SOC2' | 'HIPAA')[] {
  const flags: Set<string> = new Set();

  // GDPR: Any PII access
  if (piiAccessed && piiAccessed.length > 0) {
    flags.add('GDPR');
    flags.add('CCPA');
  }

  // SOC 2: All access control events
  if (['login', 'logout', 'permission_change'].includes(action)) {
    flags.add('SOC2');
  }

  // SOC 2: All data modification events
  if (['create', 'update', 'delete', 'bulk_update', 'bulk_delete'].includes(action)) {
    flags.add('SOC2');
  }

  return Array.from(flags) as any;
}

/**
 * Rotate log files if current log exceeds size threshold
 */
async function rotateLogsIfNeeded(): Promise<void> {
  try {
    const MAX_LOG_SIZE = 50 * 1024 * 1024; // 50MB

    const stats = await readFile(CURRENT_LOG_FILE, 'utf-8');
    const size = Buffer.byteLength(stats, 'utf-8');

    if (size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFile = path.join(AUDIT_LOG_DIR, `audit-${timestamp}.ndjson`);

      // Rename current log to archive
      await writeFile(archiveFile, await readFile(CURRENT_LOG_FILE));

      // Create new empty log
      await writeFile(CURRENT_LOG_FILE, '', 'utf-8');

      console.log(`[AUDIT] Rotated logs to ${archiveFile}`);
    }
  } catch (error) {
    // Log rotation is best-effort
    console.error('Failed to rotate audit logs:', error);
  }
}

/**
 * Query audit logs (for compliance reporting)
 */
export async function queryAuditLogs(
  query: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  try {
    const content = await readFile(CURRENT_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n');

    let entries = lines
      .map(line => {
        try {
          return JSON.parse(line) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is AuditLogEntry => entry !== null);

    // Apply filters
    if (query.userId) {
      entries = entries.filter(e => e.userId === query.userId);
    }

    if (query.action) {
      entries = entries.filter(e => e.action === query.action);
    }

    if (query.startDate) {
      entries = entries.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      entries = entries.filter(e => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Apply limit
    if (query.limit) {
      entries = entries.slice(0, query.limit);
    }

    return entries;

  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
}

/**
 * Detect PII fields in request payload
 */
export function detectPIIFields(data: any): string[] {
  const PII_FIELDS = new Set([
    'first_name',
    'last_name',
    'email',
    'personal_email',
    'phone',
    'date_of_birth',
    'ssn',
    'salary',
    'address',
    'city',
    'state',
    'zip_code',
    'country',
  ]);

  const piiAccessed: string[] = [];

  function traverse(obj: any, prefix: string = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (PII_FIELDS.has(key.toLowerCase())) {
        piiAccessed.push(fullKey);
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          traverse(item, `${fullKey}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        traverse(value, fullKey);
      }
    }
  }

  traverse(data);
  return piiAccessed;
}
```

#### Step 3: Integrate Audit Logging into API Routes (3 hours)

**Update:** `webapp/app/api/employees/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { validateBody, validateQuery } from '@/lib/validation/middleware';
import { logAuditEvent, detectPIIFields } from '@/lib/audit/logger';
import { CreateEmployeeSchema, EmployeeQuerySchema } from '@/lib/validation/schemas';
// ... other imports ...

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    // Log failed authentication attempt
    await logAuditEvent(request, null, 'read', 'employee', {
      success: false,
      statusCode: 401,
      errorMessage: 'Unauthorized',
    });
    return authErrorResponse(authResult);
  }

  if (!hasPermission(authResult.user, 'employees', 'read')) {
    // Log failed authorization
    await logAuditEvent(request, authResult.user, 'read', 'employee', {
      success: false,
      statusCode: 403,
      errorMessage: 'Insufficient permissions',
    });
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const queryResult = validateQuery(request, EmployeeQuerySchema);
  if (!queryResult.success) {
    return queryResult.response;
  }

  try {
    let employees = await loadMasterData();

    // Apply filters and pagination...
    // ... existing logic ...

    // Log successful access
    await logAuditEvent(request, authResult.user, 'read', 'employee', {
      success: true,
      statusCode: 200,
      recordCount: paginatedEmployees.length,
      piiAccessed: ['email', 'first_name', 'last_name'], // All employee reads access PII
      metadata: {
        filters: { status, department, search },
        pagination: { page, limit },
      },
    });

    return NextResponse.json({
      success: true,
      employees: paginatedEmployees,
      pagination: {
        page,
        limit,
        total: employees.length,
        totalPages: Math.ceil(employees.length / limit),
      },
    });

  } catch (error: any) {
    console.error('Get employees error:', error);

    // Log error
    await logAuditEvent(request, authResult.user, 'read', 'employee', {
      success: false,
      statusCode: 500,
      errorMessage: 'Failed to load employees',
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to load employees'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    await logAuditEvent(request, null, 'create', 'employee', {
      success: false,
      statusCode: 401,
      errorMessage: 'Unauthorized',
    });
    return authErrorResponse(authResult);
  }

  if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
    await logAuditEvent(request, authResult.user, 'create', 'employee', {
      success: false,
      statusCode: 403,
      errorMessage: 'Admin role required',
    });
    return NextResponse.json(
      { success: false, error: 'Admin role required' },
      { status: 403 }
    );
  }

  const bodyResult = await validateBody(request, CreateEmployeeSchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const newEmployee = {
    ...bodyResult.data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as MasterEmployeeRecord;

  try {
    const employees = await loadMasterData();

    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      await logAuditEvent(request, authResult.user, 'create', 'employee', {
        success: false,
        statusCode: 400,
        errorMessage: 'Employee ID already exists',
        resourceId: newEmployee.employee_id,
      });
      return NextResponse.json({
        success: false,
        error: 'Employee with this ID already exists'
      }, { status: 400 });
    }

    employees.push(newEmployee);
    await saveMasterData(employees);

    // Log successful creation with PII tracking
    const piiFields = detectPIIFields(newEmployee);
    await logAuditEvent(request, authResult.user, 'create', 'employee', {
      success: true,
      statusCode: 201,
      resourceId: newEmployee.employee_id,
      recordCount: 1,
      piiAccessed: piiFields,
      metadata: {
        department: newEmployee.department,
        level: newEmployee.level,
      },
    });

    return NextResponse.json({
      success: true,
      employee: newEmployee
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create employee error:', error);

    await logAuditEvent(request, authResult.user, 'create', 'employee', {
      success: false,
      statusCode: 500,
      errorMessage: 'Failed to create employee',
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create employee'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    await logAuditEvent(request, null, 'delete', 'employee', {
      success: false,
      statusCode: 401,
      errorMessage: 'Unauthorized',
    });
    return authErrorResponse(authResult);
  }

  if (!requireRole(authResult.user, 'super_admin')) {
    await logAuditEvent(request, authResult.user, 'bulk_delete', 'employee', {
      success: false,
      statusCode: 403,
      errorMessage: 'Super admin role required',
    });
    return NextResponse.json(
      { success: false, error: 'Super admin role required for deletion' },
      { status: 403 }
    );
  }

  const bodyResult = await validateBody(request, BulkDeleteEmployeesSchema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { employee_ids } = bodyResult.data;

  try {
    const employees = await loadMasterData();
    const idsToDelete = new Set(employee_ids);
    const remaining = employees.filter(emp => !idsToDelete.has(emp.employee_id));
    const deletedCount = employees.length - remaining.length;

    await saveMasterData(remaining);

    // Log bulk deletion (CRITICAL for compliance)
    await logAuditEvent(request, authResult.user, 'bulk_delete', 'employee', {
      success: true,
      statusCode: 200,
      recordCount: deletedCount,
      piiAccessed: ['all'], // Deletion accesses all PII
      metadata: {
        employee_ids: Array.from(idsToDelete),
      },
    });

    return NextResponse.json({
      success: true,
      deleted: deletedCount
    });

  } catch (error: any) {
    console.error('Bulk delete error:', error);

    await logAuditEvent(request, authResult.user, 'bulk_delete', 'employee', {
      success: false,
      statusCode: 500,
      errorMessage: 'Failed to delete employees',
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to delete employees'
    }, { status: 500 });
  }
}
```

#### Step 4: Create Audit Log API Endpoint (1 hour)

**File:** `webapp/app/api/audit/logs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, authErrorResponse } from '@/lib/auth/middleware';
import { queryAuditLogs } from '@/lib/audit/logger';

/**
 * GET /api/audit/logs
 *
 * Query audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Only admins can view audit logs
  if (!requireRole(authResult.user, 'super_admin', 'hr_admin')) {
    return NextResponse.json(
      { success: false, error: 'Admin role required' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const query = {
    userId: searchParams.get('userId') || undefined,
    action: searchParams.get('action') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    limit: parseInt(searchParams.get('limit') || '100', 10),
  };

  try {
    const logs = await queryAuditLogs(query);

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });

  } catch (error: any) {
    console.error('Query audit logs error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query audit logs'
    }, { status: 500 });
  }
}
```

#### Testing Task 2.3
```bash
# Test 1: Create employee and verify audit log
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"employee_id": "EMP999", ...}'

# Check audit log
curl -X GET "http://localhost:3000/api/audit/logs?action=create&limit=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
# Expected: Log entry with PII fields tracked

# Test 2: Failed auth attempt logged
curl -X GET http://localhost:3000/api/employees
# Check log for failed auth

# Test 3: Bulk delete logged
curl -X DELETE http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${SUPER_ADMIN_TOKEN}" \
  -d '{"employee_ids": ["EMP001", "EMP002"]}'
# Expected: Audit log with bulk_delete action

# Test 4: Query logs by user
curl -X GET "http://localhost:3000/api/audit/logs?userId=user123&startDate=2024-01-01" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
# Expected: All actions by user123 since Jan 1

# Test 5: Verify PII access tracking
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}"
# Check audit log for piiAccessed field
```

**Success Criteria:**
- ✅ All API calls logged with user context
- ✅ PII access tracked for GDPR compliance
- ✅ Failed auth/authz attempts logged
- ✅ Bulk operations logged with record count
- ✅ Logs immutable (append-only NDJSON)
- ✅ Log rotation at 50MB threshold
- ✅ Compliance flags assigned automatically

---

### Task 2.4: Implement Rate Limiting (6 hours)

**Priority:** HIGH-01
**Files to Create:** `webapp/lib/rate-limit/limiter.ts`, `webapp/lib/rate-limit/store.ts`

#### Step 1: Install Dependencies (5 minutes)
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

#### Step 2: Create Rate Limit Store (2 hours)

**File:** `webapp/lib/rate-limit/store.ts`
```typescript
import Redis from 'ioredis';

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<number>;
}

/**
 * Redis-based rate limit store (production)
 */
export class RedisRateLimitStore implements RateLimitStore {
  private client: Redis;

  constructor(redisUrl?: string) {
    this.client = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Redis sorted set for sliding window
    const multi = this.client.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, '-inf', windowStart);

    // Add current request with timestamp as score
    multi.zadd(key, now, `${now}-${Math.random()}`);

    // Count requests in current window
    multi.zcard(key);

    // Set expiry on the key (cleanup)
    multi.expire(key, Math.ceil(windowMs / 1000) + 1);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    // Return count from zcard command (3rd command, index 2)
    return results[2][1] as number;
  }

  async reset(key: string): Promise<void> {
    await this.client.del(key);
  }

  async get(key: string): Promise<number> {
    return await this.client.zcard(key);
  }
}

/**
 * In-memory rate limit store (development/testing)
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // Create new window
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return 1;
    }

    // Increment existing window
    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }
    return entry.count;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimitStore: RateLimitStore =
  process.env.NODE_ENV === 'production' && process.env.REDIS_URL
    ? new RedisRateLimitStore()
    : new MemoryRateLimitStore();
```

#### Step 3: Create Rate Limiter Middleware (2 hours)

**File:** `webapp/lib/rate-limit/limiter.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitStore } from './store';
import { AuthUser } from '@/lib/auth/types';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest, user: AuthUser | null) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry
}

/**
 * Default key generator: IP + User ID
 */
function defaultKeyGenerator(request: NextRequest, user: AuthUser | null): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userId = user?.userId || 'anonymous';
  return `ratelimit:${ip}:${userId}`;
}

/**
 * Check rate limit for request
 */
export async function checkRateLimit(
  request: NextRequest,
  user: AuthUser | null,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request, user);

  const count = await rateLimitStore.increment(key, config.windowMs);
  const allowed = count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - count);
  const resetAt = new Date(Date.now() + config.windowMs);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
  };
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    user: AuthUser | null
  ): Promise<NextResponse | null> {
    const result = await checkRateLimit(request, user, config);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      headers.set('Retry-After', result.retryAfter!.toString());

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Return null to indicate rate limit passed (continue with request)
    return null;
  };
}

// ============================================
// PREDEFINED RATE LIMITERS
// ============================================

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    return `ratelimit:auth:${ip}`;
  },
});

/**
 * API rate limiter for general endpoints
 * 100 requests per 15 minutes (authenticated)
 * 20 requests per 15 minutes (anonymous)
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100, // Will be adjusted per user
  keyGenerator: (request, user) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (user) {
      return `ratelimit:api:user:${user.userId}`;
    }
    return `ratelimit:api:anon:${ip}`;
  },
});

/**
 * AI chat rate limiter
 * 50 messages per hour (expensive operation)
 */
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50,
  keyGenerator: (request, user) => {
    return `ratelimit:chat:${user?.userId || 'anonymous'}`;
  },
});

/**
 * Data export rate limiter
 * 10 exports per hour (expensive operation)
 */
export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: (request, user) => {
    return `ratelimit:export:${user?.userId || 'anonymous'}`;
  },
});

/**
 * File upload rate limiter
 * 20 uploads per hour
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  keyGenerator: (request, user) => {
    return `ratelimit:upload:${user?.userId || 'anonymous'}`;
  },
});
```

#### Step 4: Apply Rate Limiting to Routes (1.5 hours)

**Update:** `webapp/app/api/employees/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { apiRateLimiter } from '@/lib/rate-limit/limiter';
// ... other imports ...

export async function GET(request: NextRequest) {
  // Check rate limit BEFORE authentication
  const authResult = await requireAuth(request);

  const rateLimitResult = await apiRateLimiter(request, authResult.success ? authResult.user : null);
  if (rateLimitResult) {
    return rateLimitResult; // Rate limit exceeded
  }

  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // ... rest of handler ...
}

// Apply to all HTTP methods...
```

**File:** `webapp/app/api/chat/route.ts`
```typescript
import { chatRateLimiter } from '@/lib/rate-limit/limiter';
// ... other imports ...

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Apply chat-specific rate limit
  const rateLimitResult = await chatRateLimiter(request, authResult.user);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // ... rest of handler ...
}
```

#### Testing Task 2.4
```bash
# Test 1: Normal request (should succeed)
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/employees \
    -H "Authorization: Bearer ${TOKEN}"
done
# Expected: All succeed with X-RateLimit headers

# Test 2: Exceed rate limit
for i in {1..150}; do
  curl -X GET http://localhost:3000/api/employees \
    -H "Authorization: Bearer ${TOKEN}"
done
# Expected: 429 Too Many Requests after 100 requests

# Test 3: Check rate limit headers
curl -I http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}"
# Expected: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers

# Test 4: Chat rate limit
for i in {1..60}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"message": "test"}'
done
# Expected: 429 after 50 requests

# Test 5: Anonymous rate limit (stricter)
for i in {1..30}; do
  curl -X GET http://localhost:3000/api/health
done
# Expected: 429 after 20 requests
```

**Success Criteria:**
- ✅ Rate limits enforced per user and IP
- ✅ Different limits for different endpoint types
- ✅ Sliding window algorithm (not fixed window)
- ✅ Rate limit headers in all responses
- ✅ Clear error messages with retry information
- ✅ Redis used in production, memory in dev

---

### Phase 2 Summary

**Total Time:** 28 hours
**Tasks Completed:** 4 high-priority fixes

**Checklist:**
- ✅ Task 2.1: Input validation with Zod
- ✅ Task 2.2: SQL injection prevention
- ✅ Task 2.3: Audit logging
- ✅ Task 2.4: Rate limiting

**Deployment Steps:**
1. Merge Phase 2 to staging
2. Deploy Redis instance for rate limiting
3. Configure environment variables
4. Run integration tests
5. Monitor audit logs and rate limit metrics
6. Deploy to production
7. Alert on audit anomalies

---

## PHASE 3: IMPORTANT ENHANCEMENTS (2-4 weeks)

**Priority:** 🟠 IMPORTANT
**Team Required:** 2-3 engineers
**Total Estimated Time:** 80-120 hours

### Task 3.1: Implement Encryption at Rest (16 hours)

**Priority:** HIGH-03
**Files to Create:** `webapp/lib/crypto/encryption.ts`
**Files to Modify:** All data storage functions

#### Step 1: Install Crypto Libraries (5 minutes)
```bash
npm install crypto-js
npm install @types/crypto-js
```

#### Step 2: Create Encryption Service (4 hours)

**File:** `webapp/lib/crypto/encryption.ts`
```typescript
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  // Key should be base64 encoded 256-bit key
  return Buffer.from(key, 'base64');
}

/**
 * Generate new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, tagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt specific PII fields in object
 */
export function encryptPIIFields<T extends Record<string, any>>(
  data: T,
  piiFields: string[]
): T {
  const encrypted = { ...data };

  for (const field of piiFields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  }

  return encrypted;
}

/**
 * Decrypt specific PII fields in object
 */
export function decryptPIIFields<T extends Record<string, any>>(
  data: T,
  piiFields: string[]
): T {
  const decrypted = { ...data };

  for (const field of piiFields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      try {
        decrypted[field] = decrypt(String(decrypted[field]));
      } catch (error) {
        // Field might not be encrypted (during migration)
        console.warn(`Failed to decrypt field ${field}, leaving as-is`);
      }
    }
  }

  return decrypted;
}

// PII fields that should be encrypted
export const PII_FIELDS = [
  'email',
  'personal_email',
  'phone',
  'date_of_birth',
  'ssn',
  'address',
  'city',
  'state',
  'zip_code',
  'salary',
  'bank_account',
  'tax_id',
];
```

#### Step 3: Update Data Storage Functions (6 hours)

**Update:** `webapp/lib/data/employee-storage.ts` (create new file)
```typescript
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { encryptPIIFields, decryptPIIFields, PII_FIELDS } from '@/lib/crypto/encryption';
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
const MASTER_DATA_PATH = path.join(DATA_DIR, 'master-employees.json');

/**
 * Load and decrypt employee data
 */
export async function loadEmployeeData(): Promise<MasterEmployeeRecord[]> {
  try {
    const content = await readFile(MASTER_DATA_PATH, 'utf-8');
    const encryptedData = JSON.parse(content);

    // Decrypt PII fields for each employee
    const decryptedData = encryptedData.map((emp: MasterEmployeeRecord) =>
      decryptPIIFields(emp, PII_FIELDS)
    );

    return decryptedData;
  } catch (error) {
    console.error('Failed to load employee data:', error);
    return [];
  }
}

/**
 * Encrypt and save employee data
 */
export async function saveEmployeeData(employees: MasterEmployeeRecord[]): Promise<void> {
  try {
    // Encrypt PII fields for each employee
    const encryptedData = employees.map(emp =>
      encryptPIIFields(emp, PII_FIELDS)
    );

    await writeFile(
      MASTER_DATA_PATH,
      JSON.stringify(encryptedData, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Failed to save employee data:', error);
    throw new Error('Failed to save employee data');
  }
}
```

#### Step 4: Data Migration Script (3 hours)

**File:** `scripts/migrate-encrypt-data.ts`
```typescript
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { encryptPIIFields, PII_FIELDS } from '../webapp/lib/crypto/encryption';

async function migrateData() {
  console.log('Starting data encryption migration...');

  const dataPath = path.join(__dirname, '..', 'data', 'master-employees.json');
  const backupPath = path.join(__dirname, '..', 'data', 'master-employees.backup.json');

  try {
    // 1. Backup original data
    console.log('Creating backup...');
    const originalData = await readFile(dataPath, 'utf-8');
    await writeFile(backupPath, originalData, 'utf-8');
    console.log('Backup created:', backupPath);

    // 2. Load data
    const employees = JSON.parse(originalData);
    console.log(`Loaded ${employees.length} employee records`);

    // 3. Encrypt PII fields
    console.log('Encrypting PII fields:', PII_FIELDS.join(', '));
    const encryptedEmployees = employees.map((emp: any) =>
      encryptPIIFields(emp, PII_FIELDS)
    );

    // 4. Save encrypted data
    await writeFile(
      dataPath,
      JSON.stringify(encryptedEmployees, null, 2),
      'utf-8'
    );

    console.log('Migration complete!');
    console.log('Encrypted fields:', PII_FIELDS.length);
    console.log('Total records processed:', employees.length);

  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Restore from backup:', backupPath);
    process.exit(1);
  }
}

migrateData();
```

Run migration:
```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env
echo "ENCRYPTION_KEY=<generated-key>" >> .env.production

# Run migration
npx ts-node scripts/migrate-encrypt-data.ts
```

#### Step 5: Update API Routes (3 hours)

**Update:** `webapp/app/api/employees/route.ts`
```typescript
import { loadEmployeeData, saveEmployeeData } from '@/lib/data/employee-storage';

// Replace all loadMasterData() calls with loadEmployeeData()
// Replace all saveMasterData() calls with saveEmployeeData()
```

#### Testing Task 3.1
```bash
# Test 1: Encrypt and decrypt
node -e "
const { encrypt, decrypt } = require('./webapp/lib/crypto/encryption');
const original = 'john.doe@example.com';
const encrypted = encrypt(original);
const decrypted = decrypt(encrypted);
console.log('Original:', original);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', original === decrypted);
"

# Test 2: Read encrypted data
cat data/master-employees.json | jq '.[0].email'
# Expected: Encrypted string like "a1b2c3:d4e5f6:g7h8i9..."

# Test 3: API returns decrypted data
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}"
# Expected: Plain email addresses (decrypted)

# Test 4: Direct file access shows encrypted
cat data/master-employees.json
# Expected: All PII fields encrypted
```

**Success Criteria:**
- ✅ All PII fields encrypted at rest
- ✅ AES-256-GCM encryption used
- ✅ API transparently decrypts for authorized users
- ✅ Encryption keys stored securely (not in code)
- ✅ Backup created before migration
- ✅ Performance impact < 10ms per request

---

### Task 3.2: PII Redaction for Claude API (12 hours)

**Priority:** CRITICAL-06
**Files to Create:** `webapp/lib/ai/pii-redactor.ts`
**Files to Modify:** `webapp/app/api/chat/route.ts`, `webapp/app/api/analytics/chat/route.ts`

#### Step 1: Create PII Redactor (4 hours)

**File:** `webapp/lib/ai/pii-redactor.ts`
```typescript
import { MasterEmployeeRecord } from '@/lib/types/master-employee';

export interface RedactionResult {
  redacted: any;
  metadata: {
    fieldsRedacted: string[];
    recordCount: number;
  };
}

/**
 * Redact PII from employee data before sending to Claude
 */
export function redactEmployeePII(employees: MasterEmployeeRecord[]): RedactionResult {
  const fieldsRedacted = new Set<string>();

  const redacted = employees.map(emp => {
    const safe: any = {
      // Keep safe fields
      employee_id: emp.employee_id,
      department: emp.department,
      level: emp.level,
      job_title: emp.job_title,
      status: emp.status,
      location: emp.location,

      // Anonymize name
      name_hash: hashString(emp.full_name || ''),

      // Redact PII
      email: '[REDACTED]',
      personal_email: '[REDACTED]',
      phone: '[REDACTED]',
      date_of_birth: '[REDACTED]',

      // Keep dates but not DOB
      hire_date: emp.hire_date,
      termination_date: emp.termination_date,

      // Salary bands instead of exact
      salary_band: getSalaryBand(emp.salary),

      // Aggregated demographics (no individual identification)
      gender_category: emp.gender ? 'specified' : 'not_specified',
    };

    // Track what was redacted
    if (emp.email) fieldsRedacted.add('email');
    if (emp.phone) fieldsRedacted.add('phone');
    if (emp.date_of_birth) fieldsRedacted.add('date_of_birth');
    if (emp.salary) fieldsRedacted.add('salary');

    return safe;
  });

  return {
    redacted,
    metadata: {
      fieldsRedacted: Array.from(fieldsRedacted),
      recordCount: employees.length,
    },
  };
}

/**
 * Hash string for anonymization
 */
function hashString(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 8);
}

/**
 * Convert exact salary to band
 */
function getSalaryBand(salary?: number): string {
  if (!salary) return 'unknown';

  if (salary < 50000) return 'band_1';
  if (salary < 75000) return 'band_2';
  if (salary < 100000) return 'band_3';
  if (salary < 150000) return 'band_4';
  if (salary < 200000) return 'band_5';
  return 'band_6';
}

/**
 * Create safe analytics context
 */
export function createSafeAnalyticsContext(
  employees: MasterEmployeeRecord[]
): string {
  const { redacted, metadata } = redactEmployeePII(employees);

  return `
You are analyzing HR data for ${metadata.recordCount} employees.
PII has been redacted (${metadata.fieldsRedacted.join(', ')}).

Available data:
- Employee IDs (anonymized)
- Departments and job levels
- Hire/termination dates
- Salary bands (not exact amounts)
- Aggregated demographics

Employee data:
${JSON.stringify(redacted, null, 2)}

IMPORTANT:
- Do not attempt to re-identify individuals
- Focus on aggregate trends and patterns
- Respect privacy in all responses
  `.trim();
}

/**
 * Redact PII from chat messages
 */
export function redactMessagePII(message: string): string {
  // Email pattern
  message = message.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  );

  // Phone pattern (US)
  message = message.replace(
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    '[PHONE]'
  );

  // SSN pattern
  message = message.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    '[SSN]'
  );

  // Credit card pattern
  message = message.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    '[CREDIT_CARD]'
  );

  return message;
}
```

#### Step 2: Update Chat API (4 hours)

**Update:** `webapp/app/api/chat/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { chatRateLimiter } from '@/lib/rate-limit/limiter';
import { logAuditEvent } from '@/lib/audit/logger';
import { createSafeAnalyticsContext, redactMessagePII } from '@/lib/ai/pii-redactor';
import { loadEmployeeData } from '@/lib/data/employee-storage';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const rateLimitResult = await chatRateLimiter(request, authResult.user);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { message, context } = await request.json();

    // Redact PII from user message
    const safeMessage = redactMessagePII(message);

    // Load and redact employee data
    const employees = await loadEmployeeData();
    const safeContext = createSafeAnalyticsContext(employees);

    // Send to Claude with redacted data
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: safeContext,
      messages: [{
        role: 'user',
        content: safeMessage,
      }],
    });

    // Log AI interaction (no PII)
    await logAuditEvent(request, authResult.user, 'ai_chat', 'chat', {
      success: true,
      statusCode: 200,
      metadata: {
        message_length: safeMessage.length,
        employee_count: employees.length,
        pii_redacted: true,
      },
    });

    return NextResponse.json({
      success: true,
      response: response.content[0].type === 'text'
        ? response.content[0].text
        : '',
    });

  } catch (error: any) {
    console.error('Chat error:', error);

    await logAuditEvent(request, authResult.user, 'ai_chat', 'chat', {
      success: false,
      statusCode: 500,
      errorMessage: 'Chat processing failed',
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to process chat message',
    }, { status: 500 });
  }
}
```

#### Step 3: Update Analytics Chat (2 hours)

Apply same PII redaction to `webapp/app/api/analytics/chat/route.ts`

#### Step 4: Test PII Redaction (2 hours)

**Test Script:** `scripts/test-pii-redaction.ts`
```typescript
import { redactEmployeePII, redactMessagePII } from '../webapp/lib/ai/pii-redactor';

const testEmployee = {
  employee_id: 'EMP001',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  email: 'john.doe@company.com',
  personal_email: 'john.personal@gmail.com',
  phone: '555-123-4567',
  date_of_birth: '1990-01-15',
  department: 'Engineering',
  level: 'IC3',
  salary: 120000,
  hire_date: '2020-01-01',
};

console.log('Testing PII redaction...\n');

const { redacted, metadata } = redactEmployeePII([testEmployee]);
console.log('Redacted employee:', JSON.stringify(redacted[0], null, 2));
console.log('\nMetadata:', metadata);

const testMessage = 'Contact john.doe@company.com or call 555-123-4567 about SSN 123-45-6789';
const redactedMessage = redactMessagePII(testMessage);
console.log('\nOriginal message:', testMessage);
console.log('Redacted message:', redactedMessage);
```

Run test:
```bash
npx ts-node scripts/test-pii-redaction.ts
```

#### Testing Task 3.2
```bash
# Test 1: Chat with PII in message
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "What is the salary of john.doe@company.com?"
  }'
# Expected: Response should not contain actual email or salary

# Test 2: Verify Claude context doesn't have PII
# Enable debug logging in chat route
# Check logs for Claude API payload
# Expected: No emails, phones, exact salaries in payload

# Test 3: Analytics query
curl -X POST http://localhost:3000/api/analytics/chat \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message": "Show me employee emails"
  }'
# Expected: Redacted or aggregated data only
```

**Success Criteria:**
- ✅ All PII redacted before Claude API
- ✅ Salary bands used instead of exact amounts
- ✅ Names hashed for anonymization
- ✅ User messages scanned for PII
- ✅ Audit logs track PII redaction
- ✅ GDPR Article 44 compliance achieved

---

### Task 3.3: CSRF Protection (8 hours)

**Priority:** HIGH-04
**Files to Create:** `webapp/lib/security/csrf.ts`, `webapp/middleware.ts`

#### Step 1: Install CSRF Library (5 minutes)
```bash
npm install csrf
npm install @types/csrf
```

#### Step 2: Create CSRF Token Service (3 hours)

**File:** `webapp/lib/security/csrf.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Tokens from 'csrf';

const tokens = new Tokens();
const SECRET_LENGTH = 32;

// Store secrets per session (in production, use Redis)
const sessionSecrets = new Map<string, string>();

/**
 * Generate CSRF secret for session
 */
export function generateCSRFSecret(sessionId: string): string {
  const secret = tokens.secretSync();
  sessionSecrets.set(sessionId, secret);
  return secret;
}

/**
 * Generate CSRF token for secret
 */
export function generateCSRFToken(secret: string): string {
  return tokens.create(secret);
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(secret: string, token: string): boolean {
  return tokens.verify(secret, token);
}

/**
 * CSRF protection middleware
 */
export async function requireCSRFToken(request: NextRequest): Promise<NextResponse | null> {
  // Only check state-changing methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return null; // Allow safe methods
  }

  // Get CSRF token from header or body
  const tokenFromHeader = request.headers.get('x-csrf-token');
  const tokenFromCookie = request.cookies.get('csrf-token')?.value;

  if (!tokenFromHeader) {
    return NextResponse.json({
      success: false,
      error: 'CSRF token required',
      message: 'Missing X-CSRF-Token header',
    }, { status: 403 });
  }

  // Get secret from session
  const sessionId = request.cookies.get('session-id')?.value;
  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: 'Session required',
    }, { status: 401 });
  }

  const secret = sessionSecrets.get(sessionId);
  if (!secret) {
    return NextResponse.json({
      success: false,
      error: 'Invalid session',
    }, { status: 401 });
  }

  // Verify token
  const valid = verifyCSRFToken(secret, tokenFromHeader);
  if (!valid) {
    return NextResponse.json({
      success: false,
      error: 'Invalid CSRF token',
    }, { status: 403 });
  }

  return null; // Token valid, continue
}

/**
 * Set CSRF token in response cookies
 */
export function setCSRFCookie(response: NextResponse, sessionId: string): void {
  const secret = generateCSRFSecret(sessionId);
  const token = generateCSRFToken(secret);

  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}
```

#### Step 3: Update Middleware (2 hours)

**Update:** `webapp/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCSRFToken } from './lib/security/csrf';

export async function middleware(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Check CSRF for API routes (except auth endpoints)
  if (request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/api/auth/')) {
    const csrfResult = await requireCSRFToken(request);
    if (csrfResult) {
      return csrfResult; // CSRF check failed
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### Step 4: Create CSRF Token Endpoint (1 hour)

**File:** `webapp/app/api/csrf/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFSecret, generateCSRFToken, setCSRFCookie } from '@/lib/security/csrf';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';

/**
 * GET /api/csrf
 *
 * Get CSRF token for authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const sessionId = authResult.user.sessionId;
  const secret = generateCSRFSecret(sessionId);
  const token = generateCSRFToken(secret);

  const response = NextResponse.json({
    success: true,
    csrfToken: token,
  });

  // Set CSRF cookie
  setCSRFCookie(response, sessionId);

  return response;
}
```

#### Step 5: Update Client Code (2 hours)

**File:** `webapp/lib/api/client.ts`
```typescript
/**
 * API client with CSRF protection
 */
class APIClient {
  private csrfToken: string | null = null;

  /**
   * Fetch CSRF token
   */
  async getCSRFToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    const response = await fetch('/api/csrf', {
      credentials: 'include',
    });

    const data = await response.json();
    this.csrfToken = data.csrfToken;

    return this.csrfToken;
  }

  /**
   * Make authenticated API request
   */
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    // Add CSRF token for state-changing requests
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(options.method || 'GET')) {
      const csrfToken = await this.getCSRFToken();

      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      };
    }

    // Include credentials
    options.credentials = 'include';

    return fetch(url, options);
  }
}

export const apiClient = new APIClient();
```

#### Testing Task 3.3
```bash
# Test 1: GET request (no CSRF needed)
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}"
# Expected: 200 OK

# Test 2: POST without CSRF token (should fail)
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"employee_id": "EMP999", ...}'
# Expected: 403 Forbidden (missing CSRF token)

# Test 3: POST with CSRF token (should succeed)
CSRF_TOKEN=$(curl -X GET http://localhost:3000/api/csrf \
  -H "Authorization: Bearer ${TOKEN}" \
  -c cookies.txt | jq -r '.csrfToken')

curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}" \
  -b cookies.txt \
  -d '{"employee_id": "EMP999", ...}'
# Expected: 201 Created

# Test 4: POST with invalid CSRF token
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: invalid_token" \
  -d '{"employee_id": "EMP999", ...}'
# Expected: 403 Forbidden
```

**Success Criteria:**
- ✅ CSRF tokens required for state-changing requests
- ✅ Tokens generated per session
- ✅ Tokens validated on each request
- ✅ SameSite=Strict cookie policy
- ✅ Client automatically includes tokens
- ✅ Token refresh on expiry

---

### Task 3.4: Secure Error Handling (8 hours)

**Priority:** HIGH-06
**Files to Create:** `webapp/lib/errors/handler.ts`, `webapp/lib/errors/types.ts`

#### Step 1: Create Error Types (2 hours)

**File:** `webapp/lib/errors/types.ts`
```typescript
export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 1001,
  INVALID_TOKEN = 1002,
  TOKEN_EXPIRED = 1003,

  // Authorization errors (2xxx)
  FORBIDDEN = 2001,
  INSUFFICIENT_PERMISSIONS = 2002,

  // Validation errors (3xxx)
  VALIDATION_FAILED = 3001,
  INVALID_INPUT = 3002,

  // Resource errors (4xxx)
  NOT_FOUND = 4001,
  ALREADY_EXISTS = 4002,

  // System errors (5xxx)
  INTERNAL_ERROR = 5001,
  DATABASE_ERROR = 5002,
  EXTERNAL_SERVICE_ERROR = 5003,

  // Rate limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 6001,
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public userMessage: string, // Safe message for users
    public details?: any, // Internal details (never sent to client)
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      ErrorCode.VALIDATION_FAILED,
      message,
      400,
      'Invalid input provided',
      details
    );
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(
      ErrorCode.UNAUTHORIZED,
      message,
      401,
      'Please sign in to continue',
      undefined
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      ErrorCode.FORBIDDEN,
      message,
      403,
      'You do not have permission to perform this action',
      undefined
    );
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      404,
      'The requested resource was not found',
      undefined
    );
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      429,
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}
```

#### Step 2: Create Error Handler (3 hours)

**File:** `webapp/lib/errors/handler.ts`
```typescript
import { NextResponse } from 'next/server';
import { AppError, ErrorCode } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: ErrorCode;
  errorId: string;
  timestamp: string;
  details?: any; // Only in development
}

/**
 * Format error for client response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error for debugging (but not to client)
  console.error('[Error ID:', errorId + ']', error);

  // Handle known AppError
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.userMessage,
      errorCode: error.code,
      errorId,
      timestamp,
      // Only include details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error.details,
      }),
    };
  }

  // Handle unknown errors (don't leak information)
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again later.',
    errorCode: ErrorCode.INTERNAL_ERROR,
    errorId,
    timestamp,
    // In development, include the actual error
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    }),
  };
}

/**
 * Create error response
 */
export function errorResponse(error: unknown): NextResponse {
  const formatted = formatErrorResponse(error);

  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  }

  return NextResponse.json(formatted, { status: statusCode });
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: unknown): any {
  if (error instanceof AppError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      // Don't log user input that might contain PII
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Stack trace (no PII)
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }

  return { error: String(error) };
}
```

#### Step 3: Update API Routes with Error Handling (3 hours)

**Update:** `webapp/app/api/employees/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { errorResponse } from '@/lib/errors/handler';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} from '@/lib/errors/types';
// ... other imports ...

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    if (!hasPermission(authResult.user, 'employees', 'read')) {
      throw new AuthorizationError('Read permission required');
    }

    const queryResult = validateQuery(request, EmployeeQuerySchema);
    if (!queryResult.success) {
      throw new ValidationError('Invalid query parameters');
    }

    const { sortBy, sortOrder, status, department, search, page, limit } = queryResult.data;

    let employees = await loadEmployeeData();

    // ... filter and sort logic ...

    return NextResponse.json({
      success: true,
      employees: paginatedEmployees,
      pagination: {
        page,
        limit,
        total: employees.length,
        totalPages: Math.ceil(employees.length / limit),
      },
    });

  } catch (error) {
    // Centralized error handling
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    if (!requireRole(authResult.user, 'hr_admin', 'super_admin')) {
      throw new AuthorizationError('Admin role required');
    }

    const bodyResult = await validateBody(request, CreateEmployeeSchema);
    if (!bodyResult.success) {
      throw new ValidationError('Invalid employee data');
    }

    const newEmployee = {
      ...bodyResult.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as MasterEmployeeRecord;

    const employees = await loadEmployeeData();

    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      throw new ValidationError('Employee ID already exists');
    }

    employees.push(newEmployee);
    await saveEmployeeData(employees);

    return NextResponse.json({
      success: true,
      employee: newEmployee
    }, { status: 201 });

  } catch (error) {
    return errorResponse(error);
  }
}
```

#### Testing Task 3.4
```bash
# Test 1: Trigger validation error
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"employee_id": ""}'
# Expected: 400 with user-friendly message, no stack trace

# Test 2: Trigger authorization error
curl -X DELETE http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${ANALYST_TOKEN}" \
  -d '{"employee_ids": ["EMP001"]}'
# Expected: 403 with clear message

# Test 3: Trigger internal error (simulate DB failure)
# Temporarily break data loading
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}"
# Expected: 500 with generic message, error ID for tracking

# Test 4: Check error response format
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer ${TOKEN}" \
  -d 'invalid json'
# Expected: JSON with success=false, errorCode, errorId, timestamp
```

**Success Criteria:**
- ✅ No stack traces in production errors
- ✅ User-friendly error messages
- ✅ Error IDs for support tracking
- ✅ Consistent error response format
- ✅ No PII in error messages
- ✅ Internal errors sanitized

---

### Task 3.5: Path Traversal Prevention (8 hours)

**Priority:** CRITICAL-04
**Files to Modify:** `webapp/app/api/data/upload/route.ts`, `webapp/app/api/data/delete/[fileId]/route.ts`

(Implementation details similar to above tasks...)

---

### Task 3.6: Session Management (16 hours)

**Priority:** HIGH-07
**Files to Create:** `webapp/lib/auth/session.ts`

(Implementation details similar to above tasks...)

---

### Task 3.7: Data Retention Policies (12 hours)

**Priority:** HIGH-09
**Files to Create:** `scripts/data-retention.ts`

(Implementation details similar to above tasks...)

---

### Task 3.8: File Upload Security (12 hours)

**Priority:** HIGH-08
**Files to Modify:** `webapp/app/api/data/upload/route.ts`

(Implementation details similar to above tasks...)

---

## TESTING STRATEGY

### Automated Testing

#### 1. Security Test Suite
**File:** `webapp/__tests__/security/auth.test.ts`
```typescript
import { describe, it, expect } from '@jest/globals';

describe('Authentication Security', () => {
  it('should reject requests without token', async () => {
    const res = await fetch('http://localhost:3000/api/employees');
    expect(res.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const res = await fetch('http://localhost:3000/api/employees', {
      headers: { Authorization: 'Bearer invalid' },
    });
    expect(res.status).toBe(401);
  });

  it('should enforce RBAC', async () => {
    const analystToken = generateToken({ role: 'hr_analyst' });
    const res = await fetch('http://localhost:3000/api/employees', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    expect(res.status).toBe(403);
  });
});
```

#### 2. Vulnerability Scanning
```bash
# Run automated security scans
npm audit --audit-level=high
npm run test:security
npx snyk test
npx retire --path webapp/
```

#### 3. Penetration Testing Checklist
- [ ] SQL injection attempts on all query parameters
- [ ] XSS payloads in all input fields
- [ ] CSRF token bypass attempts
- [ ] Path traversal in file operations
- [ ] Prototype pollution in JSON payloads
- [ ] Rate limit bypass techniques
- [ ] Session hijacking attempts
- [ ] CORS policy violations

---

## SUCCESS CRITERIA

### Phase 1 Success Criteria
- [ ] All API endpoints require authentication
- [ ] JWT tokens validated correctly
- [ ] RBAC enforced on all resources
- [ ] CORS configured with whitelist
- [ ] All security headers present
- [ ] No API keys in client bundle
- [ ] xlsx updated to secure version
- [ ] Zero critical vulnerabilities in `npm audit`

### Phase 2 Success Criteria
- [ ] All inputs validated with Zod
- [ ] SQL injection attempts blocked
- [ ] All API calls logged to audit system
- [ ] PII access tracked in logs
- [ ] Rate limits enforced per user/IP
- [ ] Rate limit headers in responses
- [ ] Prototype pollution attempts rejected
- [ ] XSS payloads sanitized

### Phase 3 Success Criteria
- [ ] Employee data encrypted at rest
- [ ] PII redacted in Claude API calls
- [ ] CSRF tokens validated
- [ ] Error messages don't leak info
- [ ] Path traversal prevented
- [ ] Session expiry working
- [ ] Data retention policies enforced
- [ ] File uploads validated

### Overall Success Criteria
- [ ] Security audit risk reduced from 9.2 to < 3.0
- [ ] GDPR compliance achieved
- [ ] CCPA compliance achieved
- [ ] SOC 2 controls implemented
- [ ] Zero high/critical vulnerabilities
- [ ] Penetration test passed
- [ ] Production deployment successful
- [ ] No security incidents in first 30 days

---

## ROLLBACK PLAN

### Pre-Deployment
1. **Database Backup:** Export all data before deployment
2. **Git Tag:** Create release tag `v1.0.0-security-hardening`
3. **Feature Flags:** Enable gradual rollout
4. **Monitoring:** Set up security dashboards

### Rollback Triggers
- **Critical:** >50% increase in error rate
- **High:** Authentication failures >10%
- **High:** Production outage >5 minutes
- **Medium:** Performance degradation >200ms p95

### Rollback Steps
```bash
# 1. Revert to previous version
git checkout tags/v0.9.0

# 2. Rebuild and deploy
npm run build
npm run deploy:production

# 3. Restore database if needed
./scripts/restore-backup.sh

# 4. Verify rollback
curl http://localhost:3000/api/health
```

### Post-Rollback
1. Analyze failure cause
2. Fix issues in development
3. Re-test thoroughly
4. Schedule new deployment

---

## MONITORING AND ALERTS

### Critical Alerts
```yaml
# DataDog / Prometheus alerts

- name: Failed Authentication Spike
  condition: failed_auth_rate > 100/min
  severity: critical
  notification: pagerduty

- name: SQL Injection Attempt
  condition: sql_validation_failure > 5/min
  severity: critical
  notification: slack, pagerduty

- name: Rate Limit Exceeded Globally
  condition: rate_limit_hits > 1000/min
  severity: high
  notification: slack

- name: PII Access Anomaly
  condition: pii_access_count > 1000/hour for single user
  severity: high
  notification: slack, email
```

---

## TIMELINE SUMMARY

| Phase | Duration | Completion Date |
|-------|----------|-----------------|
| Phase 1: Critical | 2-3 days | Day 3 |
| Phase 2: High Priority | 1 week | Day 10 |
| Phase 3: Important | 2-4 weeks | Day 38 |
| Testing & Validation | 1 week | Day 45 |
| Production Deployment | 3 days | Day 48 |

**Total Project Duration:** 7-8 weeks

---

**Document Version:** 1.0
**Last Updated:** November 4, 2025
**Owner:** Security Engineering Team
**Review Schedule:** Weekly during implementation

---

For questions or clarifications, refer to:
- Original audit: `audit docs/01-Security-Audit-Report.md`
- Security architecture: `docs/SECURITY_ARCHITECTURE.md`
- Compliance requirements: `docs/COMPLIANCE_REQUIREMENTS.md`
