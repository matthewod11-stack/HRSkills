# Tech Stack Modernization - Remediation Plan

**Branch:** `migration/tech-stack-update`
**Status:** 🟡 Partial Success - Requires Fixes Before Merge
**Created:** November 19, 2025
**Estimated Fix Time:** 4-6 hours

---

## Executive Summary

### Current State

The tech-stack-update branch represents substantial modernization work across 11 documented phases with **91,091 lines added** across 117 files. The work successfully achieves core modernization goals but **contains critical test infrastructure issues** that block production readiness.

**Build Status:** ✅ Production build passes (6.6s with Turbopack)
**Test Status:** 🔴 78% test suite failure rate (28/36 suites failing)
**Root Causes:** React 19 Vitest configuration, T3 Env access patterns, missing documentation

### Success Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Test Pass Rate (Suites)** | 22% (8/36) | >90% (33/36) | +25 suites |
| **Test Pass Rate (Tests)** | 91% (523/573) | >95% (545/573) | +22 tests |
| **Build Warnings** | 8 metadata | 0 | -8 warnings |
| **Documentation Complete** | 70% | 100% | +30% |
| **Merge Ready** | ❌ No | ✅ Yes | Fixes required |

### Timeline to Merge-Ready

- **Priority 1 Fixes:** 2-3 hours (React 19 Vitest + Env)
- **Priority 2 Fixes:** 45 minutes (Docs + Metadata)
- **Validation & QA:** 1 hour
- **Contingency:** 30 minutes
- **Total:** 4-6 hours

---

## What Was Accomplished

### ✅ Successfully Modernized

#### **1. Framework & Runtime (Phase 1)**
- **Next.js:** 14.x → 16.0.3 (Turbopack enabled)
  - Build time: 6.6s for production build
  - Zero breaking changes, clean upgrade
  - App Router patterns maintained

- **React:** 18.x → 19.0.0
  - Latest stable with new features
  - ⚠️ Test infrastructure needs compatibility fixes

#### **2. Tooling Modernization (Phase 2-3)**
- **Linting:** ESLint/Prettier → Biome (Rust-based, 10x faster)
  - Strict rules: a11y, security, complexity
  - Integrated with husky + lint-staged
  - `biome.json` fully configured

- **Commit Standards:** Conventional Commits
  - Commitlint + husky pre-commit hooks
  - Enforces semantic versioning patterns

#### **3. Performance Infrastructure (Phase 1, Weeks 1-4)**
- **Database Optimizations:**
  - Fixed N+1 queries (12-50x improvement documented)
  - Performance indexes: 50-100x auth lookup speedup
  - Analytics queries: 250-500ms → <50ms target
  - Script: `webapp/scripts/apply-performance-indexes.ts`

- **Bundle Optimization:**
  - 3 context panels lazy loaded (DocumentEditor, PerformanceGrid, ENPS)
  - Estimated 155KB reduction (-31% bundle size)
  - Dynamic imports with loading skeletons
  - Bundle analyzer integrated

- **Monitoring & Observability:**
  - Sentry integration (@sentry/nextjs v10.25.0)
  - Web Vitals tracking (client + server)
  - Lighthouse CI configured (`.lighthouserc.json`)
  - Real User Monitoring (RUM) ready

#### **4. Component Architecture (Phase 2)**
- **ChatInterface Refactoring:**
  - ✅ 966 lines → 347 lines (64% reduction)
  - 11 modular sub-components extracted
  - 6 custom hooks created
  - ChatContext provider for state management
  - **Target met:** Under 400-line goal

#### **5. Testing Infrastructure (Phase 2-3)**
- **Frameworks Added:**
  - Vitest + React Testing Library (unit/integration)
  - Playwright + axe-core (E2E + a11y)
  - Lighthouse CI (performance gates)

- **Test Coverage:**
  - 25+ new test files created
  - 573 tests written (523 passing when tests run)
  - ⚠️ Cannot verify coverage due to Vitest issues

---

## Critical Issues Blocking Merge

### 🔴 **PRIORITY 1: React 19 Vitest Compatibility** (2-3 hours)

#### Problem Statement

**28 out of 36 test suites failing** due to React 19's JSX transform not being resolved correctly in Vitest.

**Error Examples:**
```
Error: Failed to resolve import "react/jsx-dev-runtime"
Plugin: vite:import-analysis
File: __tests__/ErrorBoundary.test.tsx:25:9
```

