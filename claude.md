# HRSkills Platform - Claude Code Configuration

> **Note:** This is the project-specific configuration for HRSkills Platform. For comprehensive guides, see `~/claude-docs/`:
> - [agents.md](~/claude-docs/agents.md) - All available agents and their uses
> - [plugins.md](~/claude-docs/plugins.md) - Plugin commands and workflows
> - [rules.md](~/claude-docs/rules.md) - Coding standards and best practices
> - [workflows.md](~/claude-docs/workflows.md) - Complete workflow guides
> - [mcp.md](~/claude-docs/mcp.md) - MCP server configuration and usage

---

## Project Overview

**Project Name:** HRSkills Platform

**Description:** Chat-first HR automation platform powered by Claude AI with multi-provider failover and dynamic context panels.

**Tech Stack:**
- Framework: Next.js 14 with App Router
- Language: TypeScript 5.3
- Database: SQLite with Drizzle ORM
- Styling: Tailwind CSS + shadcn/ui
- Testing: Jest, Playwright, jest-axe
- Deployment: Vercel (production-ready)
- AI: Multi-provider (Anthropic → OpenAI)

**Repository:** https://github.com/matthewod11-stack/HRSkills

**Platform Version:** 0.2.0
**Status:** Desktop App Implementation (Electron Phase 0-3)

---

## Current Focus: Desktop App Implementation

> **IMPORTANT:** We are actively building the Electron desktop app. Keep these docs top-of-mind.

### Primary Documentation

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| **[docs/desktop/ROADMAP.md](docs/desktop/ROADMAP.md)** | Phase checklist & linear tasks | Start of each session |
| **[docs/desktop/SESSION_PROTOCOL.md](docs/desktop/SESSION_PROTOCOL.md)** | Multi-session continuity rules | Every session |
| **[docs/desktop/PROGRESS.md](docs/desktop/PROGRESS.md)** | Session-by-session progress log | Start/end of sessions |
| **[docs/desktop/ARCHITECTURE.md](docs/desktop/ARCHITECTURE.md)** | Technical decisions | Design questions |
| **[docs/desktop/CODE_EXAMPLES.md](docs/desktop/CODE_EXAMPLES.md)** | Implementation code | When coding |
| **[docs/desktop/KNOWN_ISSUES.md](docs/desktop/KNOWN_ISSUES.md)** | Issue parking lot | When hitting blockers |
| **[desktop/features.json](desktop/features.json)** | Feature pass/fail tracking | Session verification |

### Session Initialization

```bash
# Run at start of every session:
./desktop/scripts/dev-init.sh
```

### Current Phase Progress

```
[x] Phase 0  - Pre-flight validation
[ ] Phase 1  - Electron scaffolding        <-- CURRENT
[ ] Phase 2  - Icon creation
[ ] Phase 3  - Next.js integration
[ ] Phase 0.5 - Payment & licensing
[ ] Phase 4  - Secure IPC
[ ] Phase 5-13 - See ROADMAP.md
```

### Desktop Implementation Rules

**1. Single-Feature-Per-Session Rule (CRITICAL):**
> Work on ONE checkbox item per session. This prevents scope creep and ensures features are fully verified.

**2. Session Protocol (See [SESSION_PROTOCOL.md](docs/desktop/SESSION_PROTOCOL.md)):**
- START: Run `./desktop/scripts/dev-init.sh`
- DURING: Work on one task, verify it works
- END: Update PROGRESS.md, features.json, commit

**3. Update KNOWN_ISSUES.md when:**
- Encountering non-blocking bugs
- Discovering edge cases
- Deferring decisions

**4. Keep ROADMAP.md checkboxes current:**
- Check off tasks as completed
- Note blockers at pause points

**5. Desktop-specific code goes in:**
- `desktop/` — Electron main process, preload, config
- `webapp/app/setup/` — First-run wizard route
- `webapp/components/onboarding/` — Setup wizard components
- `webapp/lib/types/electron.d.ts` — Electron API types

**6. Test both contexts:**
- Web: `npm run dev` in webapp (no Electron APIs)
- Desktop: Full Electron + Next.js integration

---

## Project-Specific Rules

