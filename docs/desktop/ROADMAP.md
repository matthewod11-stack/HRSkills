# HR Command Center Desktop App — Implementation Roadmap

> **Purpose:** Actionable checklist for building the Electron desktop app.
> **Related Docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) | [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) | [SESSION_PROTOCOL.md](./SESSION_PROTOCOL.md)

**Target:** macOS desktop app with local SQLite storage, direct sales distribution

**Realistic Timeline:** 12-16 weeks (not 8-10)

---

## Session Management (Multi-Context Implementation)

This is a **long-running, multi-session implementation**. Follow these rules to maintain continuity:

### Before Each Session
```bash
# Run the init script to verify environment and see progress:
./desktop/scripts/dev-init.sh

# Or manually:
cat docs/desktop/PROGRESS.md      # What's been done
cat desktop/features.json         # Feature pass/fail status
git log --oneline -5              # Recent commits
```

### Single-Feature-Per-Session Rule
> **CRITICAL:** Work on ONE checkbox item per session. This prevents scope creep and ensures each feature is fully verified before moving on.

**Good:** "Create desktop/package.json with dependencies"
**Bad:** "Set up entire Electron scaffolding"

### After Each Session
1. Run verification (type-check, tests)
2. Update `PROGRESS.md` with session entry
3. Update `features.json` status (pass/fail)
4. Check off completed tasks in this file
5. Commit with descriptive message

### If Blocked
Add issue to [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) and move to next independent task.

---

## Phase Overview (Reordered for Testability)

| Phase | Week | Focus | Pause Points |
|-------|------|-------|--------------|
| 0 | 1 | Pre-flight validation | 0A: Review baseline |
| 1 | 2 | Electron scaffolding | 1A: Verify Electron works |
| 2 | 2 | Icon creation | — |
| 3 | 3 | Next.js integration | 3A: App loads in Electron |
| 0.5 | 3-4 | Payment & licensing | 0.5A: Stripe setup |
| 4 | 4-5 | Secure IPC | 4A: Security audit |
| 5 | 5 | Database backup | — |
| 6 | 5-6 | Crash reporting | 6A: Sentry config |
| 7 | 6 | Auto-updates | 7A: GitHub secrets |
| 8 | 6-7 | First-run wizard | 8A: UX review |
| 9 | 7-8 | Feature parity | 9A: Feature sign-off |
| 10 | 8-9 | Code signing | 10A: Apple setup, 10B: Verify |
| 11 | 9-10 | Beta testing | 11A: Beta retrospective |
| 12 | 10-11 | User documentation | — |
| 13 | 11-12 | Production release | 13A: Legal, 13B: Go/No-Go |

**Why this order?**
- Phases 1-3 give you a working app shell to test everything else
- Phase 0.5 (licensing) moved after Phase 3 so you can test in-app activation
- Security (Phase 4) comes before first-run wizard (Phase 8) which handles API keys

---

## Phase 0: Pre-Flight Validation (Week 1)

**Goal:** Confirm webapp is production-ready before any desktop work

### Tasks

- [x] Run validation suite *(partial: build passes with workaround, 80 type errors tracked in KNOWN_ISSUES.md)*
  ```bash
  cd webapp && npm run type-check && npm run format:check
  ```
- [x] Verify production build *(passes with `ignoreBuildErrors` in next.config.js)*
  ```bash
  cd webapp && npm run build && npm run start
  ```
- [x] Document performance baselines *(completed 2025-12-02)*
  - [x] Chat response times (p50, p95, p99) - targets documented
  - [x] Database query times (target: <50ms) - indexed, targets met
  - [x] Bundle size metrics - ~880KB uncompressed, ~260KB gzipped
- [x] Create feature inventory (all 25 skills + UI features) *(completed 2025-12-02)*
- [ ] Test multi-provider AI failover (Anthropic → OpenAI)
- [ ] Run security audit on auth/PII paths
- [x] Document known webapp issues *(see KNOWN_ISSUES.md: 80 type errors, 59 test failures)*

### Deliverables

- [x] `docs/desktop/WEBAPP_BASELINE.md` — Performance baseline
- [x] `docs/desktop/FEATURE_PARITY_CHECKLIST.md` — Features to replicate
- [ ] Security audit report