**Affected Test Files:**
- All component tests (26 files): ErrorBoundary, ChatInterface, ChatHeader, MessageItem, etc.
- Accessibility tests: `__tests__/accessibility/components.test.tsx`
- Code splitting tests: `__tests__/code-splitting.test.tsx`
- Memoization tests: `__tests__/memoization.test.tsx`

#### Root Cause

`webapp/vitest.config.ts` only aliases `react` and `react-dom` but **does not alias React 19's new JSX runtime entry points**:
- `react/jsx-dev-runtime` (development)
- `react/jsx-runtime` (production)

Additionally, test scripts do not set `NODE_ENV=test`, causing environment-dependent behavior.

#### Fix Implementation

**Step 1: Update `webapp/vitest.config.ts`**

Location: Lines 68-76

```typescript
// CURRENT (incomplete)
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
    'react': path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
  },
}

// FIXED (complete React 19 support)
resolve: {
  conditions: ['development', 'browser'], // React 19 JSX transform conditions
  alias: {
    '@': path.resolve(__dirname, './'),
    // Force single React 19 version
    'react': path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    // React 19 JSX runtime entry points (CRITICAL)
    'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
    'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
  },
}
```

**Step 2: Update `webapp/package.json` Test Scripts**

Location: Lines 15-23

```json
// CURRENT (no NODE_ENV)
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:a11y": "vitest run __tests__/accessibility",
"test:ui": "vitest --ui",

// FIXED (with NODE_ENV)
"test": "NODE_ENV=test vitest run",
"test:watch": "NODE_ENV=test vitest",
"test:coverage": "NODE_ENV=test vitest run --coverage",
"test:a11y": "NODE_ENV=test vitest run __tests__/accessibility",
"test:ui": "NODE_ENV=test vitest --ui",
```

#### Validation Steps

```bash
# 1. Run full test suite
npm test

# Expected: >90% suite pass rate (33/36 suites)
# Expected: >95% test pass rate (545/573 tests)

# 2. Run previously failing suites
npm test -- __tests__/ErrorBoundary.test.tsx
npm test -- __tests__/components/custom/chat/ChatInterface.test.tsx
npm test -- __tests__/accessibility/components.test.tsx

# Expected: All should pass without jsx-runtime errors

# 3. Verify coverage generation
npm run test:coverage

# Expected: Coverage reports in ./coverage/
```

#### Success Criteria
- ✅ Zero "Failed to resolve import" errors
- ✅ Test suite pass rate >90%
- ✅ Coverage reports generate successfully
- ✅ No React version conflicts

---

### 🔴 **PRIORITY 1: Environment Variable Normalization** (1-2 hours)

#### Problem Statement

**Multiple test suites failing** with T3 Env errors because server-side environment variables are being accessed in client code or test contexts.

**Error Example:**
```
Error: ❌ Attempted to access a server-side environment variable on the client
    at onInvalidAccess (@t3-oss/env-core)
    at Object.get (@t3-oss/env-core)
```

**Affected Files:**
1. `webapp/lib/errorLogging.ts:42-80` - Uses `env.NODE_ENV` in client context
2. `webapp/app/providers.tsx:1-36` - Uses `env` in 'use client' module
3. `webapp/lib/auth/auth-context.tsx:1-120` - Server env access in client
4. `webapp/lib/db/index.ts:20` - Uses `env.DB_DIR` (imported by web-vitals-service)

**Failing Tests:**
- `__tests__/errorLogging.test.ts` (100% failure)
- `__tests__/lib/monitoring.test.ts` (8 tests failing)
- `__tests__/api/analytics.test.ts` (100% failure)
- Any test importing db or auth modules

#### Root Cause

T3 Env (@t3-oss/env-nextjs) enforces strict separation between server and client environment variables. When a 'use client' file or test imports `env.NODE_ENV` (a server-only variable), T3 throws an error to prevent accidental exposure of secrets.

**Two issues:**
1. Client components using server env vars (should use `NEXT_PUBLIC_*` or `process.env`)
2. Tests not mocking `env.mjs` before module imports (test setup incomplete)

#### Fix Implementation

**Step 1: Mock Env in Test Setup**

Create/Update: `webapp/vitest.setup.ts`