> **Default Standards:** See `~/claude-docs/rules.md` for comprehensive coding standards.
> Only document project-specific deviations or additions here.

### Code Style Exceptions
- None (following standard rules.md conventions)

### Project-Specific Conventions

**1. ALWAYS use Drizzle ORM (NEVER raw SQL):**
```typescript
// ✅ CORRECT: Type-safe Drizzle query
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { employeesTable } from '@/db/schema'

const employees = await db.select()
  .from(employeesTable)
  .where(eq(employeesTable.status, 'active'))

// ❌ WRONG: Raw SQL
const employees = await db.run('SELECT * FROM employees')
```

**2. ALWAYS use aiRouter (NEVER direct provider calls):**
```typescript
// ✅ CORRECT: Multi-provider with failover
import { aiRouter } from '@/lib/ai/router'
const response = await aiRouter.chat(messages, { temperature: 0.7 })

// ❌ WRONG: Direct provider call (no failover)
import Anthropic from '@anthropic-ai/sdk'
```

**3. ALWAYS use centralized error handling:**
```typescript
// ✅ CORRECT
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
try {
  const result = await operation()
  return createSuccessResponse(result)
} catch (error) {
  return handleApiError(error, 'Operation failed')
}
```

**4. API routes must follow this pattern:**
```typescript
// /webapp/app/api/my-endpoint/route.ts
export async function GET(request: NextRequest) {
  // 1. Rate limiting (applyRateLimit)
  // 2. Authentication (requireAuth)
  // 3. Authorization (hasPermission)
  // 4. Business logic with error handling
}
```

### Testing Requirements (Beyond Standard 80%)

- **Authentication flows:** 100% coverage required (JWT + RBAC critical)
- **AI provider failover:** Integration tests required for Anthropic → OpenAI chain
- **PII/HR data operations:** Security audit + test coverage mandatory
- **Context panel detection:** E2E tests required for pattern matching
- **Accessibility:** WCAG 2.1 AA compliance with jest-axe validation

---

## Project Architecture

### Directory Structure
```
HRSkills/
  webapp/
    app/
      api/                 # Next.js API routes (chat, analytics, employees)
      setup/               # [NEW] First-run wizard route (desktop only)
      page.tsx             # Chat-first dashboard (50/50 layout)
    components/
      custom/              # Project-specific components (ChatInterface, ContextPanel)
      onboarding/          # [NEW] Setup wizard components
    lib/
      ai/router.ts         # Multi-provider AI routing with failover
      db/index.ts          # Database singleton client
      auth/middleware.ts   # JWT + RBAC
      analytics/           # SQL-based analytics queries
      workflows/           # Context detection pattern matching
      types/electron.d.ts  # [NEW] Electron API type definitions
    db/schema.ts           # 10 normalized tables (Drizzle)
  desktop/                 # [NEW] Electron shell
    src/
      electron-main.ts     # Main process (starts Next.js, creates windows)
      preload.ts           # Secure IPC bridge
    icons/                 # macOS/Windows app icons
    package.json           # Electron dependencies
    electron-builder.yml   # Packaging configuration
  skills/                  # 25 Claude Skills for HR automation
  docs/
    desktop/               # [NEW] Desktop implementation docs
      ROADMAP.md           # Phase checklist (start here!)
      ARCHITECTURE.md      # Technical specification
      CODE_EXAMPLES.md     # Implementation code
      KNOWN_ISSUES.md      # Issue parking lot
  data/hrskills.db         # SQLite database (webapp), moves to ~/Library/... in desktop
```

### Key Architectural Decisions

1. **Chat-First UX** - Zero navigation clicks, context panels appear dynamically based on server-side pattern matching (70% confidence threshold)

2. **Multi-Provider AI Resilience** - Automatic failover chain (Anthropic → OpenAI) for 99.9% uptime, circuit breaker pattern, health monitoring

3. **Type Safety Everywhere** - TypeScript + Zod validation + Drizzle ORM, no `any` types allowed

4. **SQLite + Drizzle ORM** - Migrated from JSON to normalized database with sub-50ms analytics queries, WAL mode for concurrent access

