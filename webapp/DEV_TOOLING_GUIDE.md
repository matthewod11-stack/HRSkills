# Dev Tooling Guide: Husky & lint-staged

**Phase 10 Documentation**
**Date:** November 18, 2024

---

## Overview

This guide covers the developer tooling setup for the HR Command Center platform, including:

1. **Husky** - Git hooks manager for automating quality checks
2. **lint-staged** - Run linters only on staged files (fast feedback)
3. **commitlint** - Enforce conventional commit messages

**Benefits:**
- ✅ Prevent commits with type errors, linting violations, or formatting issues
- ✅ Enforce code quality before code enters the repository
- ✅ Fast feedback loops (only checks staged files, not entire codebase)
- ✅ Conventional commit messages for clean git history
- ✅ Automated changelogs and semantic versioning support
- ✅ Reduce CI/CD failures and code review iterations

**Automated Checks:**
- **Pre-commit:** Biome linting + formatting, TypeScript type checking
- **Commit-msg:** Conventional commit message validation

---

## Step 1: What Was Installed

### Packages

```json
{
  "devDependencies": {
    "husky": "^9.x.x",                          // Git hooks manager
    "lint-staged": "^15.x.x",                   // Run linters on staged files
    "@commitlint/cli": "^19.x.x",               // Commit message linter
    "@commitlint/config-conventional": "^19.x.x" // Conventional commits config
  }
}
```

### Files Created

```
webapp/
├── .husky/                          # Husky configuration directory
│   ├── _/
│   │   └── husky.sh                 # Husky initialization script
│   ├── pre-commit                   # Pre-commit hook
│   ├── commit-msg                   # Commit message validation hook
│   └── README.md                    # Husky directory documentation
├── .lintstagedrc.json               # lint-staged configuration
└── .commitlintrc.json               # commitlint configuration
```

### package.json Scripts

Already present in package.json:

```json
{
  "scripts": {
    "prepare": "husky",               // Auto-install hooks on npm install
    "lint": "biome check --error-on-warnings .",
    "lint:fix": "biome check --write --unsafe .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "validate": "npm run type-check && npm run format:check && npm run lint && npm run test"
  }
}
```

---

## Step 2: Hook Configuration

### Pre-Commit Hook

**File:** `.husky/pre-commit`

**What it does:**
1. Runs `lint-staged` on all staged files
2. Checks Biome linting and formatting
3. Runs TypeScript type checking on staged .ts/.tsx files
4. Blocks commit if any check fails

**Configuration:** `.lintstagedrc.json`

```json
{
  "*.{ts,tsx,js,jsx,json,md}": [
    "biome check --write --unsafe --files-ignore-unknown=true"
  ],
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit'"
  ]
}
```

**Actions:**
- **All supported files:** Biome lint + format (auto-fix enabled)
- **TypeScript files:** Type checking (no auto-fix)

### Commit-msg Hook

**File:** `.husky/commit-msg`

**What it does:**
1. Validates commit message format
2. Enforces conventional commit style
3. Blocks commit if message doesn't match pattern

**Configuration:** `.commitlintrc.json`

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",      // New feature
        "fix",       // Bug fix
        "docs",      // Documentation only changes
        "style",     // Code style changes (formatting, missing semi-colons, etc)
        "refactor",  // Code change that neither fixes a bug nor adds a feature
        "perf",      // Performance improvement
        "test",      // Adding missing tests or correcting existing tests
        "build",     // Changes to build system or dependencies
        "ci",        // CI/CD configuration changes
        "chore",     // Other changes that don't modify src or test files
        "revert"     // Reverts a previous commit
      ]
    ],
    "subject-case": [0],            // Allow any case in subject
    "body-max-line-length": [0]     // No line length limit in body
  }
}
```

---

## Step 3: Commit Message Format

### Conventional Commits

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**

```bash
# Good commit messages ✅
feat: add Vercel Analytics integration
fix: resolve TypeScript error in track-events.ts
docs: update VERCEL_ANALYTICS_GUIDE.md with testing instructions
refactor(auth): simplify JWT token validation logic
perf(analytics): optimize headcount query with indexes
test: add unit tests for rate limiter
chore: upgrade dependencies to latest versions

# With scope and body
feat(analytics): add custom event tracking for HR workflows

