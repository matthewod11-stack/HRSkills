# Project-Level Claude Code Configuration

> **Note:** This is a minimal project-specific configuration. For comprehensive guides, see `~/claude-docs/`:
> - [agents.md](~/claude-docs/agents.md) - All available agents and their uses
> - [plugins.md](~/claude-docs/plugins.md) - Plugin commands and workflows
> - [rules.md](~/claude-docs/rules.md) - Coding standards and best practices
> - [workflows.md](~/claude-docs/workflows.md) - Complete workflow guides
> - [mcp.md](~/claude-docs/mcp.md) - MCP server configuration and usage

---

## Project Overview

**Project Name:** [Your Project Name]

**Description:** [Brief 1-2 sentence description]

**Tech Stack:**
- Framework: [e.g., Next.js 14, React 18]
- Language: [e.g., TypeScript 5.3]
- Database: [e.g., PostgreSQL with Prisma]
- Styling: [e.g., Tailwind CSS]
- Testing: [e.g., Vitest, Playwright]
- Deployment: [e.g., Vercel, AWS]

**Repository:** [GitHub URL]

---

## Project-Specific Rules

> **Default Standards:** See `~/claude-docs/rules.md` for comprehensive coding standards.
> Only document project-specific deviations or additions here.

### Code Style Exceptions
<!-- Example: "Use 4-space indentation instead of 2 for Python files" -->
- None (following standard rules.md conventions)

### Project-Specific Conventions
<!-- Example: "All API routes must be in app/api/ following Next.js App Router conventions" -->
- [Add any project-specific conventions here]

### Testing Requirements (Beyond Standard 80%)
<!-- Example: "Authentication flows require 100% coverage including E2E tests" -->
- [Add critical path coverage requirements]

---

## Project Architecture

### Directory Structure
```
[Project Root]/
  src/
    app/                 # [Purpose]
    components/          # [Organization strategy]
    lib/                 # [What goes here]
    hooks/               # [Custom hooks]
    types/               # [Type definitions]
  docs/                  # [Project documentation]
  tests/                 # [Test organization]
```

### Key Architectural Decisions
1. **[Decision 1]:** [Rationale]
   - Example: "Using tRPC for type-safe API - eliminates need for OpenAPI codegen"
2. **[Decision 2]:** [Rationale]
3. **[Decision 3]:** [Rationale]

---

## Project-Specific Agents

> **All Available Agents:** See `~/claude-docs/agents.md`
> List only the agents most relevant to THIS project's workflow.

### Primary Agents for This Project
1. **[agent-name]** - [Why particularly important for this project]
2. **[agent-name]** - [Why particularly important for this project]
3. **[agent-name]** - [Why particularly important for this project]

### Example Usage in This Project
```bash
# Example 1: [Common task in this project]
"[Specific prompt for this project context]"
# Uses: [agent-name]

# Example 2: [Another common task]
"[Specific prompt for this project context]"
# Uses: [agent-name]
```

---

## Project-Specific Workflows

> **Complete Workflow Guides:** See `~/claude-docs/workflows.md`
> Document only project-specific workflow variations here.

### Feature Development (This Project)
```
Standard workflow (see workflows.md) with these additions:
1. [Project-specific step]
2. [Project-specific step]
3. [Project-specific step]
```

### Deployment Workflow (This Project)
```
Environment: [Staging → Production]
Steps:
1. [Project-specific deployment step]
2. [Project-specific deployment step]
3. [Project-specific deployment step]

See workflows.md for general deployment best practices.
```

---

## Environment Setup

### Required Environment Variables
```bash
# AI Providers (if applicable)
ANTHROPIC_API_KEY=               # Claude API key
OPENAI_API_KEY=                  # OpenAI API key (for multi-provider setups)

# Database
DATABASE_URL=                    # [Description, e.g., PostgreSQL connection string]

# Authentication
AUTH_SECRET=                     # [Description, e.g., NextAuth secret]
NEXTAUTH_URL=                    # [Description, e.g., http://localhost:3000]

# Third-Party APIs
STRIPE_SECRET_KEY=               # [Description - if using Stripe]
SENDGRID_API_KEY=                # [Description - if using SendGrid]

# Application
NODE_ENV=                        # development | production | test
```