5. **Security by Default** - JWT auth on all protected endpoints, RBAC checks for every operation, rate limiting on all public routes, audit logging for data modifications

6. **25 Claude Skills** - Domain-specific HR capabilities auto-detected via keyword matching in `/webapp/app/api/chat/route.ts:60-150`

---

## Project-Specific Agents

> **All Available Agents:** See `~/claude-docs/agents.md`
> List only the agents most relevant to THIS project's workflow.

### Primary Agents for This Project

1. **security-auditor** - Critical for HR platform with PII handling. Use when implementing auth, handling employee data, before production deploys, integrating third-party services.

2. **code-review-quality** - Use after implementing features, before commits, when user asks to "review", "check", or "audit" code.

3. **performance-profiler** - Important for analytics queries. Use when optimizing database queries, implementing new features with database access, investigating slow performance.

4. **test-generator** - Use after writing new utilities/functions, creating new API routes, refactoring components.

5. **react-component-refactor** - Use when code reviews reveal duplication, prop drilling >3 levels, components >300 lines.

6. **accessibility-auditor** - WCAG 2.1 AA compliance required. Use after creating/modifying React components, implementing new UI features, before releases.

7. **docs-sync-checker** - Use after adding new API endpoints, modifying features, before merging PRs.

### Example Usage in This Project

```bash
# Example 1: Adding new employee export feature
"I just added a new employee export feature with CSV download"
# Uses: security-auditor (PII handling), code-review-quality, test-generator

# Example 2: Analytics dashboard slow
"The analytics dashboard is taking 500ms to load"
# Uses: performance-profiler

# Example 3: Refactored chat components
"I refactored the ChatInterface into smaller components"
# Uses: react-component-refactor, accessibility-auditor, test-generator

# Example 4: New payroll endpoint
"Added new /api/payroll endpoint for salary calculations"
# Uses: docs-sync-checker, security-auditor (sensitive data), test-generator
```

---

## Project-Specific Workflows

> **Complete Workflow Guides:** See `~/claude-docs/workflows.md`
> Document only project-specific workflow variations here.

### Feature Development (This Project)

```
Standard workflow (see workflows.md) with these additions:
1. Check if feature needs a new Claude Skill (create in /skills/ if so)
2. Update context detection patterns in /webapp/lib/workflows/context-detector.ts
3. Run security-auditor proactively (PII/HR data considerations)
4. Update /docs/api/API_REFERENCE.md for new endpoints
5. Test with demo JWT token: POST /api/auth/demo-token
```

### Deployment Workflow (This Project)

```
Environment: Local → Vercel Preview → Vercel Production

Steps:
1. Run full validation: npm run validate (type-check + lint + test)
2. Test with production database: npm run migrate:json-to-sqlite
3. Verify AI provider failover works (test all 3 providers)
4. Check rate limiting and auth middleware
5. Deploy to Vercel preview branch
6. E2E tests in preview environment
7. Promote to production

See workflows.md for general deployment best practices.
```

### Adding a New Claude Skill

```
1. Create directory: mkdir -p skills/my-skill/references
2. Create skills/my-skill/SKILL.md with frontmatter:
   ---
   name: my-skill
   description: What this skill does
   ---
3. Add detection pattern in /webapp/app/api/chat/route.ts:
   if (/relevant|keywords/.test(messageLower)) {
     return 'my-skill'
   }
4. Test skill detection in chat interface
5. Update /skills/SKILLS_INDEX.md
```

---

## Environment Setup

### Required Environment Variables

```bash
# AI Providers (at least ONE required)
ANTHROPIC_API_KEY=sk-ant-...           # Primary AI provider (recommended)
OPENAI_API_KEY=sk-...                  # Fallback (optional)

# Authentication
JWT_SECRET=your-secret-key-32chars     # JWT signing (32+ characters required)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database
DATABASE_URL=file:../data/hrskills.db  # SQLite path (relative to /webapp)

# Google Workspace (optional)
GOOGLE_CLIENT_ID=...                   # OAuth 2.0 client
GOOGLE_CLIENT_SECRET=...               # OAuth 2.0 secret
GOOGLE_DRIVE_FOLDER_ID=...            # Template storage folder
NEXT_PUBLIC_GOOGLE_TEMPLATES_ENABLED=true
```