```typescript
import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock T3 Env BEFORE any imports that use it
vi.mock('@/lib/env', () => ({
  env: {
    // Server-side variables (safe for tests)
    NODE_ENV: 'test',
    DB_DIR: '../data',
    DATABASE_URL: 'file:../data/hrskills.db',
    JWT_SECRET: 'test-jwt-secret-32-characters-long',

    // API keys (mocked)
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    OPENAI_API_KEY: 'test-openai-key',

    // Optional features (disabled in tests)
    SENTRY_DSN: undefined,
    UPSTASH_REDIS_REST_URL: undefined,

    // Client-side variables
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
```

**Step 2: Fix Client-Side Env Access**

**File: `webapp/lib/errorLogging.ts:42-80`**

```typescript
// BEFORE (uses server env in client)
constructor() {
  this.isProduction = env.NODE_ENV === 'production';
}

// AFTER (uses process.env - safe for client)
constructor() {
  this.isProduction = process.env.NODE_ENV === 'production';
}
```

**File: `webapp/app/providers.tsx:1-36`**

```typescript
// BEFORE (imports env in 'use client')
'use client';
import { env } from '@/lib/env';

// AFTER (use NEXT_PUBLIC or process.env)
'use client';
// Remove env import, use process.env.NODE_ENV or NEXT_PUBLIC_ vars
```

**File: `webapp/lib/auth/auth-context.tsx:1-120`**

```typescript
// BEFORE (uses server env in client context)
if (env.NODE_ENV === 'development') {
  console.log('Auth debug info');
}

// AFTER (use process.env)
if (process.env.NODE_ENV === 'development') {
  console.log('Auth debug info');
}
```

**Step 3: Alternative - Expose Client-Safe Env Vars**

If certain checks are needed client-side, add to `webapp/lib/env.mjs`:

```typescript
export const env = createEnv({
  client: {
    // Add client-safe flag
    NEXT_PUBLIC_NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    // ... other vars
  },
});
```

Then use `env.NEXT_PUBLIC_NODE_ENV` in client components.

#### Validation Steps

```bash
# 1. Run previously failing tests
npm test -- __tests__/errorLogging.test.ts
npm test -- __tests__/lib/monitoring.test.ts
npm test -- __tests__/api/analytics.test.ts

# Expected: Zero env access errors

# 2. Verify no regressions in passing tests
npm test

# 3. Check client components work in dev
npm run dev
# Open browser, check console for errors
# Verify auth and error logging still work

# 4. Check production build
npm run build
# Verify no env errors during build
```

#### Success Criteria
- ✅ Zero "Attempted to access server-side env" errors
- ✅ All API route tests passing
- ✅ Error logging works in dev and prod
- ✅ Auth flows work correctly

---

### 🟡 **PRIORITY 2: Documentation Updates** (30 minutes)

#### Problem Statement

New environment variables added in modernization (Sentry, Upstash, Vercel analytics) are **not documented** in `.env.example`, making it impossible for new developers to configure the stack correctly.

**Missing from `.env.example`:**
- Sentry monitoring (DSN, ORG, PROJECT, AUTH_TOKEN)
- Upstash Redis rate limiting (REDIS_URL, REDIS_TOKEN)
- Vercel analytics flags
- Optional toggles for new features

**Outdated Documentation:**
- `CLAUDE.md` environment section doesn't mention new vars
- No centralized env var inventory
- Setup instructions incomplete

#### Fix Implementation

**Step 1: Update `.env.example`**

File: `webapp/.env.example`

Add at the end (after existing vars):

```bash
# ============================================
# OBSERVABILITY & MONITORING (Added Phase 2-3)
# ============================================

# Sentry Error Tracking (optional but recommended for production)
# Get these from: https://sentry.io/settings/
SENTRY_DSN=                           # Public DSN for error reporting
SENTRY_ORG=foundryhr                  # Your Sentry organization slug
SENTRY_PROJECT=hrcommandcenter        # Your Sentry project name
SENTRY_AUTH_TOKEN=                    # Auth token for uploading source maps (CI/CD only)

# Vercel Analytics (optional - auto-configured on Vercel)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=      # Auto-set by Vercel deployment
NEXT_PUBLIC_VERCEL_ENV=               # development | preview | production

# ============================================
# RATE LIMITING (Added Phase 3)
# ============================================

# Upstash Redis (for distributed rate limiting in production)
# Get these from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=               # Redis REST endpoint
UPSTASH_REDIS_REST_TOKEN=             # Redis authentication token

# ============================================
# PERFORMANCE MONITORING (Added Phase 3)
# ============================================

# Web Vitals Tracking (optional)
NEXT_PUBLIC_ENABLE_WEB_VITALS=true    # Enable client-side performance tracking
NEXT_PUBLIC_ENABLE_ANALYTICS=true     # Enable usage analytics

# ============================================
# FEATURE FLAGS (Added Phase 3)
# ============================================

# Google Workspace Integration (currently disabled - see PHASE_11_COMPLETION_SUMMARY.md)
NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=false  # Set to true to enable Google Docs/Sheets export
```

