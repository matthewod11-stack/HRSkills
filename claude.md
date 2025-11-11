# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** 2025-11-11
**Platform Version:** 0.2.0
**Status:** Production-Ready (Phase 3.2 Complete + Cleanup)

---

## 🎯 What You're Working With

This is a **chat-first HR automation platform** powered by Claude AI with:
- **25 Claude Skills** - Domain-specific HR capabilities (in `/skills/`) - optimized Nov 2025
- **Multi-Provider AI** - Automatic failover: Anthropic → OpenAI → Gemini (99.9% uptime)
- **SQLite + Drizzle ORM** - Type-safe database with sub-50ms analytics queries
- **Next.js 14** - Full-stack TypeScript with App Router
- **Dynamic Context Panels** - Chat-driven UI (no sidebar navigation)

**Core Architecture:**
```
Chat Interface → AI Router → SQLite Database → Google Workspace
     ↓              ↓             ↓                ↓
Context Panels  Failover   Type-safe ORM    Drive/Docs/Sheets
```

---

## 🤖 Custom Agents (Use These When Appropriate)

You have access to specialized agents that should be invoked proactively for specific tasks:

### When to Use Built-in Agents

**Code Quality & Security:**
- **code-review-quality** - Use after implementing features, before commits, when user asks to "review", "check", or "audit" code
- **security-auditor** - Use when handling PII/HR data, implementing auth, before production deploys, integrating third-party services
- **performance-profiler** - Use when optimizing queries, implementing new features with database access, investigating slow performance

**Documentation & Testing:**
- **docs-sync-checker** - Use after adding new API endpoints, modifying features, before merging PRs
- **test-generator** - Use after writing new utilities/functions, creating new API routes, refactoring components
- **accessibility-auditor** - Use after creating/modifying React components, implementing new UI features, before releases

**React & Architecture:**
- **react-component-refactor** - Use when code reviews reveal duplication, prop drilling >3 levels, components >300 lines
- **state-refactor-architect** - Use when implementing features with shared state, performance issues from re-renders, considering Zustand migration

**Infrastructure:**
- **dockerfile-cicd-engineer** - Use when setting up deployment, optimizing Docker builds, implementing CI/CD pipelines
- **dependency-audit** - Use monthly, after security advisories, before major releases, when adding new dependencies

### Example Usage Triggers

```
User: "I just added a new employee export feature"
→ Invoke: code-review-quality, security-auditor (PII handling), test-generator

User: "Review this authentication middleware I wrote"
→ Invoke: security-auditor, code-review-quality

User: "The analytics dashboard is slow"
→ Invoke: performance-profiler

User: "I refactored the chat components"
→ Invoke: react-component-refactor, accessibility-auditor, test-generator

User: "Added new /api/payroll endpoint"
→ Invoke: docs-sync-checker, security-auditor (sensitive data), test-generator
```

### Agent Invocation Best Practices

1. **Be Proactive** - Don't wait for user to ask, invoke when patterns match
2. **Combine Agents** - Run multiple in parallel when relevant (e.g., security + code review)
3. **Context Matters** - This is an HR platform with PII, so security-auditor should be frequently used
4. **Before Commits** - Always consider code-review-quality before git commits

---

## ⚡ Quick Commands Reference

```bash
# Development (run from /webapp)
npm run dev              # Start dev server → http://localhost:3000
npm run build            # Production build
npm run type-check       # TypeScript validation
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run validate         # All checks (type + lint + test)

# Database (run from /webapp)
npm run migrate:json-to-sqlite        # Migrate JSON → SQLite
npm run migrate:json-to-sqlite -- --demo   # Generate 100 demo employees
npm run db:stats                      # Database statistics

# Testing (run from /webapp)
npm test                 # Unit tests (Jest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests (Playwright)
npm run test:a11y        # Accessibility tests
npm run test:all         # All tests

# Code Quality (run from /webapp)
npm run format           # Prettier formatting
npm run clean            # Clean build artifacts
```

---

## 🏗️ Critical Architecture Patterns

### 1. Chat & Skill System

**Skill Detection:** `/webapp/app/api/chat/route.ts:60-150`

Skills are auto-detected via keyword matching. To add a new skill:

1. Create skill directory:
   ```bash
   mkdir -p skills/my-skill/references
   ```