### Observability & Rate-Limiting Variables (Optional)

```bash
# Observability (Optional - Recommended for Production)
SENTRY_DSN=your-sentry-dsn            # Error tracking and performance monitoring
SENTRY_ORG=your-org                   # Sentry organization
SENTRY_PROJECT=your-project           # Sentry project name
SENTRY_AUTH_TOKEN=your-token          # For source map uploads (CI/CD only)

# Rate Limiting (Optional - Required for Multi-Instance)
ENABLE_UPSTASH_RATE_LIMIT=false       # Feature flag (true on production)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-token

# Analytics Toggles
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=false  # Renders <Analytics /> component when true
NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED=false    # Renders <SpeedInsights /> component when true
```

**Setup Instructions:**

1. **Sentry** (optional but recommended):
   - Sign up at https://sentry.io
   - Create a Next.js project
   - Copy DSN from Settings → Client Keys
   - Add all `SENTRY_*` values to `.env.local`
   - Source maps upload automatically in CI/CD when `SENTRY_AUTH_TOKEN` is set

2. **Upstash Redis** (optional - only needed for multi-instance deployments):
   - Sign up at https://console.upstash.com
   - Create a Redis database
   - Copy REST URL and token
   - Set `ENABLE_UPSTASH_RATE_LIMIT=true` in production environments

3. **Analytics toggles**:
   - These are false by default for local development
   - Set to true on Vercel deployments to enable real-user monitoring

**Note:** MCP server credentials (GITHUB_PERSONAL_ACCESS_TOKEN, BRAVE_API_KEY) are configured separately via `claude mcp add` commands and stored in `~/.claude.json`, not in your project's `.env.local` file.

### Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/matthewod11-stack/HRSkills
cd HRSkills/webapp
npm install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with your values (minimum: ANTHROPIC_API_KEY + JWT_SECRET)

# 3. Database setup
npm run migrate:json-to-sqlite -- --demo  # Creates SQLite DB with 100 demo employees

# 4. Run development server
npm run dev  # → http://localhost:3000

# 5. Get demo JWT token (for testing)
curl -X POST http://localhost:3000/api/auth/demo-token
```

---

## MCP Configuration

> **Complete Guide:** See `~/claude-docs/mcp.md` for detailed documentation on all MCP servers.

### Understanding MCP Servers (Global, Not Project-Specific)

**IMPORTANT:** MCP servers are **global** - they're configured once via `claude mcp add` and stored in `~/.claude.json`. They automatically connect across ALL your projects whenever you launch Claude Code. **You do NOT need project-specific MCP configuration files.**

This section documents which **global MCP servers** are particularly useful for THIS project.

### Recommended Global MCP Servers

If you haven't already, configure these MCP servers globally (see `~/claude-docs/mcp.md` for full setup instructions):

1. **Filesystem Server** - Local file access and operations
   - Access project files across your machine
   - Cross-project code search and analysis
   - Database file inspection (SQLite hrskills.db)
   - Compare HRSkills with other HR projects
   - Setup: `claude mcp add --transport stdio filesystem -- npx -y @modelcontextprotocol/server-filesystem /Users/yourusername`

2. **GitHub Server** - Repository operations and collaboration
   - Create/manage PRs and issues
   - Search code across repositories
   - Branch management and commits
   - Review PR history and code patterns
   - Setup: `claude mcp add --transport stdio github --env GITHUB_PERSONAL_ACCESS_TOKEN=your_token -- npx -y @modelcontextprotocol/server-github`
   - Get token at: https://github.com/settings/tokens (scopes: repo, read:org, read:user)

3. **Brave Search Server** - Web search for research
   - Find latest Next.js and Drizzle ORM documentation
   - Research AI provider API updates (Anthropic, OpenAI)
   - Look up HR compliance regulations and best practices
   - Find solutions for performance optimization
   - Setup: `claude mcp add --transport stdio brave-search --env BRAVE_API_KEY=your_key -- npx -y @modelcontextprotocol/server-brave-search`
   - Get key at: https://brave.com/search/api/

### Optional Global Servers (Project-Dependent)

Depending on your needs, you may also want:

```bash
# PostgreSQL database access (if migrating from SQLite)
claude mcp add --transport stdio postgres --env DATABASE_URL=your_db_url -- npx -y @modelcontextprotocol/server-postgres