**Note:** MCP server credentials (GITHUB_TOKEN, BRAVE_API_KEY) are configured separately via `claude mcp add` commands and stored in `~/.claude.json`, not in your project's `.env` file.

### Local Development Setup
```bash
# 1. Clone and install
git clone [repo-url]
cd [project-name]
npm install

# 2. MCP configuration (optional but recommended - see ~/claude-docs/mcp.md)
# Add filesystem, GitHub, and Brave Search MCP servers:
claude mcp add --transport stdio filesystem -- npx -y @modelcontextprotocol/server-filesystem /Users/yourusername
claude mcp add --transport stdio github --env GITHUB_PERSONAL_ACCESS_TOKEN=your_token -- npx -y @modelcontextprotocol/server-github
claude mcp add --transport stdio brave-search --env BRAVE_API_KEY=your_key -- npx -y @modelcontextprotocol/server-brave-search

# 3. Environment setup
cp .env.example .env.local
# Edit .env.local with your values

# 4. Database setup
npm run db:push
npm run db:seed

# 5. Run development server
npm run dev
```

---

## MCP Configuration

> **Complete Guide:** See `~/claude-docs/mcp.md` for detailed documentation on all MCP servers.

### Recommended MCP Servers for This Project

MCP (Model Context Protocol) servers extend Claude Code's capabilities. The following servers are recommended:

1. **Filesystem Server** - Local file access and operations
   - Access project files across your machine
   - Cross-project code search and analysis
   - Database file inspection (SQLite, etc.)

2. **GitHub Server** - Repository operations and collaboration
   - Create/manage PRs and issues
   - Search code across repositories
   - Branch management and commits

3. **Brave Search Server** - Web search for research
   - Find latest documentation
   - Research package versions and compatibility
   - Look up solutions and best practices

### Quick Setup (Recommended Method)

**Using `claude mcp add` CLI** (no config files needed):

```bash
# 1. Add Filesystem server (home directory access)
claude mcp add --transport stdio filesystem -- npx -y @modelcontextprotocol/server-filesystem /Users/yourusername

# 2. Add GitHub server (requires Personal Access Token)
# Get token at: https://github.com/settings/tokens (scopes: repo, read:org, read:user)
claude mcp add --transport stdio github --env GITHUB_PERSONAL_ACCESS_TOKEN=your_token -- npx -y @modelcontextprotocol/server-github

# 3. Add Brave Search server (requires API key)
# Get key at: https://brave.com/search/api/
claude mcp add --transport stdio brave-search --env BRAVE_API_KEY=your_key -- npx -y @modelcontextprotocol/server-brave-search

# 4. Verify all servers are connected
claude mcp list
```

**Configuration is automatically saved** to `~/.claude.json` - no manual file editing required!

### Optional: Project-Specific Servers

Depending on your project, you may also want:

```bash
# PostgreSQL database access
claude mcp add --transport stdio postgres --env DATABASE_URL=your_db_url -- npx -y @modelcontextprotocol/server-postgres

# Google Drive integration
claude mcp add --transport stdio gdrive -- npx -y @modelcontextprotocol/server-gdrive

# Slack integration
claude mcp add --transport stdio slack -- npx -y @modelcontextprotocol/server-slack
```

### Usage in This Project

**Example prompts that utilize MCP servers:**
- "Search all TypeScript files for deprecated function usage" (filesystem)
- "Compare local package.json with what's in GitHub" (filesystem + github)
- "Create a PR for this feature branch" (github)
- "Search for the latest Next.js documentation on server actions" (brave-search)
- "Find all TODO comments and create GitHub issues for them" (filesystem + github)