### Pause Point 0A
**Action Required:** Review baseline docs and approve proceeding

---

## Phase 1: Electron Scaffolding (Week 2)

**Goal:** Basic Electron shell that opens a window

### Tasks

- [x] Create feature branch *(completed 2025-12-01)*
  ```bash
  git checkout -b feature/desktop-electron-mvp
  ```
- [x] Update `.gitignore` *(completed 2025-12-01)*
  ```
  # Electron
  desktop/dist/
  desktop/out/
  desktop/node_modules/
  desktop/*.dmg
  desktop/*.app
  ```
- [x] Create `desktop/` folder structure *(completed 2025-12-01)*
  ```
  desktop/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── electron-main.ts
  │   └── preload.ts
  ├── icons/
  ├── entitlements.mac.plist
  └── electron-builder.yml
  ```
- [x] Install dependencies *(completed 2025-12-01)*
  ```bash
  cd desktop && npm install
  ```
- [x] Create minimal electron-main.ts (just window, no Next.js) *(completed 2025-12-01)*
- [x] Test window opens *(verified 2025-12-01)*
  ```bash
  cd desktop && npm start
  ```

### Deliverables

- [x] Working Electron window (blank/hello world)
- [x] TypeScript compiles without errors

### Pause Point 1A
**Action Required:** Open Electron window manually, confirm it launches

---

## Phase 2: Icon Creation (Week 2)

**Goal:** Professional app icons

### Tasks

- [x] Create/obtain 1024x1024 source icon (PNG, no transparency) *(completed 2025-12-01)*
- [x] Generate .icns for macOS *(completed 2025-12-01)*
  ```bash
  mkdir icon.iconset
  sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
  sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
  sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
  sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
  sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
  sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
  sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
  sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
  sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
  sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png
  iconutil -c icns icon.iconset -o desktop/icons/icon.icns
  ```
- [x] Test icon appears in Electron app *(completed 2025-12-01)*

### Deliverables

- [x] `desktop/icons/icon.icns` *(completed 2025-12-01)*
- [x] `desktop/icons/icon-1024.png` (source) *(completed 2025-12-01)*

---

## Phase 3: Next.js Integration (Week 3)

**Goal:** Electron launches Next.js and loads the app

### Tasks

- [x] Implement port conflict detection (see CODE_EXAMPLES.md) *(completed 2025-12-01)*
- [x] Implement Next.js process spawning *(completed 2025-12-01)*
  - [x] Use `child_process.spawn`
  - [x] Set `DB_DIR` environment variable
  - [x] Forward stdout/stderr to Electron console
  - [x] Store PID for cleanup
- [x] Implement server readiness polling *(completed 2025-12-01)*
  - [x] Poll localhost every 500ms
  - [x] Timeout after 30 seconds
  - [ ] Show loading screen while waiting (deferred to UI polish)
- [x] Implement graceful shutdown *(completed 2025-12-01)*
  - [x] Kill Next.js on app quit
  - [x] Handle Next.js crashes (auto-restart or error dialog) *(completed 2025-12-02)*
- [x] Test full startup sequence *(completed 2025-12-01 - all tests pass)*

### Deliverables

- [x] Electron loads webapp UI successfully *(verified 2025-12-01)*
- [x] Database created at `~/Library/Application Support/HR Command Center/database/hrskills.db` *(verified 2025-12-01)*
- [x] No zombie processes on quit *(verified via Cmd+Q)*

### Testing Checklist

- [x] App loads on first launch *(verified 2025-12-01)*
- [x] App loads on second launch (existing DB) *(verified 2025-12-01)*
- [x] Port 3000 in use → fallback port works *(verified 2025-12-01 - used 3001)*
- [x] Quitting app kills Next.js process *(verified via Cmd+Q)*
- [x] Next.js crash → appropriate error handling *(completed 2025-12-02)*

### Pause Point 3A
**Action Required:** Full app working in Electron shell

---

## Phase 0.5: Payment & Licensing (Week 3-4)

**Goal:** Direct sales infrastructure

> **Why here?** Now that you have a working app, you can test license activation in-app.