# Puppeteer browser automation (for UI testing, screenshots, web scraping)
claude mcp add --transport stdio puppeteer -- npx -y @modelcontextprotocol/server-puppeteer

# Figma design integration (if working with design system)
# Run /mcp in Claude Code and authenticate via browser
```

### Verify Your Global MCP Servers

**Check which MCP servers are currently connected:**
```bash
claude mcp list
# or run in Claude Code:
/mcp
```

You should see your configured servers with "✓ Connected" status. If any are missing, see `~/claude-docs/mcp.md` for troubleshooting.

### How to Use MCP Servers in This Project

**Example prompts that utilize your global MCP servers:**
- "Analyze the SQLite database schema and suggest performance improvements" (filesystem)
- "Compare employee_metrics table structure with what's in the GitHub repo" (filesystem + github)
- "Create a PR for the new multi-provider AI failover feature" (github)
- "Search for latest Drizzle ORM best practices for SQLite WAL mode" (brave-search)
- "Find all TODO comments in HRSkills and create GitHub issues for them" (filesystem + github)
- "Compare HRSkills architecture with other projects in ~/Desktop" (filesystem)

**Project-Specific MCP Usage Notes:**
- **Most useful for this project:** filesystem + github for codebase navigation and SQLite database inspection
- **Design integration:** Not currently using Figma
- **Database queries:** Consider PostgreSQL MCP if migrating from SQLite to PostgreSQL in the future

**See `~/claude-docs/mcp.md` for:**
- Complete setup guide for all MCP servers
- Authentication and troubleshooting
- Real-world usage examples
- Security best practices

---

## Critical Code Paths

> **Security Note:** These paths require 100% test coverage and security-auditor review.

### Authentication & Authorization
- **Files:** `webapp/lib/auth/middleware.ts`, `webapp/app/api/auth/*/route.ts`
- **Critical:** JWT token generation, session management, RBAC permission checks
- **Tests:** `__tests__/auth/` (100% coverage required)

### Multi-Provider AI Router
- **Files:** `webapp/lib/ai/router.ts` (352 lines)
- **Critical:** Failover chain logic, circuit breaker, health monitoring, usage tracking
- **Tests:** `__tests__/lib/ai/router.test.ts` (failover scenarios required)

### Database Queries (Employee Data & Analytics)
- **Files:** `webapp/lib/db/index.ts`, `webapp/db/schema.ts`, `webapp/lib/analytics/*-sql.ts`
- **Critical:** PII handling, type-safe queries, performance (<50ms target)
- **Tests:** `__tests__/lib/analytics/` (query performance + accuracy)

### Chat Routing & Skill Detection
- **Files:** `webapp/app/api/chat/route.ts:60-150`
- **Critical:** Pattern matching accuracy, skill routing, context detection
- **Tests:** E2E tests for all 25 skills (`e2e/chat.spec.ts`)

### API Rate Limiting
- **Files:** `webapp/lib/security/rate-limiter.ts`
- **Critical:** DoS protection, fair usage enforcement
- **Tests:** `__tests__/security/rate-limiter.test.ts` (load testing)

---

## Common Tasks & Quick Reference

### Code Review Before PR

```bash
# Standard review process (see workflows.md #3)
/review-pr

# Project-specific: Also check
# - PII handling with security-auditor
# - Drizzle ORM usage (no raw SQL)
# - aiRouter usage (no direct provider calls)
# - Error handling with handleApiError()
```

### Adding New Features

```bash
# Standard feature workflow (see workflows.md #1)
/feature-dev [feature description]

# Project-specific considerations:
# - Does this need a new Claude Skill? (skills/ directory)
# - Does this need a new context panel? (context-detector.ts)
# - Does this handle PII? (run security-auditor)
# - Does this need RBAC? (check hasPermission() usage)
```

### Running Tests

```bash
# Unit tests
npm test

# Integration tests (API routes)
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Accessibility tests
npm run test:a11y

# All tests + coverage (80% minimum, see rules.md)
npm run test:all
npm run test:coverage
```

### Database Changes

```bash
# 1. Update Drizzle schema
# Edit: webapp/db/schema.ts

# 2. Run migration
cd webapp
npm run migrate:json-to-sqlite

# 3. Update TypeScript types
# Edit: webapp/lib/types/master-employee.ts

# 4. Test queries
npm run db:stats  # Verify migration success
```

### Debugging Common Issues

**"Skill not detected"**
```bash
# Check keyword patterns in:
webapp/app/api/chat/route.ts:60-150

# Verify SKILL.md exists:
ls skills/my-skill/SKILL.md

# Note: Skill names are case-sensitive
```

**"Rate limit exceeded"**
```bash
# Adjust preset in API route or:
# webapp/lib/security/rate-limiter.ts

# Restart server to clear cache
npm run dev
```

**"Authentication failed"**
```bash
# Get new demo token (expires in 8 hours):
curl -X POST http://localhost:3000/api/auth/demo-token

# Verify JWT_SECRET in .env.local (32+ characters)
```

**"Database query slow"**
```bash
# Check indexes in:
webapp/db/schema.ts

# Target: <50ms for analytics queries
# Use Drizzle .explain() to analyze query plan
```

**"AI provider errors"**
```bash
# 1. Check provider health at: http://localhost:3000/settings
# 2. Verify API keys in .env.local
# 3. Test failover chain manually
# 4. Review routing logic: webapp/lib/ai/router.ts
```

---

## Project-Specific Security Considerations

> **Standard Security Guidelines:** See `~/claude-docs/rules.md` - Security Standards

### This Project's Sensitive Data

- **PII:** Employee names, emails, phone numbers, addresses, SSNs (I-9 forms), salary data, performance reviews, health benefits, disciplinary records
- **Compliance:** GDPR (EU employee data), EEOC (US employment law), SOC2 (security controls)
- **Encryption:** PII encrypted at rest in SQLite database, OAuth tokens encrypted in user_preferences table, JWT tokens signed with HS256

### Critical Security Checks

- [x] No API keys in code (use .env.local, gitignored)
- [x] All user input validated with Zod schemas (schema-validator pattern)
- [x] PII encrypted at rest (SQLite with WAL mode)
- [x] JWT auth on all protected endpoints (requireAuth middleware)
- [x] RBAC enforcement (hasPermission checks)
- [x] Rate limiting on all public routes (RateLimitPresets)
- [x] Audit logging for data modifications (audit_logs table)
- [x] Security-auditor agent run before production deploys
- [x] SQL injection prevention (Drizzle ORM exclusively, no raw SQL)
- [x] XSS prevention (React escaping + Content Security Policy)

---

## Dependencies & Integrations

### Key Dependencies

| Package | Version | Purpose | Update Frequency |
|---------|---------|---------|------------------|
| Next.js | 14.x | Full-stack framework | Quarterly |
| Drizzle ORM | Latest | Type-safe database queries | Monthly |
| @anthropic-ai/sdk | Latest | Primary AI provider | Monthly |
| openai | Latest | Fallback AI provider | Monthly |
| @google/generative-ai | Latest | Free tier AI fallback | Monthly |
| zod | Latest | Runtime validation | Quarterly |
| jose | Latest | JWT token handling | Monthly (security) |

### Third-Party Integrations

1. **Anthropic Claude API** (https://docs.anthropic.com)
   - Purpose: Primary AI provider for chat, skills, analysis
   - Critical: Yes (with OpenAI fallback)
   - Monitoring: Health checks in /webapp/lib/ai/router.ts, usage tracking in ai_usage table

2. **OpenAI API** (https://platform.openai.com/docs)
   - Purpose: Fallback AI provider (second in chain)
   - Critical: No (failover only)
   - Monitoring: Circuit breaker pattern, automatic retry logic

3. **Google Workspace APIs** (https://developers.google.com/workspace)
   - Purpose: OAuth 2.0 for Drive/Docs/Sheets integration
   - Critical: No (optional feature)
   - Monitoring: Refresh token validation, OAuth flow error handling

### Dependency Audit Schedule

```bash
# Monthly security audit (see workflows.md #7)
"Check if dependencies are up to date and secure"
# Uses: dependency-audit agent

# Before major releases
"Analyze security vulnerabilities and breaking changes"
# Uses: dependency-audit agent

# After security advisories
"Audit npm packages for known CVEs"
# Uses: dependency-audit agent
```

---

## Performance Targets (This Project)

> **Standard Performance Guidelines:** See `~/claude-docs/rules.md` - Performance Standards

### Project-Specific Targets

- **Chat Response (AI):** <3.0s (p95) - includes multi-provider failover time
- **Analytics Queries:** <50ms (p95) - SQLite with indexed queries
- **Context Panel Detection:** <100ms - server-side pattern matching
- **API Response (non-AI):** <200ms (p95)
- **Database Writes:** <20ms (p95)
- **Bundle Size:** <100KB initial JS (standard Next.js target)

### Performance Monitoring

- Tool: Custom trackMetric in /webapp/lib/performance-monitor.ts
- Alerts: Console warnings for >50ms database queries, >3s AI responses
- Review: Weekly review of ai_usage table for cost optimization
- Database: SQLite WAL mode for concurrent read performance

---

## Known Issues & Technical Debt

### Current Known Issues

1. **Legacy JSON file** - `/data/master-employees.json` still exists but deprecated
   - Tracking: Phase 2 migration complete, file kept for backup only
   - Priority: Low
   - Plan: Delete after 6 months of SQLite stability (May 2026)

2. **Some skills need reference docs** - Not all 25 skills have comprehensive /references/ subdirectories
   - Tracking: Skills work functionally, documentation enhancement needed
   - Priority: Medium
   - Plan: Add skill reference docs in Phase 4 (Q1 2026)

### Technical Debt

1. **AI router could use Redis for caching** - Currently in-memory circuit breaker state
   - Impact: Low (single-instance deployment only)
   - Plan: Add Redis layer if scaling to multi-instance (Phase 5)

2. **E2E test coverage at 60%** - Need more comprehensive Playwright tests for all 25 skills
   - Impact: Medium (manual testing required)
   - Plan: Incremental addition of E2E tests, target 80% by Q2 2026

---

## Team & Contacts

### Key Contacts

- **Project Lead:** Matt O'Donnell (solo developer)
- **Tech Lead:** Matt O'Donnell
- **DevOps:** Matt O'Donnell

### Communication Channels

- **Repository:** GitHub Issues for bug tracking
- **Documentation:** /docs/ directory in repository
- **Updates:** Git commit messages (using conventional commits)

---

## Project-Specific AI Agent Configuration

### Model Preferences for This Project

> **Default:** Follow `~/claude-docs/rules.md` model selection guidelines
> Override only for project-specific needs.

- **Standard tasks:** Sonnet (default) - chat, skill routing, document generation
- **Complex multi-step workflows:** Opus - architecture decisions, skill creation, complex refactors
- **Simple utilities:** Haiku - quick tests, formatting, simple API routes

### Custom Agents (If Any)

> If this project has custom agents beyond those in `~/claude-docs/agents.md`

No custom agents at this time.

---

## Quick Links

### Documentation

- **Desktop Implementation:** `/docs/desktop/ROADMAP.md` (current focus!)
- **Comprehensive Guides:** `~/claude-docs/` (agents, plugins, rules, workflows)
- **API Documentation:** `/docs/api/API_REFERENCE.md` (all 38 endpoints)
- **Architecture Decisions:** `/docs/architecture/ARCHITECTURE_DECISIONS.md`
- **Skills Index:** `/skills/SKILLS_INDEX.md` (all 25 skills)
- **Development Setup:** `/docs/guides/DEVELOPMENT_SETUP.md`

### Monitoring & Operations

- **Production:** (Vercel deployment - production-ready)
- **Staging:** Vercel preview deployments (automatic on PRs)
- **Provider Health:** http://localhost:3000/settings (AI provider status)
- **Database Stats:** `npm run db:stats`

### Repository & CI/CD

- **GitHub:** https://github.com/matthewod11-stack/HRSkills
- **CI/CD:** Vercel automatic deployments (main branch → production)
- **Deployment Status:** Vercel dashboard

---

## Onboarding Checklist

**New developers should:**

- [ ] Read this project-level document completely
- [ ] Read `~/claude-docs/rules.md` for coding standards
- [ ] Review `~/claude-docs/workflows.md` for development processes
- [ ] Review `~/claude-docs/agents.md` for available specialized agents
- [ ] Review `~/claude-docs/mcp.md` for MCP capabilities
- [ ] Verify global MCP servers are configured (see "MCP Configuration" above):
  - [ ] Run `claude mcp list` to check connected servers
  - [ ] Filesystem server (if not configured, see ~/claude-docs/mcp.md)
  - [ ] GitHub server (if not configured, see ~/claude-docs/mcp.md)
  - [ ] Brave Search server (if not configured, see ~/claude-docs/mcp.md)
- [ ] Set up local environment (see "Environment Setup" above)
- [ ] Run test suite and verify all tests pass: `npm run test:all`
- [ ] Review critical code paths (see "Critical Code Paths" above)
- [ ] Understand the 25 Claude Skills: `/skills/SKILLS_INDEX.md`
- [ ] Test chat interface with various queries to trigger different skills
- [ ] Review recent commits: `git log --oneline -20`
- [ ] Get demo JWT token and test API with Postman/curl
- [ ] Review Phase 2 and Phase 3.2 completion docs in `/docs/phases/`

---

## Notes for Claude Code

> Instructions for Claude Code when working on this project.

### Project Context

This is a **production-ready** HR automation platform serving as an MVP for chat-first enterprise workflows. The codebase prioritizes **type safety, security, and resilience** over rapid prototyping. It serves demo/pilot users and is designed for eventual multi-tenant SaaS deployment.

### Special Considerations

- **PII Handling Critical:** This platform processes sensitive employee data (SSNs, salaries, health info). ALWAYS run security-auditor when touching employee data paths.

- **Multi-Provider AI is Core Architecture:** Never bypass aiRouter. The failover chain (Anthropic → OpenAI) is not optional—it's the primary reliability mechanism.

- **Chat-First UX Philosophy:** All features must be accessible via chat queries. Avoid building traditional CRUD UIs. Context panels should appear automatically based on chat patterns.

- **Database Performance Matters:** Target <50ms for analytics queries. Always add indexes for new query patterns. Use Drizzle's `.explain()` to verify query plans.

- **25 Skills are the Product:** The Claude Skills are the primary value proposition. When adding features, consider if a new skill is needed vs. enhancing existing ones.

### When Making Changes

1. **Always** reference this document for project-specific context
2. **Always** follow standards in `~/claude-docs/rules.md` unless explicitly overridden here
3. **Always** use appropriate agents from `~/claude-docs/agents.md` (especially security-auditor for PII)
4. **Always** follow workflows from `~/claude-docs/workflows.md`
5. **Critical paths** (listed above) require extra scrutiny and 100% test coverage
6. **Never** modify these files without deep understanding:
   - `/webapp/lib/ai/router.ts` (multi-provider logic)
   - `/webapp/db/schema.ts` (database schema, requires migration)
   - `/webapp/lib/auth/middleware.ts` (security critical)
   - `/webapp/app/api/chat/route.ts` (core chat routing)

### Prohibited Actions

- ❌ **Never commit API keys or secrets** (use .env.local, check .gitignore)
- ❌ **Never use raw SQL** (Drizzle ORM only, prevents SQL injection)
- ❌ **Never bypass authentication** (requireAuth + hasPermission on all protected routes)
- ❌ **Never skip input validation** (Zod schemas for all user input)
- ❌ **Never use `any` types** (TypeScript strict mode enabled)
- ❌ **Never create direct AI provider calls** (aiRouter only, for failover)
- ❌ **Never skip testing** (especially for PII handling and auth)
- ❌ **Never modify database schema without migration** (data loss risk)

---

**Last Updated:** November 26, 2025
**Updated By:** Added Desktop Implementation focus section, KNOWN_ISSUES.md, updated directory structure
**Version:** 2.2.0