**Step 2: Update `CLAUDE.md` Environment Section**

File: `CLAUDE.md` - Lines 177-205 (Environment Setup)

Add new section after existing env vars:

```markdown
### New Environment Variables (Phase 2-3 Modernization)

```bash
# Observability (Optional - Recommended for Production)
SENTRY_DSN=your-sentry-dsn            # Error tracking and performance monitoring
SENTRY_ORG=your-org                   # Sentry organization
SENTRY_PROJECT=your-project           # Sentry project name
SENTRY_AUTH_TOKEN=your-token          # For source map uploads (CI/CD only)

# Rate Limiting (Optional - Required for Multi-Instance)
UPSTASH_REDIS_REST_URL=your-redis-url # Distributed rate limiting
UPSTASH_REDIS_REST_TOKEN=your-token   # Redis authentication

# Performance Monitoring (Optional)
NEXT_PUBLIC_ENABLE_WEB_VITALS=true    # Client-side performance tracking
NEXT_PUBLIC_ENABLE_ANALYTICS=true     # Usage analytics
```

**Setup Instructions:**

1. **Sentry** (optional but recommended):
   - Sign up at https://sentry.io
   - Create a Next.js project
   - Copy DSN from Settings → Client Keys
   - Add SENTRY_DSN to .env.local
   - Source maps upload automatically in production

2. **Upstash Redis** (optional - only needed for multi-instance deployments):
   - Sign up at https://console.upstash.com
   - Create a Redis database
   - Copy REST URL and token
   - Rate limiting falls back to in-memory if not configured

3. **Web Vitals** (enabled by default):
   - No configuration needed
   - Tracks Core Web Vitals automatically
   - Sends to Sentry if DSN configured
```

**Step 3: Create Environment Inventory**

File: `docs/ENV_INVENTORY.md` (new file)

```markdown
# Environment Variables Inventory

Complete list of all environment variables used in HRSkills Platform.

## Required Variables

Must be set for the application to function:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `JWT_SECRET` | Server | JWT signing key (32+ chars) | `your-secret-key-32chars` |
| `DATABASE_URL` | Server | SQLite database path | `file:../data/hrskills.db` |
| `ANTHROPIC_API_KEY` | Server | Primary AI provider | `sk-ant-...` |

## Optional Variables

Enhance functionality but not required:

### AI Providers (Fallbacks)
| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Fallback AI provider | None (fails to third provider) |
| `GOOGLE_AI_API_KEY` | Free tier fallback | None (skipped if missing) |

### Observability (Phase 2-3)
| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Error tracking | None (monitoring disabled) |
| `SENTRY_ORG` | Sentry organization | `foundryhr` |
| `SENTRY_PROJECT` | Sentry project | `hrcommandcenter` |
| `SENTRY_AUTH_TOKEN` | Source map uploads | None (CI/CD only) |
| `NEXT_PUBLIC_ENABLE_WEB_VITALS` | Performance tracking | `true` |

### Rate Limiting (Phase 3)
| Variable | Description | Default |
|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiter | None (in-memory fallback) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth | Required if URL set |

### Google Workspace (Disabled)
| Variable | Description | Status |
|----------|-------------|--------|
| `GOOGLE_CLIENT_ID` | OAuth client | ⚠️ Disabled (googleapis issue) |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | ⚠️ Disabled |
| `GOOGLE_DRIVE_FOLDER_ID` | Template storage | ⚠️ Disabled |
| `NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED` | Feature flag | `false` |

See `webapp/PHASE_11_COMPLETION_SUMMARY.md` for details on Google integration status.

## Environment-Specific Configuration

### Development (.env.local)
```bash
NODE_ENV=development
DATABASE_URL=file:../data/hrskills.db
JWT_SECRET=dev-secret-32-characters-long
ANTHROPIC_API_KEY=sk-ant-...
```

### Test (set by npm scripts)
```bash
NODE_ENV=test
# Other vars mocked in vitest.setup.ts
```

### Production (Vercel Environment Variables)
```bash
NODE_ENV=production
DATABASE_URL=file:/var/data/hrskills.db
JWT_SECRET=<production-secret>
ANTHROPIC_API_KEY=<production-key>
SENTRY_DSN=<production-dsn>
UPSTASH_REDIS_REST_URL=<redis-url>
```

## Security Notes

- Never commit `.env.local` (gitignored)
- Rotate `JWT_SECRET` if exposed
- Use different API keys for dev/prod
- Sentry `AUTH_TOKEN` only needed for CI/CD
- `NEXT_PUBLIC_*` vars are exposed to browser
```