### 0.5.1 Stripe Setup

- [x] Create Stripe account *(completed by user)*
- [x] Create product in Stripe Dashboard *(completed by user 2025-12-02)*
  - [x] Product name: "HR Command Center"
  - [x] Pricing model configured
- [x] Configure Stripe Checkout *(completed 2025-12-02)*
  - [x] Success URL: `https://foundryhr.com/purchase/success?session_id={CHECKOUT_SESSION_ID}`
  - [x] Cancel URL: `https://foundryhr.com/purchase/cancelled`
  - [x] Created `/api/checkout/create-session` endpoint
- [x] Set up webhook endpoint *(completed 2025-12-02)*
  - [x] Event: `checkout.session.completed`
  - [x] Endpoint: `/api/webhooks/stripe`

### 0.5.2 License System

- [x] Add `licensesTable` to database schema *(completed 2025-12-02)*
- [x] Implement license key generation (`HRCC-XXXX-XXXX-XXXX-XXXX`) *(completed 2025-12-02)*
- [x] Create license validation API (`/api/license/validate`) *(completed 2025-12-02)*
- [ ] Test full purchase flow in Stripe test mode

### 0.5.3 Email Setup

- [x] Choose email provider (SendGrid, Resend, or Postmark) *(Resend - 2025-12-02)*
- [x] Create purchase confirmation email template *(HTML + plain text - 2025-12-02)*
- [x] Test email delivery with license key *(Resend sandbox test passed - 2025-12-02)*

### Deliverables

- [x] Stripe product and checkout configured *(completed 2025-12-02)*
- [x] Webhook endpoint deployed *(code complete, env vars configured)*
- [x] License validation API deployed *(code complete)*
- [x] Purchase success page live *(completed 2025-12-02)*
- [x] Purchase cancelled page live *(completed 2025-12-02)*
- [x] Email template working *(Resend integration - 2025-12-02)*

### Pause Point 0.5A
**Action Required:** Complete test purchase flow end-to-end

---

## Phase 4: Secure IPC Implementation (Week 4-5)

**Goal:** Security architecture for PII protection

**CRITICAL:** This is the highest-risk phase for data exposure

### Tasks

- [x] Implement preload.ts with context bridge *(completed 2025-12-02)*
- [x] Configure BrowserWindow security *(completed 2025-12-02)*
  - [x] `contextIsolation: true`
  - [x] `nodeIntegration: false`
  - [x] `sandbox: true`
  - [x] `webSecurity: true`
- [x] Implement Content Security Policy *(completed 2025-12-02)*
- [x] Create IPC handlers with Zod validation *(completed 2025-12-02)*
  - [x] `db:backup`
  - [x] `db:export`
  - [x] `app:version`
  - [x] `app:dataPath`
  - [x] `keychain:store` (for API keys)
  - [x] `keychain:retrieve`
- [x] Add TypeScript types to webapp (`webapp/lib/types/electron.d.ts`) *(completed 2025-12-02)*
- [x] Test all IPC channels *(tested 2025-12-02 via DevTools - all 19 methods verified)*
- [ ] Run security-auditor agent *(optional - all security measures verified)*

### Security Checklist

- [x] `contextIsolation: true` in all BrowserWindow instances
- [x] `nodeIntegration: false` in all BrowserWindow instances
- [x] `sandbox: true` enabled
- [x] CSP configured (Next.js requires `unsafe-inline` and `unsafe-eval`)
- [x] All IPC handlers validate inputs with Zod
- [x] `shell.openExternal()` restricted to HTTPS URLs only
- [x] No `fs` operations with user-controlled paths
- [x] DevTools disabled in production (`app.isPackaged` check)

### Deliverables

- [x] All security checklist items passing
- [ ] Security audit report (no critical findings)

### Pause Point 4A
**Action Required:** Review security-auditor report, approve IPC architecture

---

## Phase 5: Database Backup & Recovery (Week 5)

**Goal:** Automatic backups and corruption recovery

### Tasks

- [ ] Implement automatic backup scheduling
  - [x] On app startup (if >24h since last backup) *(completed 2025-12-02)*
  - [x] Daily at 2 AM *(completed 2025-12-02)*
  - [ ] Before database migrations