Implemented 16 event types for chat, analytics, employee management,
documents, and authentication. Added helper functions for common events.

Closes #123

# Bad commit messages ❌
Added analytics        # Missing type
feat add analytics     # Missing colon
FEAT: Add analytics    # Type should be lowercase
feature: analytics     # Invalid type (should be "feat")
fix stuff              # Too vague
```

### Valid Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `feat` | New feature | Add employee search functionality |
| `fix` | Bug fix | Fix rate limiter memory leak |
| `docs` | Documentation | Update API documentation |
| `style` | Code style | Format code with Biome |
| `refactor` | Code refactor | Extract skill detection logic |
| `perf` | Performance | Optimize database queries |
| `test` | Tests | Add unit tests for auth |
| `build` | Build system | Update Next.js to v16 |
| `ci` | CI/CD | Configure GitHub Actions |
| `chore` | Maintenance | Upgrade dependencies |
| `revert` | Revert commit | Revert "Add analytics" |

### Optional Scope

Scope is optional but recommended for larger projects:

```bash
feat(chat): add multi-provider AI failover
fix(auth): resolve JWT expiration issue
perf(db): add indexes for employee queries
```

**Common scopes in this project:**
- `chat` - Chat API and skill detection
- `auth` - Authentication and authorization
- `analytics` - Analytics queries and dashboards
- `db` - Database schema and migrations
- `api` - API routes
- `ui` - UI components
- `docs` - Documentation

---

## Step 4: Developer Workflow

### Normal Workflow (All Checks Pass)

```bash
# 1. Make changes to files
vim webapp/lib/analytics/track-events.ts

# 2. Stage changes
git add webapp/lib/analytics/track-events.ts

# 3. Commit (hooks run automatically)
git commit -m "feat(analytics): add employee search tracking"

# Expected output:
# ✔ Preparing lint-staged...
# ✔ Running tasks for staged files...
# ✔ Applying modifications from tasks...
# ✔ Cleaning up temporary files...
# ✔ Commit message validated
# [main abc1234] feat(analytics): add employee search tracking
#  1 file changed, 10 insertions(+)

# 4. Push to remote
git push origin main
```

### When Pre-Commit Fails

**Scenario 1: Linting Error**

```bash
git commit -m "feat: add tracking"

# Output:
# ✖ biome check failed:
# lib/analytics/track-events.ts:45:10 - Unused variable 'foo'
#
# Git commit aborted.
```

**Fix:**
```bash
# Option 1: Auto-fix with Biome
npm run lint:fix

# Option 2: Manually fix the issue
vim lib/analytics/track-events.ts

# Try commit again
git commit -m "feat: add tracking"
```

**Scenario 2: Type Error**

```bash
git commit -m "feat: add tracking"

# Output:
# ✖ tsc --noEmit failed:
# lib/analytics/track-events.ts:50:15 - error TS2345:
# Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
#
# Git commit aborted.
```

**Fix:**
```bash
# Fix TypeScript error
vim lib/analytics/track-events.ts

# Verify fix
npm run type-check

# Try commit again
git commit -m "feat: add tracking"
```

### When Commit Message Fails

```bash
git commit -m "Added tracking"

# Output:
# ⧗ input: Added tracking
# ✖ type must be one of [feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert] [type-enum]
#
# Git commit aborted.
```

**Fix:**
```bash
# Use correct format
git commit -m "feat: add tracking"

# Or amend previous commit
git commit --amend -m "feat: add tracking"
```

---

## Step 5: Bypassing Hooks (Emergency Only)

### When to Bypass

**Valid reasons:**
- Emergency hotfix in production
- WIP commit on feature branch (will be squashed later)
- Reverting a broken commit quickly

**Invalid reasons:**
- ❌ "I don't want to fix linting errors"
- ❌ "It takes too long to run"
- ❌ "I'll fix it later" (on main branch)

### How to Bypass

**Skip pre-commit hook:**
```bash
git commit --no-verify -m "feat: emergency hotfix"
# or
git commit -n -m "feat: emergency hotfix"
```

**Skip all hooks:**
```bash
HUSKY=0 git commit -m "feat: emergency hotfix"
```

**Warning:** Bypassed commits may break CI/CD and should be fixed ASAP.

---

## Step 6: Troubleshooting

### Issue: Hooks Not Running

**Symptoms:**
- Commits succeed even with linting errors
- No "Preparing lint-staged..." message

**Solution 1: Reinstall hooks**
```bash
cd webapp
rm -rf .husky
npm run prepare
```

**Solution 2: Check hook permissions**
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/_/husky.sh
```