2. Create `skills/my-skill/SKILL.md`:
   ```markdown
   ---
   name: my-skill
   description: What this skill does
   ---
   # Instructions for Claude
   You are an expert in...
   ```

3. Add detection pattern in `/webapp/app/api/chat/route.ts`:
   ```typescript
   if (/relevant|keywords/.test(messageLower)) {
     return 'my-skill'
   }
   ```

### 2. Database Queries (Drizzle ORM)

**ALWAYS use Drizzle ORM, NEVER raw SQL:**

```typescript
// ✅ CORRECT: Type-safe Drizzle query
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { employeesTable } from '@/db/schema'

const employees = await db.select()
  .from(employeesTable)
  .where(eq(employeesTable.status, 'active'))

// ❌ WRONG: Raw SQL
const employees = await db.run('SELECT * FROM employees WHERE status = "active"')
```

**Key Files:**
- Schema: `/webapp/db/schema.ts` (10 tables)
- Client: `/webapp/lib/db/index.ts` (singleton instance)
- Analytics: `/webapp/lib/analytics/headcount-sql.ts`, `attrition-sql.ts`

### 3. Multi-Provider AI Router

**ALWAYS use aiRouter, NEVER direct provider calls:**

```typescript
// ✅ CORRECT: Multi-provider with failover
import { aiRouter } from '@/lib/ai/router'

const response = await aiRouter.chat(messages, {
  temperature: 0.7,
  max_tokens: 2048
})
// Automatically tries: Anthropic → OpenAI → Gemini

// ❌ WRONG: Direct provider call (no failover)
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const response = await anthropic.messages.create(...)
```

**Implementation:** `/webapp/lib/ai/router.ts` (352 lines)

### 4. API Route Pattern

**ALWAYS follow this structure for new API routes:**

```typescript
// /webapp/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.STANDARD)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
  }

  // 3. Authorization (if needed)
  if (!hasPermission(authResult.user, 'resource', 'action')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Business logic with error handling
  try {
    const result = await doSomething()
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, 'Operation failed')
  }
}
```

### 5. Error Handling

**ALWAYS use centralized error handling:**

```typescript
// ✅ CORRECT: Use helpers
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'

try {
  const result = await operation()
  return createSuccessResponse(result)
} catch (error) {
  return handleApiError(error, 'Operation failed')
}

// ❌ WRONG: Manual error handling
try {
  const result = await operation()
  return NextResponse.json({ data: result })
} catch (error) {
  console.error(error)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
```

### 6. Form Validation with Zod

**ALWAYS validate inputs with Zod schemas:**