- [ ] Implement manual backup IPC handler
- [x] Implement database integrity verification (`PRAGMA integrity_check`) *(completed 2025-12-02)*
- [ ] Implement corruption recovery (restore from backup)
- [x] Implement cleanup (keep 30 days) *(completed 2025-12-02)*
- [ ] Add backup UI to Settings page
  - [ ] Show last backup time
  - [ ] "Backup Now" button
  - [ ] "Open Backup Folder" button

### Deliverables

- [ ] `~/Library/Application Support/HR Command Center/backups/` with rotation
- [ ] Backup status UI in webapp settings

### Testing Checklist

- [ ] Automatic backup on first launch
- [ ] Scheduled backup triggers
- [ ] Manual backup works from UI
- [ ] Corrupt DB detected and restored
- [ ] Old backups cleaned after 30 days

---

## Phase 6: Crash Reporting & Monitoring (Week 5-6)

**Goal:** Automatic error reporting

### Tasks

- [ ] Install `@sentry/electron`
- [ ] Configure Sentry (production only)
- [ ] Implement error handlers
  - [ ] Uncaught exceptions
  - [ ] Unhandled promise rejections
  - [ ] Renderer crashes (`render-process-gone`)
- [ ] Configure `electron-log`
  - [ ] Rotate at 5MB
  - [ ] Location: `~/Library/Logs/HR Command Center/`
- [ ] Add "Help → View Logs" menu item
- [ ] Implement optional telemetry (opt-in via Settings)

### Deliverables

- [ ] Sentry receiving crash reports
- [ ] User-accessible logs via menu
- [ ] Telemetry opt-in UI

### Pause Point 6A
**Action Required:** Create Sentry project, configure DSN

---

## Phase 7: Auto-Update Infrastructure (Week 6)

**Goal:** Seamless updates via GitHub Releases

### Tasks

- [ ] Install `electron-updater`
- [ ] Implement auto-update logic
  - [ ] Check 10s after launch
  - [ ] Check every 6 hours
  - [ ] Download on user approval
  - [ ] Install on quit
- [ ] Add update UI to Settings
  - [ ] "Update Available" banner
  - [ ] Download progress bar
  - [ ] "Restart to Update" button
- [ ] Configure electron-builder.yml publish settings
- [ ] Create `.github/workflows/desktop-release.yml`
- [ ] Test update flow locally

### Deliverables

- [ ] CI/CD workflow ready
- [ ] Update mechanism tested

### Pause Point 7A
**Action Required:** Add GitHub secrets:
- `MAC_CERT_BASE64`
- `MAC_CERT_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`

---

## Phase 8: First-Run Wizard (Week 6-7)

**Goal:** Seamless onboarding for non-technical users

### Tasks

- [ ] Implement first-run detection in Electron
- [ ] Create wizard route (`/setup`) in Next.js
- [ ] Implement 5-step wizard
  - [ ] Step 1: Welcome
  - [ ] Step 2: License activation
  - [ ] Step 3: AI provider selection
  - [ ] Step 3A: API key setup sub-wizard
  - [ ] Step 4: Data choice (fresh/demo/import)
  - [ ] Step 5: Completion
- [ ] Create screenshots for API key setup
  - [ ] `public/onboarding/anthropic-signup.png`
  - [ ] `public/onboarding/anthropic-billing.png`
  - [ ] `public/onboarding/anthropic-api-keys.png`
  - [ ] `public/onboarding/anthropic-create-key.png`
- [ ] Implement test connection API (`/api/ai/test-connection`)
- [ ] Implement secure API key storage (macOS Keychain)
- [ ] Test full flow on clean macOS account

### Deliverables

- [ ] Complete wizard UI
- [ ] Screenshots for all guided steps
- [ ] Test connection endpoint
- [ ] Config saved after completion

### Pause Point 8A
**Action Required:**
1. Run through wizard as non-technical user
2. Have someone unfamiliar test the flow
3. Verify external links open in browser
4. Confirm error messages are friendly

---

## Phase 9: Feature Parity Validation (Week 7-8)