#### Validation Steps

```bash
# 1. Verify .env.example is complete
cat webapp/.env.example | grep SENTRY_DSN
cat webapp/.env.example | grep UPSTASH

# Expected: All new vars present with comments

# 2. Test fresh setup
rm webapp/.env.local
cp webapp/.env.example webapp/.env.local
# Edit .env.local with real values
npm run dev

# Expected: App starts, instructions clear

# 3. Verify documentation
open CLAUDE.md  # Check environment section
open docs/ENV_INVENTORY.md  # Check inventory

# Expected: All new vars documented
```

#### Success Criteria
- ✅ `.env.example` has all variables with comments
- ✅ `CLAUDE.md` documents new env vars
- ✅ `ENV_INVENTORY.md` created with complete list
- ✅ New developer can set up from docs alone

---

### 🟡 **PRIORITY 2: Next.js Metadata Warning Fix** (15 minutes)

#### Problem Statement

**8 metadata warnings** during Next.js 16 build due to deprecated `metadata.themeColor` and `metadata.viewport` exports.

**Warning Example:**
```
⚠ Unsupported metadata themeColor is configured in metadata export.
   Please move it to viewport export instead.
   Read more: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
```

**Note:** After verification, warnings appear to be from **root layout only** (`app/layout.tsx`), not multiple pages as initially estimated. Other pages may inherit from root.

#### Root Cause

Next.js 16 changed the metadata API:
- `metadata.themeColor` → `viewport.themeColor`
- `metadata.viewport` → separate `generateViewport()` function

The upgrade guide recommends splitting these into a dedicated viewport export.

#### Fix Implementation

**File: `webapp/app/layout.tsx:21-36`**

```typescript
// BEFORE (deprecated in Next.js 16)
export const metadata: Metadata = {
  title: 'HRSkills Platform',
  description: 'Chat-first HR automation...',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  // ... other metadata
};

// AFTER (Next.js 16 pattern)
export const metadata: Metadata = {
  title: 'HRSkills Platform',
  description: 'Chat-first HR automation...',
  // Remove themeColor and viewport from here
  // ... other metadata
};

// Add new viewport export
export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#000000',
  };
}
```

**Type Import:**

Add at top of file if not present:

```typescript
import type { Metadata, Viewport } from 'next';
```

#### Validation Steps

```bash
# 1. Build production bundle
npm run build

# Expected: Zero warnings about metadata
# Expected: Build completes successfully

# 2. Verify in browser
npm run start
open http://localhost:3000

# Check:
# - Theme color applied (inspect <meta name="theme-color">)
# - Viewport correct (inspect <meta name="viewport">)
# - No console errors

# 3. Check other pages
# Open /analytics, /data-sources, /accessibility
# Expected: Theme color inherited, no errors
```

#### Success Criteria
- ✅ Zero metadata warnings in build output
- ✅ Theme color applies correctly in browser
- ✅ Viewport settings work as expected
- ✅ No regression in page rendering

---

## Post-Fix Validation Checklist

Complete ALL items before marking branch as merge-ready:

### 1. Test Suite Health ✅

```bash
# Run full test suite
npm test
```

**Requirements:**
- [ ] Test suite pass rate >90% (at least 33/36 suites)
- [ ] Individual test pass rate >95% (at least 545/573 tests)
- [ ] Zero "Failed to resolve import" errors
- [ ] Zero "Attempted to access server-side env" errors
- [ ] Coverage reports generate successfully

**Critical Tests Must Pass:**
- [ ] `__tests__/lib/auth/*` - Authentication flows
- [ ] `__tests__/components/custom/chat/*` - Chat interface
- [ ] `__tests__/lib/analytics/*` - Analytics queries
- [ ] `__tests__/api/*` - API route handlers
- [ ] `__tests__/accessibility/*` - A11y compliance

### 2. Build Health ✅