```typescript
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
  department: z.enum(['Engineering', 'Sales', 'Marketing'])
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

---

## 🚨 Critical "Don't Do" Rules

### Security & Data

1. **NEVER commit API keys or secrets**
   - Use `.env.local` (gitignored)
   - Never hardcode credentials

2. **NEVER bypass authentication**
   - Always use `requireAuth()` middleware
   - Always check `hasPermission()` for protected operations

3. **NEVER skip input validation**
   - Always validate with Zod schemas
   - Never trust user input

4. **NEVER use SQL injection-prone patterns**
   - Use Drizzle ORM exclusively
   - Never concatenate user input into queries

### Code Quality

5. **NEVER use `any` types**
   - Use proper TypeScript types
   - Use Zod for runtime validation when needed

6. **NEVER skip error handling**
   - Always use try/catch
   - Always use `handleApiError()` in API routes

7. **NEVER modify these core files without understanding full impact:**
   - `/webapp/lib/ai/router.ts` - Multi-provider routing logic
   - `/webapp/db/schema.ts` - Database schema (requires migration)
   - `/webapp/lib/auth/middleware.ts` - Authentication/authorization
   - `/webapp/app/api/chat/route.ts` - Core chat routing

### Architecture

8. **NEVER create direct AI provider calls**
   - Always use `aiRouter` for automatic failover
   - Never import `@anthropic-ai/sdk`, `openai`, or `@google/generative-ai` directly

9. **NEVER use JSON file storage for new features**
   - Use SQLite database with Drizzle ORM
   - `/data/master-employees.json` is legacy (deprecated)

10. **NEVER skip testing**
    - Write unit tests for utilities
    - Write integration tests for API routes
    - Write E2E tests for user flows

---

## 📂 Critical File Locations

### Core Files (Read First)

```
/webapp/
├── app/
│   ├── api/chat/route.ts              # Main chat endpoint + skill routing
│   ├── api/analytics/route.ts         # Unified analytics API
│   └── page.tsx                       # Chat-first dashboard UI
│
├── components/custom/
│   ├── ChatInterface.tsx              # Main chat UI
│   ├── ContextPanel.tsx               # Dynamic panel container
│   ├── DocumentEditorPanel.tsx        # Document editing
│   ├── AnalyticsChartPanel.tsx        # Chart visualizations
│   └── PerformanceGridPanel.tsx       # 9-box performance grid
│
├── lib/
│   ├── ai/router.ts                   # Multi-provider AI routing
│   ├── db/index.ts                    # Database client (singleton)
│   ├── auth/middleware.ts             # JWT + RBAC
│   ├── analytics/                     # SQL-based analytics
│   │   ├── headcount-sql.ts
│   │   ├── attrition-sql.ts
│   │   └── performance-calculator.ts
│   └── workflows/
│       └── context-detector.ts        # Pattern matching for panels
│
└── db/schema.ts                       # 10 database tables (Drizzle)
```

### Skills (25 Total - Optimized Nov 2025)

```
/skills/
├── hr-document-generator/             # Offer letters, PIPs, termination
├── job-description-writer/            # JD generation
├── interview-guide-creator/           # Interview scorecards
├── performance-insights-analyst/      # Review synthesis
├── hr-metrics-analyst/                # Analytics & dashboards
├── survey-analyzer-action-planner/    # Surveys (consolidated: 4→2 files)
├── recognition-rewards-manager/       # Recognition (consolidated: 4→1 file)
├── benefits-leave-coordinator/        # Benefits/leave (consolidated: 4→2 files)
└── ... (17 more skills)

See /skills/SKILLS_INDEX.md for complete list with workflow mappings
```

### Documentation

```
/docs/
├── guides/
│   ├── DEVELOPMENT_SETUP.md           # Complete setup guide
│   ├── TESTING_GUIDE.md               # Testing strategy
│   └── CONTRIBUTING.md                # Development workflow
│
├── api/API_REFERENCE.md               # All 25+ endpoints
├── architecture/ARCHITECTURE_DECISIONS.md  # Technical decisions
└── phases/PHASE_2_COMPLETE.md         # Phase 2 implementation details
```

---

## 🔍 Common Development Tasks

### Adding a New API Endpoint

1. Create route file: `/webapp/app/api/my-endpoint/route.ts`
2. Follow the API route pattern (see section above)
3. Add to `/docs/api/API_REFERENCE.md`
4. Write tests in `/__tests__/api/my-endpoint.test.ts`

### Modifying Employee Data Schema

1. Update `/webapp/db/schema.ts` (Drizzle schema)
2. Run migration: `npm run migrate:json-to-sqlite`
3. Update TypeScript types in `/webapp/lib/types/master-employee.ts`
4. Update UI components (EmployeeTable, etc.)
5. Update documentation (CLAUDE.md, API_REFERENCE.md)

### Adding a New Context Panel

1. Create component in `/webapp/components/custom/`
2. Add detection pattern in `/webapp/lib/workflows/context-detector.ts`
3. Update panel routing in `/webapp/components/custom/ContextPanel.tsx`
4. Test chat queries trigger the panel correctly

### Debugging Common Issues

**"Skill not detected"**
- Check keyword patterns in `/webapp/app/api/chat/route.ts:60-150`
- Verify SKILL.md exists in `/skills/{skill-name}/`
- Skill names are case-sensitive

**"Rate limit exceeded"**
- Check rate limit preset in API route
- Adjust in `/webapp/lib/security/rate-limiter.ts`
- Restart server to clear cache

**"Authentication failed"**
- Check JWT token expiry (8 hours)
- Verify `JWT_SECRET` in `.env.local`
- Use demo token: POST `/api/auth/demo-token`

**"Database query slow"**
- Check indexes in `/webapp/db/schema.ts`
- Use `.explain()` with Drizzle to analyze query plan
- Target <50ms for analytics queries

**"AI provider errors"**
- Check provider health at `/settings`
- Verify API keys in `.env.local`
- Check failover chain works (Anthropic → OpenAI → Gemini)
- Review `/webapp/lib/ai/router.ts` for routing logic

---

## 🎓 Architecture Principles (Must Follow)

1. **Type Safety Everywhere**
   - TypeScript + Zod validation + Drizzle ORM
   - No `any` types

2. **Multi-Provider Resilience**
   - Always use `aiRouter`
   - Automatic failover for 99.9% uptime

3. **Database First**
   - SQLite with Drizzle ORM for all persistence
   - Indexed queries for <50ms performance
   - WAL mode for concurrent access

4. **Security by Default**
   - JWT auth on all protected endpoints
   - RBAC checks for every operation
   - Rate limiting on all public routes
   - Audit logging for data modifications

5. **Chat-First UX**
   - Zero navigation clicks
   - Context panels appear dynamically
   - Server-side pattern matching (70% confidence)

6. **Accessibility Mandatory**
   - WCAG 2.1 AA compliance
   - Test with jest-axe + Playwright
   - Keyboard navigation for all features

7. **Testing Required**
   - Unit tests for utilities
   - Integration tests for API routes
   - E2E tests for user flows
   - Accessibility tests for UI changes

---

## 📡 Consolidated API Endpoints (Phase 3.5)

**Last Updated:** November 11, 2025

### Key Consolidations

Phase 3.5 simplified the API surface from 47 endpoints to ~38 by consolidating related operations:

#### 1. AI Services (9 endpoints → 3)

**Use `/api/ai/analyze` for all analysis operations:**
```typescript
// ✅ CORRECT: Unified endpoint
const sentiment = await fetch('/api/ai/analyze', {
  method: 'POST',
  body: JSON.stringify({
    type: 'sentiment',
    text: 'Great employee feedback!'
  })
})