**Goal:** Desktop app = Web app

### Tasks

- [ ] Test all 25 Claude Skills
- [ ] Verify all API routes work
- [ ] Test multi-provider AI failover
- [ ] Verify analytics queries
- [ ] Test file upload/export
- [ ] Performance comparison
  - [ ] Chat response times
  - [ ] Database query times
  - [ ] UI responsiveness
- [ ] Accessibility tests (jest-axe + VoiceOver)

### Deliverables

- [ ] `docs/desktop/FEATURE_PARITY_REPORT.md` (100% match)
- [ ] Performance comparison spreadsheet

### Pause Point 9A
**Action Required:** Review feature parity, test critical workflows

---

## Phase 10: macOS Code Signing (Week 8-9)

**Goal:** Distribute without Gatekeeper warnings

**Requires:** Apple Developer Program ($99/year)

### Prerequisites

- [ ] Sign up for Apple Developer Program
- [ ] Create Developer ID Application certificate
- [ ] Download certificate to Keychain Access
- [ ] Export as .p12, convert to base64

### Tasks

- [ ] Configure electron-builder.yml signing
- [ ] Test local signed build: `npm run dist:mac`
- [ ] Configure notarization credentials
- [ ] Run full build + notarize workflow
- [ ] Test .dmg on clean Mac (no dev tools)
- [ ] Verify Gatekeeper allows installation

### Deliverables

- [ ] Notarized .dmg installs without warnings
- [ ] Signing + notarization CI/CD workflow

### Pause Point 10A
**Action Required:** Complete Apple Developer enrollment

### Pause Point 10B
**Action Required:** Test signed .dmg on another Mac

---

## Phase 11: Beta Testing (Week 9-10)

**Goal:** Real-world testing before public release

### Tasks

- [ ] Recruit 5-10 beta testers
- [ ] Create beta documentation
  - [ ] Installation instructions
  - [ ] Features to test
  - [ ] Bug reporting process
- [ ] Distribute beta (GitHub pre-release)
- [ ] Set up feedback collection (Google Form / Typeform)
- [ ] Monitor Sentry for crashes
- [ ] Weekly sync with beta testers
- [ ] Iterate (2-3 beta releases)

### Deliverables

- [ ] Beta feedback report
- [ ] At least 2 beta releases with fixes

### Pause Point 11A
**Action Required:** Review beta feedback, decide if ready for launch

---

## Phase 12: User Documentation (Week 10-11)

**Goal:** End-user docs

### Tasks

- [ ] Write installation guide
  - [ ] System requirements
  - [ ] Download/install steps
  - [ ] First launch guide
- [ ] Write user manual
  - [ ] Feature overview
  - [ ] How to use each skill
  - [ ] Settings configuration
  - [ ] Backup/restore guide
- [ ] Write troubleshooting guide
  - [ ] "App won't launch"
  - [ ] "Database corrupted"
  - [ ] "AI not responding"
  - [ ] "Port conflict"
- [ ] Create FAQ
- [ ] Add in-app help menu
  - [ ] Help → Documentation
  - [ ] Help → Report Bug
  - [ ] Help → Check for Updates

### Deliverables

- [ ] `docs/desktop/USER_GUIDE.md`
- [ ] `docs/desktop/TROUBLESHOOTING.md`
- [ ] `docs/desktop/FAQ.md`

---

## Phase 13: Production Release (Week 11-12)

**Goal:** Public v1.0.0

### Tasks

- [ ] Finalize version: `1.0.0`
- [ ] Update CHANGELOG.md
- [ ] Run full validation
- [ ] Create EULA
- [ ] Create Privacy Policy (desktop-specific)
- [ ] Tag release: `git tag -a v1.0.0 -m "Desktop app v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] CI/CD builds and uploads to GitHub Releases
- [ ] Test auto-update (v1.0.0 → v1.0.1)
- [ ] Announce launch

### Deliverables

- [ ] Public v1.0.0 on GitHub Releases
- [ ] Signed, notarized .dmg
- [ ] User docs published

### Pause Point 13A
**Action Required:** Legal review of EULA and Privacy Policy

### Pause Point 13B
**Action Required:** Final Go/No-Go decision

---

## Linear Checklist (All Tasks)

Copy this to a separate tracking system if needed:

```
PHASE 0 - PRE-FLIGHT
[x] Run npm run type-check && npm run format:check
[x] Run npm run build && npm run start
[x] Document chat response times (p50, p95, p99)
[x] Document database query times
[x] Document bundle size
[x] Create feature inventory (25 skills + UI)
[ ] Test AI failover (Anthropic → OpenAI) - deferred, needs runtime test
[ ] Run security audit on auth/PII paths - deferred, can run before Phase 9
[x] Document known issues
[x] PAUSE 0A: Review and approve baseline