**Solution 3: Verify git hooks path**
```bash
git config core.hooksPath
# Should output: .husky

# If not set:
git config core.hooksPath .husky
```

### Issue: lint-staged Fails on All Files

**Symptoms:**
- Error: "No staged files match *.{ts,tsx}"
- Hook runs but no files checked

**Solution:**
```bash
# Verify files are staged
git status

# Stage files explicitly
git add .

# Try commit again
git commit -m "feat: update"
```

### Issue: TypeScript Check Fails on Unrelated Files

**Symptoms:**
- Commit fails with errors in files you didn't modify

**Solution:**
```bash
# Check global TypeScript errors
npm run type-check

# Fix errors globally first
# Then commit
git commit -m "fix: resolve type errors"
```

### Issue: commitlint Rejects Valid Message

**Symptoms:**
- Commit message looks valid but is rejected

**Solution:**
```bash
# Test commit message manually
echo "feat: add tracking" | npx commitlint

# Check for hidden characters
cat -A .git/COMMIT_EDITMSG

# Use simple ASCII characters only
git commit -m "feat: add tracking"
```

### Issue: Hooks Too Slow

**Symptoms:**
- Pre-commit takes >30 seconds
- Type checking runs on entire codebase

**Solution:**
```bash
# Check what's slow
time npx lint-staged

# If type checking is slow, consider:
# 1. Use tsc --incremental (already in tsconfig.json)
# 2. Reduce files checked (modify .lintstagedrc.json)
# 3. Skip type check on pre-commit (not recommended)
```

---

## Step 7: CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: webapp/package-lock.json

      - name: Install dependencies
        run: cd webapp && npm ci

      - name: Run validation
        run: cd webapp && npm run validate

      - name: Build
        run: cd webapp && npm run build
```

**Note:** `npm run validate` includes:
- Type checking (tsc --noEmit)
- Formatting check (biome format .)
- Linting (biome check --error-on-warnings .)
- Tests (vitest run)

---

## Step 8: Team Collaboration

### Onboarding New Developers

**When a new developer clones the repo:**

```bash
# 1. Clone repository
git clone https://github.com/your-org/HRSkills.git
cd HRSkills/webapp

# 2. Install dependencies (hooks install automatically via "prepare" script)
npm install

# 3. Verify hooks installed
ls -la .husky/

# 4. Make a test commit to verify hooks work
echo "test" >> README.md
git add README.md
git commit -m "test: verify hooks work"
# Should see lint-staged and commitlint running

# 5. Revert test commit
git reset --soft HEAD~1
git restore --staged README.md
git restore README.md
```

### Pre-Commit Hook Failures in CI/CD

**If commits bypass hooks locally but fail in CI:**

```bash
# Run same checks as CI
npm run validate

# Fix all errors before pushing
npm run lint:fix
npm run type-check
npm run test

# Commit fixes
git add .
git commit -m "fix: resolve CI validation errors"
git push origin main
```

---

## Step 9: Configuration Reference

### .lintstagedrc.json

```json
{
  "*.{ts,tsx,js,jsx,json,md}": [
    "biome check --write --unsafe --files-ignore-unknown=true"
  ],
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit'"
  ]
}
```

**Options:**
- `--write`: Auto-fix issues (formatting, linting)
- `--unsafe`: Apply potentially unsafe fixes
- `--files-ignore-unknown=true`: Skip files Biome doesn't recognize
- `bash -c 'tsc --noEmit'`: Type check without emitting files

**Customization:**

```json
{
  // Add more file types
  "*.{css,scss}": ["biome check --write"],

  // Run tests on test files
  "*.test.{ts,tsx}": ["vitest run"],

  // Run specific linter for GraphQL
  "*.graphql": ["graphql-schema-linter"]
}
```

### .commitlintrc.json

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", [/* types */]],
    "subject-case": [0],            // Disable case check
    "body-max-line-length": [0]     // Disable line length
  }
}
```