const entities = await fetch('/api/ai/analyze', {
  method: 'POST',
  body: JSON.stringify({
    type: 'entities',
    text: 'Sarah from Engineering in NYC'
  })
})

// ❌ WRONG: Old individual endpoints (deleted)
// await fetch('/api/ai/analyze-sentiment', ...)
// await fetch('/api/ai/extract-entities', ...)
```

**Use `/api/ai/transform` for transformations:**
```typescript
// ✅ CORRECT: Unified transformation endpoint
const translation = await fetch('/api/ai/transform', {
  method: 'POST',
  body: JSON.stringify({
    type: 'translate',
    text: 'Hello',
    targetLanguage: 'Spanish'
  })
})

// ❌ WRONG: Old endpoint (deleted)
// await fetch('/api/ai/translate', ...)
```

**Supported Analysis Types:**
- `sentiment` - Sentiment analysis
- `entities` - Entity extraction
- `language` - Language detection
- `classification` - Text classification
- `summarization` - Text summarization

**Supported Transform Types:**
- `translate` - Translation (implemented)
- `transcribe` - Audio transcription (planned)
- `ocr` - OCR processing (planned)

#### 2. Metrics (4 endpoints → 1)

**Use `/api/metrics` with query parameters:**
```typescript
// ✅ CORRECT: Unified metrics endpoint
const dashboard = await fetch('/api/metrics') // Default: dashboard
const headcount = await fetch('/api/metrics?type=headcount')
const details = await fetch('/api/metrics?type=headcount&details=true')
const aiCosts = await fetch('/api/metrics?type=ai-costs')

// ❌ WRONG: Old individual endpoints (deleted)
// await fetch('/api/metrics/details?metric=headcount')
// await fetch('/api/metrics/ai-costs')
```

**Supported Metric Types:**
- `dashboard` - Summary metrics (default)
- `headcount` - Headcount data
- `attrition` - Attrition data
- `openPositions` - Open positions
- `ai-costs` - AI cost tracking
- `performance` - System performance

**Query Parameters:**
- `type` - Metric type (default: 'dashboard')
- `details` - Include drill-down data (default: false)

#### 3. Monitoring (Renamed from Performance)

**Use `/api/monitoring` for system metrics:**
```typescript
// ✅ CORRECT: New monitoring endpoint
const systemMetrics = await fetch('/api/monitoring?period=60')