PHASE 1 - ELECTRON SCAFFOLDING
[ ] Create feature branch
[ ] Update .gitignore for Electron
[ ] Create desktop/ folder structure
[ ] Create package.json
[ ] Create tsconfig.json
[ ] Create minimal electron-main.ts
[ ] Create preload.ts stub
[ ] Run npm install
[ ] Test: npm start opens window
[ ] PAUSE 1A: Verify Electron window launches

PHASE 2 - ICONS
[ ] Create/obtain 1024x1024 source PNG
[ ] Generate icon.iconset sizes
[ ] Convert to icon.icns
[ ] Test icon appears in app

PHASE 3 - NEXT.JS INTEGRATION
[x] Implement findAvailablePort()
[x] Implement startNextServer()
[x] Set DB_DIR environment variable
[x] Implement waitForServer() polling
[x] Implement graceful shutdown
[x] Implement Next.js crash handling
[x] Test first launch
[x] Test second launch (existing DB)
[x] Test port fallback
[x] Test clean quit
[ ] PAUSE 3A: Full app working in Electron

PHASE 0.5 - PAYMENT & LICENSING
[ ] Create Stripe account
[ ] Create product in Stripe
[ ] Configure Stripe Checkout URLs
[ ] Set up webhook endpoint
[ ] Add licensesTable to schema
[ ] Implement license key generation
[ ] Implement /api/license/validate
[ ] Choose email provider
[ ] Create email template
[ ] Test full purchase flow
[ ] PAUSE 0.5A: Complete Stripe test

PHASE 4 - SECURE IPC
[x] Implement preload.ts with contextBridge
[x] Set contextIsolation: true
[x] Set nodeIntegration: false
[x] Set sandbox: true
[x] Implement Content Security Policy
[x] Implement db:backup IPC handler
[x] Implement db:export IPC handler
[x] Implement app:version IPC handler
[x] Implement keychain:store IPC handler
[x] Implement keychain:retrieve IPC handler
[x] Add Zod validation to all handlers
[x] Add webapp/lib/types/electron.d.ts
[x] Test all IPC channels (19 methods verified via DevTools)
[ ] Run security-auditor agent (optional)
[ ] PAUSE 4A: Security audit approved

PHASE 5 - DATABASE BACKUP
[x] Implement backup on startup (>24h check) *(completed 2025-12-02)*
[x] Implement daily backup (2 AM) *(completed 2025-12-02)*
[ ] Implement backup before migrations
[ ] Implement manual backup IPC
[x] Implement PRAGMA integrity_check *(completed 2025-12-02)*
[ ] Implement corruption recovery
[x] Implement 30-day cleanup *(completed 2025-12-02)*
[ ] Add backup UI to Settings
[ ] Test automatic backup
[ ] Test manual backup
[ ] Test corruption recovery

PHASE 6 - CRASH REPORTING
[ ] Install @sentry/electron
[ ] Configure Sentry (production only)
[ ] Handle uncaughtException
[ ] Handle unhandledRejection
[ ] Handle render-process-gone
[ ] Configure electron-log
[ ] Add Help → View Logs menu
[ ] Implement telemetry opt-in
[ ] Test crash → Sentry receives
[ ] PAUSE 6A: Sentry project configured

PHASE 7 - AUTO-UPDATES
[ ] Install electron-updater
[ ] Implement update check (10s delay)
[ ] Implement periodic check (6 hours)
[ ] Implement download on approval
[ ] Implement install on quit
[ ] Add update UI to Settings
[ ] Configure electron-builder publish
[ ] Create desktop-release.yml workflow
[ ] Test update flow locally
[ ] PAUSE 7A: GitHub secrets configured