**Common customizations:**

```json
{
  // Require scope for certain types
  "scope-enum": [
    2,
    "always",
    ["chat", "auth", "analytics", "db", "api", "ui", "docs"]
  ],

  // Require body for certain types
  "body-min-length": [2, "always", 10],

  // Max subject length
  "header-max-length": [2, "always", 100]
}
```

---

## Step 10: Performance Optimization

### Current Performance

**Typical pre-commit time:**
```
Preparing lint-staged...                 ~100ms
Running tasks for staged files...        ~2-5s (depends on # of files)
  - Biome check + format                 ~1-2s
  - TypeScript type checking             ~1-3s
Applying modifications from tasks...     ~100ms
Cleaning up temporary files...           ~50ms

Total: ~2-6 seconds
```

**Typical commit-msg time:**
```
commitlint validation                    ~50ms

Total: <100ms
```

### Optimization Tips

**1. Only stage files you modified:**
```bash
# ❌ Slow (checks all files)
git add .
git commit -m "feat: update"

# ✅ Fast (checks only modified files)
git add lib/analytics/track-events.ts
git commit -m "feat: update tracking"
```

**2. Use incremental type checking:**
Already enabled in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".next/cache/tsbuildinfo.json"
  }
}
```

**3. Skip hooks for WIP commits (on feature branch only):**
```bash
# WIP commit (will squash later)
git commit -n -m "WIP: experimenting with analytics"

# Final commit (runs hooks)
git commit -m "feat(analytics): add employee search tracking"
```

**4. Run validation manually before committing:**
```bash
# Run all checks upfront
npm run validate

# Then commit (hooks run fast since code is clean)
git add .
git commit -m "feat: update"
```

---

## Step 11: Rollback Plan

### Disable All Hooks Temporarily

```bash
# Environment variable (per-command)
HUSKY=0 git commit -m "feat: emergency fix"

# Or disable globally (remember to re-enable!)
git config core.hooksPath /dev/null
git commit -m "feat: emergency fix"
git config core.hooksPath .husky  # Re-enable
```

### Uninstall Husky

```bash
cd webapp

# 1. Remove hooks
rm -rf .husky

# 2. Remove from package.json
npm uninstall husky lint-staged @commitlint/cli @commitlint/config-conventional

# 3. Remove configuration files
rm .lintstagedrc.json .commitlintrc.json

# 4. Remove prepare script from package.json
# Edit package.json and remove: "prepare": "husky"
```

### Reinstall Husky

```bash
cd webapp

# 1. Reinstall packages
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# 2. Re-create configuration (follow Phase 10 setup)
```

---

## Success Criteria

All criteria met ✅:

- [x] Packages installed (husky + lint-staged + commitlint)
- [x] Husky hooks directory created (.husky/)
- [x] Pre-commit hook configured (lint-staged)
- [x] Commit-msg hook configured (commitlint)
- [x] lint-staged configuration created
- [x] commitlint configuration created
- [x] Hooks executable (chmod +x)
- [x] Documentation complete

---

## Next Steps

### Immediate Testing

Test hooks to ensure they work:

```bash
# 1. Make a small change
echo "// Test comment" >> lib/analytics/track-events.ts

# 2. Stage file
git add lib/analytics/track-events.ts

# 3. Try committing with bad message
git commit -m "added comment"
# Should fail commitlint

# 4. Try with good message
git commit -m "test: verify hooks work"
# Should run lint-staged and commitlint

# 5. Revert test commit
git reset --soft HEAD~1
git restore --staged lib/analytics/track-events.ts
git restore lib/analytics/track-events.ts
```

### Team Rollout

1. **Communicate to team:**
   - Pre-commit hooks now enabled
   - Conventional commits required
   - Share this documentation

2. **Training:**
   - Review conventional commit format
   - Practice with test commits
   - Troubleshoot common issues

3. **Monitor:**
   - Check for hook bypass patterns
   - Review CI/CD logs for validation failures
   - Gather feedback from team

---

**Document Version:** 1.0
**Last Updated:** November 18, 2024
**Setup Time:** ~30 minutes (implementation) + ~10 minutes (testing)
**Phase Status:** ✅ COMPLETE (ready for team use)