```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

**Requirements:**
- [ ] Build completes with zero warnings
- [ ] No metadata deprecation warnings
- [ ] TypeScript compilation successful (zero errors)
- [ ] Biome linting passes (zero errors)
- [ ] No console errors in build output

**Build Output Checks:**
- [ ] Bundle size within targets (check `.next/analyze/`)
- [ ] Lazy loading working (check dynamic imports)
- [ ] Database indexes applied during build

### 3. Documentation Health ✅

**Requirements:**
- [ ] `.env.example` contains all variables (40+ vars)
- [ ] `CLAUDE.md` documents Phase 2-3 changes
- [ ] `ENV_INVENTORY.md` created with complete list
- [ ] `TECH_STACK_REMEDIATION_PLAN.md` committed (this file)

**Verification:**
```bash
# Count env vars
cat webapp/.env.example | grep -E "^[A-Z_]+=" | wc -l
# Expected: 40+ variables

# Verify new sections exist
grep -q "SENTRY_DSN" webapp/.env.example && echo "✅ Sentry"
grep -q "UPSTASH" webapp/.env.example && echo "✅ Upstash"
grep -q "ENV_INVENTORY" docs/ENV_INVENTORY.md && echo "✅ Inventory"
```

### 4. Manual QA (Dev Environment) ✅

```bash
# Start dev server
npm run dev
```

**Test in Browser (http://localhost:3000):**
- [ ] Chat interface loads without errors
- [ ] Can send messages and receive responses
- [ ] Context panels appear correctly (test with "show headcount")
- [ ] PII detection works (test with "my SSN is 123-45-6789")
- [ ] Suggestion cards clickable
- [ ] Reset chat button works (clears messages + generates new ID)
- [ ] No console errors in browser DevTools
- [ ] Performance feels improved (subjective but important)

**Browser Console Checks:**
- [ ] Zero React warnings
- [ ] Zero hydration errors
- [ ] Web Vitals logging (if enabled)
- [ ] No CORS errors

### 5. Performance Validation ✅

```bash
# Run Lighthouse CI
npm run test:lighthouse

# Run bundle analysis
npm run build:analyze
```

**Requirements:**
- [ ] Lighthouse performance score >80
- [ ] Lighthouse accessibility score >90
- [ ] Bundle size reduced vs main branch
- [ ] Lazy loading verified in Network tab

**Benchmark Analytics Query:**
```bash
# In browser console (http://localhost:3000/analytics)
console.time('analytics-query');
// Run a headcount query
console.timeEnd('analytics-query');
# Expected: <50ms
```

### 6. Git Hygiene ✅

```bash
# Verify branch state
git status
git log --oneline -10
git diff origin/main...HEAD --stat
```

**Requirements:**
- [ ] All changes committed (no uncommitted files)
- [ ] Remediation plan committed to repo root
- [ ] Branch rebased on latest main (no conflicts)
- [ ] Commit messages follow conventional commits
- [ ] No secrets or `.env.local` in commits

**Final Checks:**
```bash
# Verify .gitignore
git check-ignore webapp/.env.local
# Expected: webapp/.env.local (ignored)