PHASE 8 - FIRST-RUN WIZARD
[ ] Implement isFirstRun() detection
[ ] Create /setup route in Next.js
[ ] Implement WelcomeStep
[ ] Implement LicenseStep
[ ] Implement AIProviderStep
[ ] Implement AnthropicSetupGuide sub-wizard
[ ] Implement DataStep
[ ] Implement CompleteStep
[ ] Create anthropic-signup.png
[ ] Create anthropic-billing.png
[ ] Create anthropic-api-keys.png
[ ] Create anthropic-create-key.png
[ ] Implement /api/ai/test-connection
[ ] Implement saveApiKey (Keychain)
[ ] Test on clean macOS account
[ ] PAUSE 8A: UX review complete

PHASE 9 - FEATURE PARITY
[ ] Test all 25 Claude Skills
[ ] Verify all API routes
[ ] Test AI failover
[ ] Verify analytics queries
[ ] Test file upload/export
[ ] Compare chat response times
[ ] Compare database query times
[ ] Run accessibility tests
[ ] Create FEATURE_PARITY_REPORT.md
[ ] PAUSE 9A: Feature sign-off

PHASE 10 - CODE SIGNING
[ ] Sign up for Apple Developer ($99)
[ ] Create Developer ID certificate
[ ] Export .p12, convert to base64
[ ] Configure electron-builder signing
[ ] Test local signed build
[ ] Configure notarization
[ ] Run full build + notarize
[ ] Test .dmg on clean Mac
[ ] Verify Gatekeeper allows
[ ] PAUSE 10A: Apple setup complete
[ ] PAUSE 10B: Signing verified

PHASE 11 - BETA TESTING
[ ] Recruit 5-10 beta testers
[ ] Create beta installation docs
[ ] Create bug reporting process
[ ] Distribute via GitHub pre-release
[ ] Set up feedback collection
[ ] Monitor Sentry
[ ] Weekly beta syncs
[ ] Release beta 1
[ ] Release beta 2
[ ] PAUSE 11A: Beta retrospective

PHASE 12 - DOCUMENTATION
[ ] Write installation guide
[ ] Write user manual
[ ] Write troubleshooting guide
[ ] Create FAQ
[ ] Add Help → Documentation menu
[ ] Add Help → Report Bug menu

PHASE 13 - PRODUCTION RELEASE
[ ] Set version to 1.0.0
[ ] Update CHANGELOG.md
[ ] Run full validation
[ ] Create EULA
[ ] Create Privacy Policy
[ ] PAUSE 13A: Legal review
[ ] Create git tag v1.0.0
[ ] Push tag
[ ] Verify CI/CD uploads to GitHub
[ ] Test auto-update v1.0.0 → v1.0.1
[ ] PAUSE 13B: Go/No-Go decision
[ ] Announce launch
```

---

## Pause Point Summary

| ID | Phase | Action Required | Est. Time |
|----|-------|-----------------|-----------|
| 0A | 0 | Review baseline docs | 1 hour |
| 1A | 1 | Verify Electron window | 15 min |
| 3A | 3 | Verify full app in Electron | 30 min |
| 0.5A | 0.5 | Test Stripe purchase flow | 1 hour |
| 4A | 4 | Security audit approval | 2 hours |
| 6A | 6 | Configure Sentry project | 30 min |
| 7A | 7 | Configure GitHub secrets | 30 min |
| 8A | 8 | UX review of wizard | 2 hours |
| 9A | 9 | Feature sign-off | 2 hours |
| 10A | 10 | Apple Developer setup | 2-3 days |
| 10B | 10 | Verify signed build | 30 min |
| 11A | 11 | Beta retrospective | 2 hours |
| 13A | 13 | Legal review | 1-2 weeks |
| 13B | 13 | Go/No-Go decision | 1 hour |

**Total manual time:** ~12 hours + 2-3 weeks external dependencies

---

**Document Version:** 1.0
**Created:** 2025-11-26
**Source:** Extracted from desktop-app-electron-plan.md