**See `~/claude-docs/mcp.md` for:**
- Complete setup guide
- All available MCP servers
- Real-world usage examples
- Troubleshooting guide
- Security best practices

---

## Critical Code Paths

> **Security Note:** These paths require 100% test coverage and security-auditor review.

### Authentication Flow
- **Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- **Critical:** Session management, token validation
- **Tests:** `tests/auth/` (100% coverage required)

### Payment Processing
- **Files:** `src/lib/stripe.ts`, `src/app/api/payments/route.ts`
- **Critical:** Webhook validation, idempotency
- **Tests:** `tests/payments/` (100% coverage required)

### [Other Critical Path]
- **Files:** [List key files]
- **Critical:** [What makes this critical]
- **Tests:** [Test location and coverage requirement]

---

## Common Tasks & Quick Reference

### Code Review Before PR
```bash
# Standard review process (see workflows.md #3)
/review-pr

# Project-specific: Also check [project-specific concern]
```

### Adding New Features
```bash
# Standard feature workflow (see workflows.md #1)
/feature-dev [feature description]

# Project-specific considerations:
# - [Consideration 1]
# - [Consideration 2]
```

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage (80% minimum, see rules.md)
npm run test:coverage
```

### Database Changes
```bash
# 1. Update Prisma schema
# 2. Generate migration
npx prisma migrate dev --name [migration-name]

# 3. Update types
npm run generate

# 4. Test migration
npm run test:db
```

---

## Project-Specific Security Considerations

> **Standard Security Guidelines:** See `~/claude-docs/rules.md` - Security Standards

### This Project's Sensitive Data
- **PII:** [List what PII this project handles]
- **Compliance:** [GDPR, HIPAA, SOC2, etc.]
- **Encryption:** [What must be encrypted]

### Critical Security Checks
- [ ] [Project-specific check 1]
- [ ] [Project-specific check 2]
- [ ] No API keys in code (use environment variables)
- [ ] All user input validated (see schema-validator agent)
- [ ] PII encrypted at rest (see security-auditor agent)

---

## Dependencies & Integrations

### Key Dependencies
| Package | Version | Purpose | Update Frequency |
|---------|---------|---------|------------------|
| [package] | [version] | [purpose] | [monthly/quarterly] |
| [package] | [version] | [purpose] | [monthly/quarterly] |

### Third-Party Integrations
1. **[Service Name]** ([docs link])
   - Purpose: [Why we use this]
   - Critical: [Yes/No]
   - Monitoring: [How we monitor this integration]

2. **[Service Name]** ([docs link])
   - Purpose: [Why we use this]
   - Critical: [Yes/No]
   - Monitoring: [How we monitor this integration]

### Dependency Audit Schedule
```bash
# Monthly security audit (see workflows.md #7)
"Check if dependencies are up to date and secure"
# Uses: dependency-audit agent