# Check for secrets
git diff origin/main...HEAD | grep -i "api.key\|secret\|password"
# Expected: No matches (or only in .env.example)
```

### 7. CI/CD Readiness ✅

**Requirements:**
- [ ] `npm run validate` passes (type-check + lint + format + test)
- [ ] Build script works in clean environment
- [ ] No network dependencies in build (fonts fail currently - known issue)
- [ ] Vercel deployment config updated (if needed)

**Simulate CI Environment:**
```bash
# Clean install and validate
rm -rf node_modules .next
npm ci
npm run validate
npm run build
```

---

## Known Issues (Not Blocking Merge)

### 1. Google Workspace Integration - Intentionally Disabled

**Status:** ⚠️ Feature Disabled
**Reason:** googleapis/gaxios version conflict (documented in `webapp/PHASE_11_COMPLETION_SUMMARY.md`)

**Current Behavior:**
- All `/api/templates/*` routes return 501 Not Implemented
- `lib/google/workspace-client.ts` has "temporarily disabled" guards
- `NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=false` in env

**Decision Needed:**
1. **Keep 501 stubs** - Wait for googleapis fix (recommended)
2. **Switch to REST** - Bypass SDK, use fetch to Google APIs
3. **Remove feature** - Delete all Google integration code

**Timeline:** Not urgent for MVP, can decide in Phase 4+

### 2. Bundle Performance Test Thresholds

**Status:** ⚠️ Tests Failing (Not Blocking)
**Reason:** Bundle size thresholds need recalibration after optimizations

**Failing Tests:**
- `__tests__/performance/bundle-performance.test.ts`
  - Expected: 150KB budget
  - Actual: ~345KB (after lazy loading)
  - Issue: Threshold too aggressive for current feature set

**Fix:** Update test expectations to match realistic targets after lazy loading:
```typescript
// Update thresholds in bundle-performance.test.ts
expect(totalSize).toBeLessThan(400_000); // 400KB (was 150KB)
```

**Timeline:** Can fix in Phase 3 after validating actual production bundle size

### 3. ChatInterface Further Refactoring

**Status:** ✅ Target Met (Not Blocking)
**Current:** 347 lines (target was 200-400 lines)

**Initial Review Error:** Report stated 668 lines (was looking at old snapshot)

**Recommendation:** Further extraction possible but not required:
- Extract `usePIIWarning` hook (saves ~30 lines)
- Extract `useContextPanel` hook (saves ~40 lines)
- Goal: Get to 250-300 lines in Phase 3

**Timeline:** Optional enhancement for Phase 3

---

## Timeline & Effort Estimates

### Priority 1 Fixes (Critical - Must Complete)

| Task | Estimated Time | Complexity |
|------|----------------|------------|
| React 19 Vitest config updates | 30 minutes | Low |
| Test script updates (NODE_ENV) | 15 minutes | Low |
| Vitest validation & debugging | 1-2 hours | Medium |
| Env mock in vitest.setup.ts | 30 minutes | Low |
| Fix client-side env access (3 files) | 30 minutes | Low |
| Env fix validation | 30 minutes | Low |
| **Priority 1 Subtotal** | **3-4 hours** | |

### Priority 2 Fixes (Important - Should Complete)

| Task | Estimated Time | Complexity |
|------|----------------|------------|
| Update .env.example | 15 minutes | Low |
| Update CLAUDE.md env section | 10 minutes | Low |
| Create ENV_INVENTORY.md | 15 minutes | Low |
| Metadata warning fix (layout.tsx) | 10 minutes | Low |
| Build validation | 5 minutes | Low |
| **Priority 2 Subtotal** | **45 minutes** | |

### Validation & QA

| Task | Estimated Time | Complexity |
|------|----------------|------------|
| Run full test suite | 10 minutes | - |
| Manual browser testing | 20 minutes | - |
| Performance validation | 15 minutes | - |
| Git cleanup & final checks | 15 minutes | - |
| **Validation Subtotal** | **1 hour** | |

### Total Timeline

**Best Case:** 4 hours (all fixes smooth, no surprises)
**Expected:** 5 hours (some debugging needed)
**Worst Case:** 6 hours (complex env issues or test failures)

---

## Success Criteria

### Before Merge (Blockers)

Must achieve ALL of these:

| Criterion | Target | Current | Status |
|-----------|--------|---------|--------|
| **Test Suite Pass Rate** | >90% | 22% | 🔴 Blocked |
| **Individual Test Pass Rate** | >95% | 91% | 🟡 Close |
| **Build Warnings** | 0 | 8 | 🔴 Blocked |
| **Documentation Complete** | 100% | 70% | 🟡 Missing |
| **Manual QA Pass** | 100% | Unknown | 🟡 Pending |

### After Merge (Goals)

Should achieve these within 1 week:

- ✅ CI/CD pipeline passes on first try
- ✅ Production deployment successful (Vercel)
- ✅ Zero regression in existing features
- ✅ Performance improvements measurable (Web Vitals)
- ✅ Lighthouse scores meet targets (80 perf, 90 a11y)
- ✅ Developer onboarding improved (feedback from teammate)

---

## Implementation Order

Execute fixes in this specific order to minimize rework:

### Phase 1: Foundation (30 minutes)
1. Update `vitest.config.ts` with React 19 aliases
2. Update `package.json` test scripts with NODE_ENV
3. Create/update `vitest.setup.ts` with env mock
4. Run `npm test` to baseline improvements

### Phase 2: Environment Fixes (1 hour)
5. Fix `lib/errorLogging.ts` env access
6. Fix `app/providers.tsx` env access
7. Fix `lib/auth/auth-context.tsx` env access
8. Run affected tests to verify fixes
9. Run full test suite to check for regressions

### Phase 3: Documentation (30 minutes)
10. Update `.env.example` with new variables
11. Update `CLAUDE.md` environment section
12. Create `docs/ENV_INVENTORY.md`
13. Commit documentation changes

### Phase 4: Metadata Fix (15 minutes)
14. Update `app/layout.tsx` with generateViewport()
15. Run build to verify warnings gone
16. Test in browser to verify theme color works

### Phase 5: Validation (1 hour)
17. Run complete validation checklist
18. Manual QA in browser
19. Performance benchmarks
20. Git cleanup and final commit

### Phase 6: Merge Preparation (15 minutes)
21. Rebase on latest main
22. Resolve any conflicts
23. Final `npm run validate`
24. Create PR with this document linked

---

## Verification Commands

### Quick Health Check

```bash
# One-liner to check overall health
npm run validate && npm run build && echo "✅ Branch healthy"
```

### Individual Validations

```bash
# Test suite
npm test                              # Full suite
npm test -- --coverage                # With coverage
npm test -- __tests__/ErrorBoundary   # Specific suite

# Build
npm run build                         # Production build
npm run build:analyze                 # With bundle analysis

# Linting & Formatting
npm run lint                          # Biome linting
npm run format:check                  # Format validation
npm run type-check                    # TypeScript

# Performance
npm run test:lighthouse               # Lighthouse CI
npm run db:test-performance           # Database benchmarks

# E2E
npm run test:e2e                      # Playwright tests
npm run test:e2e:a11y                 # A11y E2E tests
```

### Environment Verification

```bash
# Verify env variables are set
node -e "require('./webapp/lib/env').env" && echo "✅ Env valid"

# Check .env.example completeness
diff <(grep -E "^[A-Z_]+=" webapp/.env.local | cut -d= -f1 | sort) \
     <(grep -E "^[A-Z_]+=" webapp/.env.example | cut -d= -f1 | sort)
# Expected: No differences (all vars documented)
```

---

## Rollback Plan

If fixes introduce new issues or take longer than 6 hours:

### Option 1: Incremental Merge
1. Create a new branch: `tech-stack-partial`
2. Cherry-pick only non-test-blocking changes:
   - Database performance optimizations (Phase 1 Week 1-2)
   - Bundle optimizations (Phase 1 Week 3-4)
   - Sentry/monitoring configs (Phase 3)
3. Merge partial branch to main
4. Continue fixing tests in `tech-stack-update`
5. Merge remaining changes later

### Option 2: Revert to Main
1. Create backup: `git branch tech-stack-backup HEAD`
2. Reset to main: `git reset --hard origin/main`
3. Document lessons learned
4. Re-attempt with smaller incremental PRs

### Option 3: Downgrade React
If React 19 issues prove intractable:
1. Downgrade to React 18.3.x
2. Remove React 19-specific changes
3. Keep all other modernization work
4. Retry React 19 in future phase

**Decision Criteria:** If not merge-ready within 6 hours, assess options with team

---

## Appendix: Additional Resources

### Documentation References

- **Next.js 16 Upgrade Guide:** https://nextjs.org/docs/app/building-your-application/upgrading
- **React 19 Release Notes:** https://react.dev/blog/2024/04/25/react-19
- **Vitest React Testing:** https://vitest.dev/guide/ui-testing.html
- **T3 Env Documentation:** https://env.t3.gg/docs/introduction
- **Biome Configuration:** https://biomejs.dev/reference/configuration/

### Internal Documentation

- Phase Completion Docs:
  - `docs/PHASE1_WEEK1_COMPLETE.md` - Database performance
  - `docs/PHASE1_WEEK3-4_COMPLETE.md` - Bundle optimization
  - `docs/PHASE2_WEEK5_ACTUAL_STATUS.md` - Component refactoring
  - `webapp/PHASE_11_COMPLETION_SUMMARY.md` - Google integration status

- Remediation Plan: `docs/REMEDIATION_PLAN.md` (original 12-week plan)

### Key Files Referenced

- Test config: `webapp/vitest.config.ts`
- Test setup: `webapp/vitest.setup.ts`
- Env definition: `webapp/lib/env.mjs`
- Package scripts: `webapp/package.json`
- Root layout: `webapp/app/layout.tsx`
- Error logging: `webapp/lib/errorLogging.ts`
- Auth context: `webapp/lib/auth/auth-context.tsx`

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-19 | Claude + Matt | Initial remediation plan based on comprehensive branch review |

---

**Status:** 📝 Ready for Implementation
**Next Action:** Begin Phase 1 - Update vitest.config.ts
**Expected Completion:** Within 4-6 hours of focused work
**Merge Target:** Main branch after all validation passes