// ❌ WRONG: Old endpoint name (deleted)
// await fetch('/api/performance', ...)
```

**Note:** HR performance analysis stays at `/api/performance/analyze`

#### Quick Reference Table

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `/api/ai/analyze-sentiment` | `/api/ai/analyze?type=sentiment` | Unified |
| `/api/ai/extract-entities` | `/api/ai/analyze?type=entities` | Unified |
| `/api/ai/detect-language` | `/api/ai/analyze?type=language` | Unified |
| `/api/ai/translate` | `/api/ai/transform?type=translate` | Unified |
| `/api/metrics/details` | `/api/metrics?type=X&details=true` | Unified |
| `/api/metrics/ai-costs` | `/api/metrics?type=ai-costs` | Unified |
| `/api/performance` (system) | `/api/monitoring` | Renamed |
| `/api/performance/analyze` (HR) | `/api/performance/analyze` | Unchanged |

### Frontend Component Updates

**Components using old endpoints were updated:**
- `MetricDetailsDialog.tsx` → Now uses `/api/metrics?type=X&details=true`
- `AIMetricsDashboard.tsx` → Now uses `/api/metrics?type=ai-costs`

---

## 🔑 Environment Variables

**Minimum Required (set in .env.local):**

```bash
# At least ONE AI provider (Anthropic recommended)
ANTHROPIC_API_KEY=sk-ant-...           # Primary AI provider
OPENAI_API_KEY=sk-...                  # Fallback (optional)
GEMINI_API_KEY=...                     # Free tier fallback (optional)

# Authentication
JWT_SECRET=your-secret-key-32chars     # JWT signing (32+ chars)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database
DATABASE_URL=file:../data/hrskills.db  # SQLite path
```

**Optional (Google Workspace):**

```bash
GOOGLE_CLIENT_ID=...                   # OAuth 2.0 client
GOOGLE_CLIENT_SECRET=...               # OAuth 2.0 secret
GOOGLE_DRIVE_FOLDER_ID=...            # Template storage
NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=true
```

---

## 📊 Database Schema Overview

**10 Normalized Tables:**

1. **employees** - Core employee data (employee_id, name, department, status)
2. **employee_metrics** - Performance tracking (flight_risk, engagement_score)
3. **performance_reviews** - Review history with ratings
4. **ai_usage** - AI provider usage tracking + costs
5. **audit_logs** - Security and compliance logs
6. **user_sessions** - JWT session tracking
7. **user_preferences** - User settings + OAuth tokens (encrypted)
8. **data_sources** - CSV upload metadata
9. **email_queue** - Async email sending
10. **dlp_scans** - PII detection logs

**Schema Definition:** `/webapp/db/schema.ts` (546 lines)
**Client:** `/webapp/lib/db/index.ts` (singleton with connection pooling)

---

## 🧪 Testing Guidelines

### Unit Tests (Jest)

```typescript
// Example: /webapp/__tests__/lib/analytics/performance-calculator.test.ts
import { calculatePerformanceScore } from '@/lib/analytics/performance-calculator'

describe('Performance Calculator', () => {
  it('should calculate performance score', () => {
    const employee = { /* test data */ }
    const score = calculatePerformanceScore(employee)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(5)
  })
})
```

### E2E Tests (Playwright)

```typescript
// Example: /webapp/e2e/chat.spec.ts
import { test, expect } from '@playwright/test'

test('should display analytics panel', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.fill('[data-testid="chat-input"]', 'Show me headcount')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('[data-testid="analytics-panel"]')).toBeVisible()
})
```

### Accessibility Tests

```typescript
// Example: /webapp/__tests__/accessibility/chat-interface.test.tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import ChatInterface from '@/components/custom/ChatInterface'