# Before major releases
"Analyze security vulnerabilities and breaking changes"
# Uses: dependency-audit agent
```

---

## Performance Targets (This Project)

> **Standard Performance Guidelines:** See `~/claude-docs/rules.md` - Performance Standards

### Project-Specific Targets
- **Homepage LCP:** <2.0s (stricter than standard 2.5s)
- **Dashboard LCP:** <2.5s
- **API Response (p95):** <300ms
- **Bundle Size:** <80KB initial (stricter than standard 100KB)

### Performance Monitoring
- Tool: [e.g., Vercel Analytics, Lighthouse CI]
- Alerts: [When to alert]
- Review: [Weekly/Monthly]

---

## Known Issues & Technical Debt

### Current Known Issues
1. **[Issue]** - [Description and workaround]
   - Tracking: [Issue #123]
   - Priority: [High/Medium/Low]
   - Plan: [When/how to address]

2. **[Issue]** - [Description and workaround]
   - Tracking: [Issue #456]
   - Priority: [High/Medium/Low]
   - Plan: [When/how to address]

### Technical Debt
1. **[Debt Item]** - [Why it exists]
   - Impact: [Low/Medium/High]
   - Plan: [Refactor in Q2 2024]

2. **[Debt Item]** - [Why it exists]
   - Impact: [Low/Medium/High]
   - Plan: [Refactor in Q3 2024]

---

## Team & Contacts

### Key Contacts
- **Project Lead:** [Name] ([email])
- **Tech Lead:** [Name] ([email])
- **DevOps:** [Name] ([email])

### Communication Channels
- **Slack:** #[channel-name]
- **Standups:** [When/Where]
- **Sprint Planning:** [When/Where]

---

## Project-Specific AI Agent Configuration

### Model Preferences for This Project
> **Default:** Follow `~/claude-docs/rules.md` model selection guidelines
> Override only for project-specific needs.

- **Standard tasks:** Sonnet (default)
- **[Specific task type]:** [Opus/Haiku] because [reason]
- **[Specific task type]:** [Opus/Haiku] because [reason]

### Custom Agents (If Any)
> If this project has custom agents beyond the 17 in `~/claude-docs/agents.md`

**[custom-agent-name]**
- **Purpose:** [What it does]
- **Location:** `.claude/agents/[custom-agent-name]/`
- **When to use:** [Specific use cases]

---

## Quick Links

### Documentation
- **Comprehensive Guides:** `~/claude-docs/` (agents, plugins, rules, workflows)
- **API Documentation:** [Link to OpenAPI/Swagger]
- **Design System:** [Link to Storybook/Figma]
- **Architecture Diagrams:** [Link to diagrams]

### Monitoring & Operations
- **Production:** [Link to production]
- **Staging:** [Link to staging]
- **Logs:** [Link to logging dashboard]
- **Metrics:** [Link to metrics dashboard]
- **Errors:** [Link to error tracking (Sentry)]

### Repository & CI/CD
- **GitHub:** [Repo link]
- **CI/CD:** [GitHub Actions/CircleCI link]
- **Deployment Status:** [Status page link]

---

## Onboarding Checklist

**New developers should:**
- [ ] Read this project-level document completely
- [ ] Read `~/claude-docs/rules.md` for coding standards
- [ ] Review `~/claude-docs/workflows.md` for development processes
- [ ] Review `~/claude-docs/mcp.md` for MCP capabilities
- [ ] Configure recommended MCP servers (see "MCP Configuration" above):
  - [ ] Filesystem server (`claude mcp add ...`)
  - [ ] GitHub server (with Personal Access Token)
  - [ ] Brave Search server (with API key)
- [ ] Set up local environment (see "Environment Setup" above)
- [ ] Run test suite and verify all tests pass
- [ ] Review critical code paths (see "Critical Code Paths" above)
- [ ] Join communication channels (see "Team & Contacts" above)
- [ ] Review recent PRs to understand code review expectations
- [ ] Pair with team member for first feature

---

## Notes for Claude Code

> Instructions for Claude Code when working on this project.

### Project Context
This is a [production/MVP/prototype] application for [domain/purpose]. The codebase prioritizes [code quality/speed/innovation] and serves [number] users.

### Special Considerations
- **[Consideration 1]:** [Why this matters for AI assistance]
- **[Consideration 2]:** [Why this matters for AI assistance]
- **[Consideration 3]:** [Why this matters for AI assistance]

### When Making Changes
1. **Always** reference this document for project-specific context
2. **Always** follow standards in `~/claude-docs/rules.md` unless explicitly overridden here
3. **Always** use appropriate agents from `~/claude-docs/agents.md`
4. **Always** follow workflows from `~/claude-docs/workflows.md`
5. **Critical paths** (listed above) require extra scrutiny and testing

### Prohibited Actions
- ❌ [Project-specific prohibition, e.g., "Never modify database schema without migration"]
- ❌ [Project-specific prohibition, e.g., "Never deploy to production on Fridays"]
- ❌ [Project-specific prohibition]

---

**Last Updated:** [Date]
**Updated By:** [Name]
**Version:** 1.0.0