test('ChatInterface has no a11y violations', async () => {
  const { container } = render(<ChatInterface />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 🚀 Recent Changes (Context for New Tasks)

### Phase 3.2 (Nov 2025) - Chat-First Dashboard ✅

**What Changed:**
- Removed sidebar navigation completely
- Built 3 dynamic context panels (document, analytics, performance)
- Server-side pattern matching with 70% confidence threshold
- AI-powered performance scoring algorithm
- ~2,000 lines of new code

**Key Files:**
- `/webapp/app/page.tsx` - New 50/50 layout
- `/webapp/components/custom/ContextPanel.tsx` - Panel container
- `/webapp/lib/workflows/context-detector.ts` - Pattern matching
- `/webapp/lib/analytics/performance-calculator.ts` - AI scoring

### Phase 2 (Nov 2025) - Platform Modernization ✅

**What Changed:**
- Migrated from JSON to SQLite with Drizzle ORM
- Built multi-provider AI router (Anthropic → OpenAI → Gemini)
- Removed Python dependencies (Node.js only)
- Simplified Google integration to OAuth 2.0 only
- Net -1,500 lines through architectural cleanup

**Key Files:**
- `/webapp/lib/ai/router.ts` - Multi-provider routing (352 lines)
- `/webapp/lib/db/index.ts` - Database client (247 lines)
- `/webapp/db/schema.ts` - Complete schema (546 lines)

### Codebase Cleanup (Nov 11, 2025) ✅

**What Changed:**
- Removed 5 disabled/deprecated files (517 lines of dead hooks code)
- Deleted `deprecated-routes/` directory (800 lines of old Vertex AI endpoints)
- Deleted backup files and test endpoints
- Configured ESLint with Next.js core-web-vitals standards
- Applied Prettier formatting across 215 files
- Cleaned webpack cache artifacts

**Impact:**
- Removed ~1,700 lines of unused code
- Established code quality standards with ESLint
- Consistent code formatting with Prettier
- Cleaner repository structure

**Files Removed:**
- `webapp/lib/hooks/useDebounce.ts.disabled`
- `webapp/lib/hooks/useAsync.ts.disabled`
- `webapp/deprecated-routes/` (entire directory)
- `webapp/components/custom/EmployeeTableEditor.original.tsx`
- `webapp/app/api/test-env/` (test endpoint)

**Configuration Added:**
- `/webapp/.eslintrc.json` - ESLint configuration with Next.js standards

---

## 📝 Notes for Claude Instances

### When You're Asked to Add Features

1. **Check existing patterns first** - Search similar features before implementing
2. **Follow the architecture principles** above - No exceptions
3. **Update types in `/webapp/lib/types/`** - Keep TypeScript happy
4. **Write tests** - Unit + E2E coverage required
5. **Update documentation** - Keep CLAUDE.md and API_REFERENCE.md current
6. **Consider RBAC** - What permissions does this need?
7. **Test accessibility** - Run `npm run test:a11y`

### When You're Debugging

1. **Check authentication first** - 80% of API issues are auth-related
2. **Verify environment variables** - Check `.env.local` exists and is complete
3. **Review git history** - `git log --oneline -10` for recent context
4. **Check provider health** - Visit `/settings` for AI provider status
5. **Use performance monitoring** - Import `trackMetric` from `@/lib/performance-monitor`

### When You're Refactoring

1. **Run tests in watch mode** - `npm run test:watch` during refactor
2. **Make small commits** - Easier to debug and rollback
3. **Update docs inline** - Don't leave for later
4. **Check dependencies** - Update imports across codebase
5. **Measure performance** - Before/after metrics for major changes

---

## 🆘 Emergency Reference

**App not starting?**
```bash
cd webapp
npm install      # Reinstall dependencies
npm run clean    # Clean build cache
npm run dev      # Start fresh
```

**Database corrupted?**
```bash
cd webapp
npm run migrate:json-to-sqlite -- --demo  # Recreate with demo data
```

**All tests failing?**
```bash
cd webapp
npm run clean
npm install
npm run type-check  # Fix TypeScript errors first
npm run lint:fix    # Auto-fix linting
npm test           # Run tests again
```

**AI providers down?**
- Check `/settings` for health status
- Verify API keys in `.env.local`
- Check Anthropic console: https://console.anthropic.com/
- Check OpenAI dashboard: https://platform.openai.com/
- Failover should be automatic (check `/webapp/lib/ai/router.ts`)

---

**For comprehensive details, see:**
- **README.md** - Project overview and quick start
- **/docs/** directory - 60+ documentation files
- **API_REFERENCE.md** - Complete API documentation
- **ARCHITECTURE_DECISIONS.md** - Technical decisions and rationale

**Last updated by:** Phase 3.2 completion | **Date:** 2025-11-10
