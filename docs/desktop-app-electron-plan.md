# HR Command Center Desktop App – Electron Implementation Plan (macOS First)

This document describes, step by step, how to turn this repository into a **desktop application with a local backend** using **Electron**, targeting **macOS first** (Windows optional later).

It assumes:

- You are **new to desktop app development**.
- You want a **local Next.js + SQLite backend** running on the user's machine.
- The app still needs **internet access to Anthropic/OpenAI**, but **HR data stays local**.

You can treat this as a checklist you work through in order.

---

## Table of Contents

**IMPLEMENTATION ROADMAP**
- [Critical Gaps in This Plan](#critical-gaps-in-this-plan)
- [Implementation Phases Overview](#implementation-phases-overview)
- [Phase 0: Pre-Flight Validation](#phase-0-pre-flight-validation--planning-week-1)
- [Phase 1: Branch Setup & Desktop Scaffolding](#phase-1-branch-setup--desktop-scaffolding-week-1)
- [Phase 2: Icon Creation & Branding](#phase-2-icon-creation--branding-week-1)
- [Phase 3: Next.js Integration](#phase-3-nextjs-integration-week-2)
- [Phase 4: Secure IPC Implementation](#phase-4-secure-ipc-implementation-week-2-3)
- [Phase 5: Database Backup & Recovery](#phase-5-database-backup--recovery-week-3)
- [Phase 6: Crash Reporting & Monitoring](#phase-6-crash-reporting--monitoring-week-3)
- [Phase 7: Auto-Update Infrastructure](#phase-7-auto-update-infrastructure-week-4)
- [Phase 8: First-Run Experience](#phase-8-first-run-experience--onboarding-week-4)
- [Phase 9: Feature Parity Validation](#phase-9-feature-parity-validation-week-5)
- [Phase 10: macOS Code Signing & Notarization](#phase-10-macos-code-signing--notarization-week-5-6)
- [Phase 11: Beta Testing](#phase-11-beta-testing-week-6)
- [Phase 12: User Documentation](#phase-12-user-documentation-week-6-7)
- [Phase 13: Production Build & Release](#phase-13-production-build--release-week-7-8)
- [Ongoing Maintenance](#ongoing-maintenance-post-launch)
- [Decision Tree: Windows Support](#decision-tree-windows-support)
- [Risk Mitigation](#risk-mitigation)
- [Summary of Manual Pause Points](#summary-of-manual-pause-points)

**TECHNICAL SPECIFICATION**
0. [Conceptual Overview](#0-conceptual-overview)
1. [Prerequisites and Setup](#1-prerequisites-and-setup)
2. [Prepare the Web App for Desktop Use](#2-prepare-the-web-app-for-desktop-use)
3. [Create the `desktop/` Folder](#3-create-the-desktop-folder)
4. [Implement the Electron Main Process](#4-implement-the-electron-main-process)
   - 4.5 [**Secure IPC Architecture (CRITICAL)**](#45-secure-ipc-architecture-critical-for-pii)
5. [Development Workflow: Running Electron + Next.js Together](#5-development-workflow-running-electron--nextjs-together)
6. [Production Build and Packaging (macOS)](#6-production-build-and-packaging-macos)
7. [macOS Code Signing and Notarization](#7-macos-code-signing-and-notarization-later-step)
8. [Privacy, Security, and Data Handling](#8-privacy-security-and-data-handling)
   - 8.4 [**Database Backup & Recovery Strategy**](#84-database-backup--recovery-strategy)
9. [Testing Checklist](#9-testing-checklist)
   - 9.5 [**Crash Reporting & Monitoring**](#95-crash-reporting--monitoring)
10. [**Auto-Update Strategy**](#10-auto-update-strategy)
11. [Future Enhancements and Tauri Considerations](#11-future-enhancements-and-tauri-considerations)
12. [Appendix A: Complete Code Examples](#appendix-a-complete-code-examples)

---

# IMPLEMENTATION ROADMAP

## Executive Summary

Transform the HRSkills web application into a production-ready macOS desktop application using Electron, with local SQLite storage and multi-provider AI failover intact.

**Estimated Timeline:** 6-8 weeks (assuming full-time focus)
**Critical Path Items:** 7 manual pause points requiring your action
**Risk Level:** Medium (PII handling + code signing complexity)

---

## Critical Gaps in This Plan

The technical specification below is comprehensive but missing key implementation details:

### 1. **Pre-Flight Validation** (MISSING)
- No webapp production-readiness checklist
- No performance baseline measurements
- No feature inventory for parity verification

### 2. **Icon Assets** (MISSING)
- Plan mentions `desktop/icons/icon.icns` but no creation guide
- Need 1024x1024 source image → .icns conversion process
- Windows .ico files if planning future support

### 3. **Port Conflict Resolution** (MISSING)
- Assumes port 3000 is always available
- No dynamic port allocation strategy
- No graceful fallback if Next.js fails to start

### 4. **First-Run Experience** (MISSING)
- No onboarding flow for API key setup
- No data migration from web version (if users have existing accounts)
- No welcome screen or setup wizard

### 5. **Beta Testing Phase** (MISSING)
- No plan for internal testing before public release
- No dogfooding period with real users
- No feedback collection mechanism

### 6. **User Documentation** (MISSING)
- No installation guide for end users
- No troubleshooting documentation
- No FAQ for common issues

### 7. **Offline Mode Strategy** (INCOMPLETE)
- Plan mentions "graceful degradation" but no implementation details
- Need UI feedback when AI providers are unreachable
- Need local-only features that work without internet

### 8. **Multi-User macOS Support** (MISSING)
- Can multiple macOS users run the app simultaneously?
- Database file locking strategy
- Per-user data isolation

### 9. **Resource Limits & Monitoring** (MISSING)
- No memory limits for Next.js child process
- No CPU usage monitoring
- No automatic restart on memory leaks

### 10. **Windows Support Timeline** (VAGUE)
- Mentioned as "optional later" but no concrete decision tree
- If yes: When? What's different?
- If no: Remove references to reduce confusion

### 11. **Legal & Licensing** (MISSING)
- End-user license agreement (EULA)
- Privacy policy for desktop app
- Terms of service for AI API usage

### 12. **Rollback Strategy** (INCOMPLETE)
- Update rollback covered, but not initial deployment rollback
- What if v1.0.0 has critical bugs after public launch?
- Hotfix deployment process

---

## Implementation Phases Overview

| Phase | Timeline | Focus | Manual Pause Points |
|-------|----------|-------|---------------------|
| 0 | Week 1 | Pre-flight validation & planning | 0A: Review baseline |
| 1 | Week 1 | Branch setup & Electron scaffolding | 1A: Verify Electron works |
| 2 | Week 1 | Icon creation & branding | — |
| 3 | Week 2 | Next.js integration | — |
| 4 | Week 2-3 | Secure IPC implementation | 4A: Security audit |
| 5 | Week 3 | Database backup & recovery | — |
| 6 | Week 3 | Crash reporting & monitoring | 6A: Sentry config |
| 7 | Week 4 | Auto-update infrastructure | 7A: GitHub secrets |
| 8 | Week 4 | First-run experience & onboarding | — |
| 9 | Week 5 | Feature parity validation | 9A: Feature sign-off |
| 10 | Week 5-6 | macOS code signing & notarization | 10A: Apple setup, 10B: Verify |
| 11 | Week 6 | Beta testing | 11A: Beta retrospective |
| 12 | Week 6-7 | User documentation | — |
| 13 | Week 7-8 | Production build & release | 13A: Legal review, 13B: Go/No-Go |

---

## Phase 0: Pre-Flight Validation & Planning (Week 1)

**Goal:** Ensure webapp is production-ready before any desktop work begins

### Tasks:
- [ ] Run full validation suite: `npm run validate`
- [ ] Document current webapp performance baselines
  - Chat response times (p50, p95, p99)
  - Database query performance
  - Bundle size metrics
- [ ] Create feature inventory spreadsheet (all 25 skills + UI features)
- [ ] Verify all environment variables work in production mode
- [ ] Test multi-provider AI failover chain (Anthropic → OpenAI → Gemini)
- [ ] Run security audit on auth/PII handling paths
- [ ] Document known issues in webapp (technical debt tracker)

### Deliverables:
- `docs/desktop/WEBAPP_BASELINE.md` - Performance/feature baseline
- `docs/desktop/FEATURE_PARITY_CHECKLIST.md` - All features to replicate
- Security audit report from security-auditor agent

### 🔴 PAUSE POINT 0A: Review Baseline
**You must:** Review baseline docs and approve proceeding to desktop implementation

---

## Phase 1: Branch Setup & Desktop Scaffolding (Week 1)

**Goal:** Create isolated development environment with basic Electron shell

### Tasks:
- [ ] Create feature branch: `feature/desktop-electron-mvp`
- [ ] Update `.gitignore` for Electron-specific files
  ```
  # Electron
  desktop/dist/
  desktop/out/
  desktop/node_modules/
  desktop/*.dmg
  desktop/*.app
  desktop/*.pkg
  ```
- [ ] Create `desktop/` folder structure
  ```
  desktop/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── electron-main.ts
  │   └── preload.ts
  ├── icons/
  │   └── (will add in Phase 2)
  ├── entitlements.mac.plist
  └── electron-builder.yml
  ```
- [ ] Copy complete code from Appendix A.1-A.5 in technical specification
- [ ] Install Electron dependencies: `cd desktop && npm install`
- [ ] Create basic electron-main.ts (just open window, no Next.js yet)
- [ ] Test Electron window opens: `cd desktop && npm start`

### Deliverables:
- Working Electron window (blank/hello world)
- All TypeScript compiles without errors

### 🔴 PAUSE POINT 1A: Verify Basic Electron Works
**You must:** Open the Electron window manually and confirm it launches

---

## Phase 2: Icon Creation & Branding (Week 1)

**Goal:** Create professional app icons before deeper integration

### Tasks:
- [ ] Design 1024x1024 source icon (or hire designer)
  - Recommended: Use HRSkills logo/branding
  - Must be square, no transparency for macOS
- [ ] Generate .icns file using one of:
  - Option A: https://cloudconvert.com/png-to-icns (online)
  - Option B: `iconutil` command-line (macOS built-in)
  - Option C: Electron Icon Maker plugin
- [ ] Test icon in Electron app (set in electron-builder.yml)
- [ ] Generate .ico for Windows (if planning future support)

### Icon Generation Guide (Using macOS iconutil):

```bash
# 1. Create iconset folder
mkdir icon.iconset

# 2. Generate all required sizes from 1024x1024 source
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

# 3. Convert to .icns
iconutil -c icns icon.iconset -o desktop/icons/icon.icns
```

### Deliverables:
- `desktop/icons/icon.icns` (macOS)
- `desktop/icons/icon.png` (source, 1024x1024)
- Optional: `desktop/icons/icon.ico` (Windows)

---

## Phase 3: Next.js Integration (Week 2)

**Goal:** Electron launches local Next.js server and loads app

### Tasks:
- [ ] Implement Next.js process spawning in electron-main.ts
  - Use `child_process.spawn('npm', ['run', 'start'], { cwd: webappPath })`
  - Forward stdout/stderr to Electron console
  - Store process PID for cleanup
- [ ] Implement port conflict detection
  ```typescript
  async function findAvailablePort(startPort: number): Promise<number> {
    // Check if port is available, increment if not
    // Return first available port
  }
  ```
- [ ] Implement server readiness polling
  - Poll `http://localhost:${PORT}` every 500ms
  - Timeout after 30 seconds
  - Show loading screen while waiting
- [ ] Set DB_DIR environment variable before spawning
  ```typescript
  const dbDir = path.join(app.getPath('userData'), 'database')
  process.env.DB_DIR = dbDir
  ```
- [ ] Test full startup sequence
- [ ] Implement graceful shutdown (kill Next.js process on app quit)

### Deliverables:
- Electron app successfully loads webapp UI
- Database created in correct location: `~/Library/Application Support/HR Command Center/database/hrskills.db`
- Clean shutdown with no zombie processes

### Testing Checklist:
- [ ] App loads on first launch
- [ ] App loads on second launch (existing DB)
- [ ] Port 3000 in use → fallback port works
- [ ] Quitting app kills Next.js process
- [ ] Logs visible in terminal during development

---

## Phase 4: Secure IPC Implementation (Week 2-3)

**Goal:** Implement CRITICAL security architecture (Section 4.5 in technical spec)

**⚠️ SECURITY CRITICAL: This is the highest-risk phase for PII exposure**

### Tasks:
- [ ] Implement preload.ts with context bridge (see Appendix A.4)
- [ ] Configure BrowserWindow security settings
  - contextIsolation: true
  - nodeIntegration: false
  - sandbox: true
  - webSecurity: true
- [ ] Implement Content Security Policy in main process
- [ ] Create IPC handlers with Zod validation
  - `db:backup` handler
  - `db:export` handler
  - `app:version` handler
  - `app:dataPath` handler
- [ ] Add type definitions to webapp
  ```typescript
  // webapp/lib/types/electron.d.ts
  declare global {
    interface Window {
      electronAPI: {
        backupDatabase: () => Promise<string>
        exportData: (format: 'json' | 'csv') => Promise<void>
        // ... etc
      }
    }
  }
  ```
- [ ] Test all IPC channels with malicious inputs
- [ ] Run security-auditor agent on IPC implementation

### Deliverables:
- All security checklist items from Section 4.5.5 passing
- Security audit report (no critical findings)

### 🔴 PAUSE POINT 4A: Security Audit
**You must:** Review security-auditor report and approve IPC architecture

---

## Phase 5: Database Backup & Recovery (Week 3)

**Goal:** Implement Section 8.4 (automatic backups, corruption recovery)

### Tasks:
- [ ] Implement automatic backup scheduling
  - On app startup (if >24h since last backup)
  - Daily at 2 AM (scheduled job)
  - Before database migrations
- [ ] Implement manual backup IPC handler
- [ ] Implement database integrity verification
  - `PRAGMA integrity_check` on startup
  - Quarantine corrupt DB, restore from backup
- [ ] Implement cleanup (keep 30 days of backups)
- [ ] Add backup UI to Settings page in webapp
  - Show last backup time
  - "Backup Now" button
  - "Open Backup Folder" button
- [ ] Test corruption recovery scenario

### Deliverables:
- `~/Library/Application Support/HR Command Center/backups/` directory with rotation
- UI in webapp/app/settings showing backup status

### Testing Checklist:
- [ ] Automatic backup on first launch
- [ ] Scheduled backup triggers correctly
- [ ] Manual backup works from UI
- [ ] Corrupt DB detected and restored
- [ ] Old backups cleaned after 30 days

---

## Phase 6: Crash Reporting & Monitoring (Week 3)

**Goal:** Implement Section 9.5 (Sentry, logging, telemetry)

### Tasks:
- [ ] Install @sentry/electron: `cd desktop && npm install @sentry/electron`
- [ ] Configure Sentry in electron-main.ts (production only)
- [ ] Implement error handlers
  - Uncaught exceptions
  - Unhandled promise rejections
  - Renderer crashes (render-process-gone)
- [ ] Configure electron-log
  - Rotate logs at 5MB
  - Log location: `~/Library/Logs/HR Command Center/`
- [ ] Add "Help → View Logs" menu item
- [ ] Implement anonymous telemetry (opt-in via Settings)
- [ ] Test crash scenarios (force crash, verify Sentry receives)

### Deliverables:
- Sentry receiving crash reports
- User-accessible logs via menu
- Telemetry opt-in UI

### 🔴 PAUSE POINT 6A: Sentry Configuration
**You must:** Create Sentry project, copy DSN, configure in .env.local for desktop

---

## Phase 7: Auto-Update Infrastructure (Week 4)

**Goal:** Implement Section 10 (electron-updater, GitHub Releases)

### Tasks:
- [ ] Install electron-updater: `cd desktop && npm install electron-updater`
- [ ] Implement auto-update logic in electron-main.ts
  - Check for updates 10s after launch
  - Check every 6 hours
  - Download on user approval
  - Install on quit
- [ ] Add update UI to Settings page
  - "Update Available" banner
  - Download progress bar
  - "Restart to Update" button
- [ ] Configure electron-builder.yml publish settings
- [ ] Create `.github/workflows/desktop-release.yml`
- [ ] Test update flow locally (use `electron-updater` dev mode)

### Deliverables:
- CI/CD workflow ready for releases
- Update mechanism tested with dummy release

### 🔴 PAUSE POINT 7A: GitHub Secrets Configuration
**You must:** Add these secrets to GitHub repository settings:
- `MAC_CERT_BASE64` (Apple Developer certificate, base64 encoded)
- `MAC_CERT_PASSWORD` (certificate password)
- `APPLE_ID` (your Apple ID email)
- `APPLE_APP_SPECIFIC_PASSWORD` (generated at appleid.apple.com)

**Note:** Requires Apple Developer account ($99/year)

---

## Phase 8: First-Run Experience & Onboarding (Week 4)

**Goal:** Handle new user setup (NEW - not in original plan)

### Tasks:
- [ ] Create first-run detection (check if DB exists)
- [ ] Implement onboarding flow in webapp
  - Welcome screen
  - API key setup for Anthropic/OpenAI
  - Optional: Import data from JSON file
  - Optional: Demo mode with sample data
- [ ] Implement data migration from web version
  - Detect if `~/.hrskills/web-data.json` exists
  - Offer to import
  - Run `migrate:json-to-sqlite` with imported data
- [ ] Add "Getting Started" documentation to app
  - In-app help system
  - Link to full docs
- [ ] Test first-run on clean macOS user account

### Deliverables:
- Smooth onboarding for new users
- Data migration path for existing web users

---

## Phase 9: Feature Parity Validation (Week 5)

**Goal:** Ensure desktop app = web app features

### Tasks:
- [ ] Test all 25 Claude Skills in desktop app
- [ ] Verify all API routes work with desktop backend
- [ ] Test multi-provider AI failover
- [ ] Verify all analytics queries return correct data
- [ ] Test file upload/export features
- [ ] Compare performance: desktop vs web
  - Chat response times
  - Database query performance
  - UI responsiveness
- [ ] Run accessibility tests (jest-axe + manual VoiceOver)
- [ ] Create feature parity report (compare to Phase 0 checklist)

### Deliverables:
- `docs/desktop/FEATURE_PARITY_REPORT.md` (100% feature match)
- Performance comparison spreadsheet

### 🔴 PAUSE POINT 9A: Feature Sign-Off
**You must:** Review feature parity report, test critical workflows manually

---

## Phase 10: macOS Code Signing & Notarization (Week 5-6)

**Goal:** Make app distributable without Gatekeeper warnings

**⚠️ REQUIRES: Apple Developer Program membership ($99/year)**

### Prerequisites:
- [ ] Sign up for Apple Developer Program
- [ ] Create Developer ID Application certificate
- [ ] Download certificate to Keychain Access
- [ ] Export as .p12 file
- [ ] Convert to base64: `base64 -i certificate.p12 -o cert.txt`

### Tasks:
- [ ] Configure electron-builder.yml signing
  ```yaml
  mac:
    hardenedRuntime: true
    gatekeeperAssess: false
    entitlements: entitlements.mac.plist
    entitlementsInherit: entitlements.mac.plist
  ```
- [ ] Test local signed build: `npm run dist:mac`
- [ ] Configure notarization credentials (Apple ID + app-specific password)
- [ ] Run full build + notarize workflow
- [ ] Test .dmg on clean Mac (no dev tools installed)
- [ ] Verify Gatekeeper allows installation

### Deliverables:
- Notarized .dmg that installs without warnings
- Signing + notarization CI/CD workflow

### 🔴 PAUSE POINT 10A: Apple Developer Setup
**You must:**
1. Complete Apple Developer enrollment
2. Create certificates in developer.apple.com
3. Generate app-specific password at appleid.apple.com
4. Configure GitHub secrets (see Phase 7A)

### 🔴 PAUSE POINT 10B: Signing Verification
**You must:** Test signed .dmg on another Mac, verify no Gatekeeper warnings

---

## Phase 11: Beta Testing (Week 6)

**Goal:** Internal testing with real users (NEW - not in original plan)

### Tasks:
- [ ] Recruit 5-10 beta testers (colleagues, trusted users)
- [ ] Create beta testing documentation
  - Installation instructions
  - Features to test
  - Bug reporting process (GitHub issues)
- [ ] Distribute beta build (GitHub pre-release)
- [ ] Set up feedback collection (Google Form / Typeform)
- [ ] Monitor Sentry for crash reports
- [ ] Weekly beta tester sync meetings
- [ ] Iterate on bugs/feedback (2-3 beta releases)

### Deliverables:
- Beta feedback report (bugs, usability issues)
- At least 2 beta releases with fixes

### 🔴 PAUSE POINT 11A: Beta Retrospective
**You must:** Review beta feedback, decide if ready for public launch

---

## Phase 12: User Documentation (Week 6-7)

**Goal:** Create end-user docs (NEW - not in original plan)

### Tasks:
- [ ] Write installation guide
  - System requirements (macOS version, storage, RAM)
  - Download .dmg
  - Drag to Applications
  - First launch (API key setup)
- [ ] Write user manual
  - Overview of features
  - How to use each of 25 skills
  - Settings configuration
  - Backup/restore guide
- [ ] Write troubleshooting guide
  - "App won't launch" → check logs
  - "Database corrupted" → restore from backup
  - "AI not responding" → check API keys + internet
  - "Port 3000 conflict" → how to change port
- [ ] Create FAQ
- [ ] Add help resources to app
  - Help menu → Documentation
  - Help menu → Report Bug
  - Help menu → Check for Updates

### Deliverables:
- `docs/desktop/USER_GUIDE.md`
- `docs/desktop/TROUBLESHOOTING.md`
- `docs/desktop/FAQ.md`
- In-app help links

---

## Phase 13: Production Build & Release (Week 7-8)

**Goal:** Public v1.0.0 release

### Tasks:
- [ ] Finalize version number in package.json (1.0.0)
- [ ] Update CHANGELOG.md with release notes
- [ ] Run full validation suite
  ```bash
  npm run validate # webapp
  cd desktop && npm run build && npm run dist:mac
  ```
- [ ] Create EULA (End-User License Agreement)
- [ ] Create Privacy Policy (desktop-specific)
- [ ] Tag release: `git tag -a v1.0.0 -m "Desktop app v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] CI/CD builds and uploads to GitHub Releases
- [ ] Test auto-update from v1.0.0 → v1.0.1 (dummy update)
- [ ] Announce launch (website, social media, email)

### Deliverables:
- Public v1.0.0 release on GitHub
- Signed, notarized .dmg downloadable
- User docs published

### 🔴 PAUSE POINT 13A: Legal Review
**You must:** Have EULA and Privacy Policy reviewed by legal counsel

### 🔴 PAUSE POINT 13B: Go/No-Go Decision
**You must:** Final approval to push v1.0.0 tag and trigger public release

---

## Ongoing Maintenance (Post-Launch)

### Weekly Tasks:
- [ ] Monitor Sentry for crash reports
- [ ] Review user feedback (GitHub issues, email)
- [ ] Check analytics (telemetry opt-ins, usage patterns)

### Monthly Tasks:
- [ ] Dependency updates (security patches)
- [ ] Performance monitoring (detect memory leaks)
- [ ] Backup restoration testing (verify backups aren't corrupt)

### Quarterly Tasks:
- [ ] Major feature releases (v1.1.0, v1.2.0)
- [ ] macOS compatibility testing (new macOS version support)
- [ ] Review auto-update success rate

---

## Decision Tree: Windows Support

**If YES (add Windows support later):**
- Timeline: +6 weeks after macOS v1.0.0
- Changes needed:
  - electron-builder config for NSIS/MSI
  - Code signing certificate ($200-400/year)
  - Windows-specific icons (.ico)
  - Windows Store submission (optional)
  - Test on Windows 10 and 11

**If NO (macOS only):**
- Remove all Windows references from plan
- Update documentation to state "macOS only"
- Consider Tauri if cross-platform needed later (smaller binaries)

**Recommendation:** Start with macOS only, add Windows based on demand.

---

## Risk Mitigation

### High-Risk Items:
1. **PII Security** - Mitigated by Phase 4 security audit
2. **Code Signing Complexity** - Mitigated by Phase 10 testing
3. **Database Corruption** - Mitigated by Phase 5 backup system
4. **Auto-Update Failures** - Mitigated by Phase 7 rollback strategy

### Unknowns:
- Apple Developer enrollment wait time (1-2 days typically)
- First notarization may take 24-48 hours
- Beta tester recruitment success

---

## Summary of Manual Pause Points

| Phase | Pause Point | Your Action Required | Est. Time |
|-------|-------------|---------------------|-----------|
| 0 | 0A | Review baseline docs | 1 hour |
| 1 | 1A | Test Electron window launches | 15 min |
| 4 | 4A | Review security audit | 1 hour |
| 6 | 6A | Configure Sentry project | 30 min |
| 7 | 7A | Add GitHub secrets | 30 min |
| 9 | 9A | Test critical workflows | 2 hours |
| 10 | 10A | Apple Developer setup | 2-3 days (wait time) |
| 10 | 10B | Verify signed build | 30 min |
| 11 | 11A | Beta retrospective | 2 hours |
| 13 | 13A | Legal review | 1-2 weeks (external) |
| 13 | 13B | Go/No-Go decision | 1 hour |

**Total manual intervention time:** ~10 hours + 2-3 weeks (external dependencies)

---

## Next Immediate Steps

1. **Commit this plan:** `git add docs/desktop-app-electron-plan.md && git commit -m "docs: add comprehensive Electron desktop app implementation roadmap"`
2. **Create feature branch:** `git checkout -b feature/desktop-electron-mvp`
3. **Start Phase 0:** Run `npm run validate` and document baselines
4. **Notify for review when Phase 0 complete** at Pause Point 0A

---

# TECHNICAL SPECIFICATION

## 0. Conceptual Overview

### 0.1 What We're Building

Today:

- `webapp/` is a **Next.js app** (App Router) that:
  - Serves the UI.
  - Exposes API routes at `/api/*`.
  - Uses a local **SQLite database** via `webapp/lib/db/index.ts` and `webapp/db/schema.ts`.

Goal:

- Bundle this Next.js app+API into a **desktop application** that:
  - Runs **locally** on macOS.
  - Stores all HR data in a **local SQLite file** on that machine.
  - Connects out to **Anthropic/OpenAI** to do its AI work.
  - Launches like any other macOS app (icon, .app/.dmg).

How:

- Use **Electron** as a thin shell that:
  - Starts the **Next.js server** locally (e.g., on `http://localhost:3000`).
  - Opens a **Chromium window** pointing at that local URL.
  - Ensures the **database directory** and **environment variables** are set appropriately for desktop usage.

You can think of it as:

> Electron (native shell) → starts Next.js backend → opens the local web UI in a window.

---

## 1. Prerequisites and Setup

### 1.1 Tools You Need Installed

On your development machine, you need:

- **Node.js 20+** (same as the webapp).
- **npm 10+**.
- **macOS** with a fairly recent version (for building and testing the desktop app).
- Later, for signing/notarization:
  - An **Apple Developer account** with proper certificates.

You do **not** need to install Electron globally; it will be added as a dependency to this repo.

### 1.2 High-Level Folder Layout

We will add a new folder at the repo root:

- `desktop/` – everything specific to the Electron shell:
  - `desktop/package.json` – Electron app configuration.
  - `desktop/tsconfig.json` – TypeScript config for Electron main process (optional but recommended).
  - `desktop/src/electron-main.ts` – Electron **main process** (starts Next.js, creates windows).
  - `desktop/src/preload.ts` – **critical** for secure communication between renderer and main.
  - `desktop/icons/` – macOS/Windows icons.
  - `desktop/electron-builder.yml` or `desktop/builder.config.js` – packaging configuration.
  - `desktop/entitlements.mac.plist` – macOS security entitlements.

The Next.js app remains in `webapp/` unchanged, except for any configuration tweaks to make it desktop-friendly.

---

## 2. Prepare the Web App for Desktop Use

Before adding Electron, confirm the webapp behaves correctly as a **local production server**.

### 2.1 Confirm Production Build Works

From the repo root:

```bash
cd webapp
npm install          # if not already done
npm run build        # build for production
npm run start        # start Next.js in production mode
```

Then open `http://localhost:3000` in a browser and ensure the app works.

If there are any build-time or runtime errors, fix those first. Electron will rely on this working reliably.

### 2.2 Ensure API Calls Use Relative URLs

In a desktop context, the app will be served from something like `http://localhost:3000`. All frontend calls to the backend should use **relative paths** like:

- `fetch('/api/...')`

Avoid hard-coding full URLs like `https://my-domain.com/api/...` or `http://localhost:3000/api/...`, because:

- In production cloud deployments, a reverse proxy will route `/api/*`.
- In desktop deployments, Electron will point directly at `http://localhost:3000`.

If you find any hard-coded URLs in the frontend, plan to refactor them to relative paths or use `NEXT_PUBLIC_*` env vars that can differ between cloud and desktop.

### 2.3 Understand Database Location (`DB_DIR`)

The database code in `webapp/lib/db/index.ts` uses:

- `DB_DIR` from `env.mjs` (default `../data`).
- `DB_PATH = path.join(DB_DIR, 'hrskills.db')`.

On the desktop:

- We want the database in a **user-appropriate directory**:
  - On macOS, this is usually something under `~/Library/Application Support/<AppName>/`.
  - Electron exposes this via `app.getPath('userData')`.
- We will set `process.env.DB_DIR` **in Electron** to that user data path **before** starting the Next.js server.

You don't need to change `env.mjs` to support this; we'll override the env variable at runtime.

### 2.4 Decide How Users Get AI API Keys

For privacy and security:

- **Do not** hard-code Anthropic/OpenAI keys into the app bundle.
- Options:
  1. **User-supplied keys**:
     - The user enters their Anthropic/OpenAI keys in the UI.
     - The app stores them encrypted in the local DB (e.g., `user_preferences.anthropicApiKey`).
  2. **Org-supplied keys**:
     - Your org provisions keys per customer.
     - On first run, the app prompts for a license/config that includes AI keys.

This plan focuses on the **infrastructure**; the exact UX for capturing keys can be designed later.

---

## 3. Create the `desktop/` Folder

Now we add the Electron shell.

### 3.1 Create Folder and Base Files

At the repo root (`HRSkills/`), create:

- `desktop/`
  - `package.json`
  - `tsconfig.json`
  - `src/`
    - `electron-main.ts`
    - `preload.ts`
  - `icons/` (we'll fill icons later)
  - `electron-builder.yml` (for packaging)
  - `entitlements.mac.plist` (macOS security)

You can start with minimal content and refine over time.

### 3.2 `desktop/package.json` – Responsibilities

This file defines:

- The **entry point** for the Electron app (`main`: built version of `electron-main.ts`).
- **Scripts** for:
  - `npm start` – runs Electron in development mode.
  - `npm run build` – compiles TypeScript to JavaScript.
  - `npm run dist` – builds distributable installers (via `electron-builder`).
- **Dependencies**:
  - `"electron"` (runtime).
  - `"electron-builder"` (packaging).
  - `"electron-updater"` (auto-updates).
  - `"electron-log"` (logging).
  - `"@sentry/electron"` (crash reporting).
  - `"better-sqlite3"` (database integrity checks).
  - `"fs-extra"` (file operations).
  - `"node-schedule"` (backup scheduling).
- **Dev dependencies**:
  - `"typescript"`, plus any build tools you prefer.

You will also set `"name"`, `"version"`, and `"productName"` (for the app name shown on macOS).

See [Appendix A.1](#a1-full-desktoppackagejson) for a complete example.

### 3.3 `desktop/tsconfig.json` – TypeScript for Electron

This config ensures that `electron-main.ts` (and `preload.ts`) compile for Node/Electron:

- `module` / `target` appropriate for Node/Electron.
- `outDir` pointing to something like `dist/` inside `desktop/`.

You only need to compile the Electron files; the Next.js app has its own TypeScript build process.

See [Appendix A.2](#a2-full-desktoptsconfigjson) for a complete example.

---

## 4. Implement the Electron Main Process (`electron-main.ts`)

The **main process** is the brain of an Electron app. It:

- Manages lifecycle (launch, quit).
- Creates windows.
- Starts/stops the backend server.

For this project, `electron-main.ts` will:

1. **Compute the DB directory**:
   - Using `app.getPath('userData')`.
   - Set `process.env.DB_DIR` to that path, so the Next.js app writes `hrskills.db` there.
2. **Start the Next.js server**:
   - Spawn a child process that runs `npm run start` in the `webapp/` directory.
   - Pass along environment variables (including `DB_DIR`).
3. **Wait for the server to be ready**:
   - Poll `http://localhost:3000` until it responds.
4. **Create the browser window**:
   - `new BrowserWindow({ ... })`.
   - `loadURL('http://localhost:3000')`.
5. **Handle app lifecycle**:
   - When the app quits, stop the Next.js child process cleanly.
   - On macOS, re-create windows on dock icon click if needed.

### 4.1 Choosing the Local Port

By default, `npm run start` for Next.js uses port `3000`. You can:

- Keep using `3000` and have Electron always load `http://localhost:3000`.
- Or define a specific port in a `PORT` environment variable and configure Electron to match.

For a first version, sticking with `3000` is fine.

### 4.2 Handling Logs and Errors

When you spawn the Next.js process:

- Forward `stdout` and `stderr` to the Electron process's console so you can see logs.
- If the Next.js process crashes, show an error dialog or restart logic.

This makes debugging much easier, especially as a first-time desktop developer.

---

## 4.5 Secure IPC Architecture (CRITICAL for PII)

Because this app handles sensitive employee data (PII), **security between Electron processes is non-negotiable**.

### 4.5.1 Security Principles

Electron has two processes:

- **Main process** (Node.js) – full system access, runs the backend.
- **Renderer process** (Chromium) – runs the web UI, **must be sandboxed**.

**Never** give the renderer direct Node.js access. Use a secure bridge.

### 4.5.2 Required Security Configuration

In `desktop/src/electron-main.ts`, when creating the browser window:

```typescript
import { BrowserWindow, app } from 'electron'
import path from 'path'

const mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  webPreferences: {
    // CRITICAL SECURITY SETTINGS
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,    // Isolates preload from webpage
    nodeIntegration: false,    // Blocks direct Node.js access
    sandbox: true,              // Enables OS-level sandboxing
    webSecurity: true,          // Enforces same-origin policy
    allowRunningInsecureContent: false,

    // Disable risky features
    enableRemoteModule: false,  // Deprecated, but ensure it's off
    webviewTag: false,          // No embedded webviews
  },

  // macOS-specific security
  titleBarStyle: 'hidden',      // Custom title bar (prevents injection)
  trafficLightPosition: { x: 10, y: 10 },
})

// CRITICAL: Set Content Security Policy
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +  // Next.js requires inline styles
        "connect-src 'self' https://api.anthropic.com https://api.openai.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:;"
      ]
    }
  })
})
```

### 4.5.3 Secure IPC Bridge (`desktop/src/preload.ts`)

The **preload script** is the **only** safe way for the renderer to talk to the main process.

```typescript
// desktop/src/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// CRITICAL: Whitelist exactly what the renderer can do
// Never expose the entire ipcRenderer object!

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations (validated in main process)
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  exportData: (format: 'json' | 'csv') => ipcRenderer.invoke('db:export', format),

  // System info (read-only, safe)
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getDataPath: () => ipcRenderer.invoke('app:dataPath'),

  // Window controls
  minimizeToTray: () => ipcRenderer.send('window:minimize'),

  // Update notifications (one-way from main → renderer)
  onUpdateAvailable: (callback: (version: string) => void) => {
    ipcRenderer.on('update:available', (_, version) => callback(version))
  },

  // NEVER expose:
  // - File system access (path traversal risk)
  // - Shell execution (command injection risk)
  // - Arbitrary IPC channels (privilege escalation risk)
})

// Type definitions for TypeScript (in webapp/lib/types/electron.d.ts)
declare global {
  interface Window {
    electronAPI: {
      backupDatabase: () => Promise<string>
      exportData: (format: 'json' | 'csv') => Promise<void>
      getAppVersion: () => Promise<string>
      getDataPath: () => Promise<string>
      minimizeToTray: () => void
      onUpdateAvailable: (callback: (version: string) => void) => void
    }
  }
}
```

### 4.5.4 Main Process IPC Handlers

In `desktop/src/electron-main.ts`, handle IPC messages with **validation**:

```typescript
import { ipcMain, app, dialog } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import { z } from 'zod'

// CRITICAL: Validate all IPC inputs (prevent injection attacks)
const exportFormatSchema = z.enum(['json', 'csv'])

ipcMain.handle('db:backup', async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'hrskills.db')
    const backupDir = path.join(app.getPath('userData'), 'backups')
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const backupPath = path.join(backupDir, `hrskills-backup-${timestamp}.db`)

    // Ensure backup directory exists
    await fs.ensureDir(backupDir)

    // Copy database (use fs-extra for atomic copy)
    await fs.copy(dbPath, backupPath)

    return backupPath
  } catch (error) {
    console.error('Backup failed:', error)
    throw new Error('Database backup failed')
  }
})

ipcMain.handle('db:export', async (event, format) => {
  // CRITICAL: Validate input
  const validatedFormat = exportFormatSchema.parse(format)

  // Let user choose save location (prevents writing to arbitrary paths)
  const result = await dialog.showSaveDialog({
    title: 'Export HR Data',
    defaultPath: `hrskills-export-${Date.now()}.${validatedFormat}`,
    filters: [
      { name: validatedFormat.toUpperCase(), extensions: [validatedFormat] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return
  }

  // Export logic here (call Next.js API or direct DB access)
  // ...
})

ipcMain.handle('app:version', () => {
  return app.getVersion()
})

ipcMain.handle('app:dataPath', () => {
  // Only return the directory name, not full path (privacy)
  return path.basename(app.getPath('userData'))
})
```

### 4.5.5 Security Checklist

Before packaging for production:

- [ ] `contextIsolation: true` in all BrowserWindow instances
- [ ] `nodeIntegration: false` in all BrowserWindow instances
- [ ] `sandbox: true` enabled (test on macOS and Windows separately)
- [ ] Content Security Policy configured (no `unsafe-eval`)
- [ ] All IPC handlers validate inputs with Zod or similar
- [ ] No `shell.openExternal()` with user-controlled URLs (XSS risk)
- [ ] No `fs` operations with user-controlled paths (directory traversal risk)
- [ ] DevTools disabled in production builds (`app.isPackaged` check)
- [ ] External links open in user's browser, not in-app (`shell.openExternal()`)

See [Appendix A.3](#a3-skeleton-desktopsrcelectron-maints) for a complete implementation.

---

## 5. Development Workflow: Running Electron + Next.js Together

You'll want a simple dev experience where:

- Next.js runs in **dev mode** (`next dev`).
- Electron opens and points to `http://localhost:3000`.

### 5.1 Root-Level Scripts

At the repo root, you can add scripts to `package.json` such as:

- `"dev:web"` – runs `cd webapp && npm run dev`.
- `"dev:desktop"` – runs both:
  - the web dev server, and
  - the Electron app.

A common pattern is to use a tool like `concurrently` so one command starts both processes:

- One process: `cd webapp && npm run dev`.
- Another: `cd desktop && npm start`.

You can also run them manually in two terminal windows while you're getting things set up.

### 5.2 Typical Dev Loop

1. Open terminal tab 1:
   - `cd webapp`
   - `npm run dev`
2. Open terminal tab 2:
   - `cd desktop`
   - `npm start`
3. Electron opens a window with the app at `http://localhost:3000`.
4. You edit React/Next.js code as usual; hot reload continues to work.

This gives you a familiar web dev experience while you develop the desktop shell around it.

---

## 6. Production Build and Packaging (macOS)

Once the dev workflow is stable, you can package the app for distribution.

### 6.1 Decide on a Packager

The most common option is **`electron-builder`**:

- It can build `.app` bundles and `.dmg` installers for macOS.
- It also supports Windows (`nsis`, `msi`) if you later want cross-platform builds.

We'll assume electron-builder here, but tools like Electron Forge are also possible.

### 6.2 Packaging Flow Overview

1. Build the web app:
   - `cd webapp && npm run build`.
2. Compile the Electron main process:
   - `cd desktop && npm run build` (e.g., TypeScript → JS).
3. Run electron-builder:
   - `cd desktop && npm run dist` (or a specific `dist:mac` script).

electron-builder will:

- Collect the compiled `electron-main.js`, `preload.js`, icons, and your `webapp` build.
- Create a `.app` bundle and a `.dmg` you can open/install.

### 6.3 Packaging Configuration (`electron-builder.yml`)

Your packaging config needs to specify:

- `appId` – a unique identifier (e.g. `com.yourcompany.hrcommandcenter`).
- `productName` – the human-friendly name (e.g. `"HR Command Center"`).
- `mac`:
  - `target`: `[{"target": "dmg", "arch": ["x64", "arm64"]}]` for universal binary.
  - `icon`: path to `desktop/icons/icon.icns`.
- `files` to include:
  - The `desktop/dist/**` folder (compiled Electron code).
  - The `webapp` build output:
    - `webapp/.next/**`
    - `webapp/public/**`
    - All other files needed for `npm run start`.
- `publish`:
  - GitHub Releases configuration for auto-updates.

The packager can either:

- Bundle the entire `webapp` folder, or
- Bundle only the minimal set of files required to run the built Next.js app.

For a first version, bundling the entire `webapp` folder is simpler.

See [Appendix A.1](#a1-full-desktoppackagejson) for a complete configuration example.

---

## 7. macOS Code Signing and Notarization (Later Step)

To distribute an app that users can install without scary warnings, you'll eventually want to:

- **Code sign** the app with an Apple Developer certificate.
- **Notarize** it with Apple so macOS Gatekeeper allows it to run.

At a high level:

1. Create or obtain the correct Apple certificates in your Keychain (Apple Developer Program).
2. Configure electron-builder with:
   - Your signing identity.
   - Apple ID / app-specific password for notarization (or use the newer API key approach).
3. Run the `dist` script; electron-builder:
   - Signs the `.app`.
   - Uploads it to Apple for notarization.
   - Staples the notarization ticket.

Because this process is somewhat fiddly, it's okay to treat it as a **Phase 2** task after you have a working unsigned build for internal testing.

---

## 8. Privacy, Security, and Data Handling

Since this is an HR tool, privacy is critical.

### 8.1 Local Data

- All HR data (employees, metrics, conversations, documents) is stored in the local SQLite database:
  - In a file like: `~/Library/Application Support/HR Command Center/hrskills.db`.
- You can document this for users so they know where their data lives.

### 8.2 AI API Keys

- Store keys **locally** and as securely as possible:
  - In the SQLite DB, encrypted (e.g. using a master key derived from a user password/secret).
  - Or in OS-level secure storage (Keychain on macOS) accessed via Electron in a later iteration.
- Never commit any production secrets to the repo.
- In the desktop build pipeline, ensure env variables you use for testing are not hard-embedded in the renderer bundle.

### 8.3 Network Access

- Clearly document that the app:
  - Sends prompts and HR-relevant content to Anthropic/OpenAI endpoints (for AI processing).
  - Does **not** send the database or bulk HR data anywhere else.
- It's good practice to expose a simple "Network Activity" section in docs or the app's settings later.

### 8.4 Database Backup & Recovery Strategy

Since `hrskills.db` contains **all HR data**, losing it is catastrophic.

#### 8.4.1 Automatic Backup Schedule

Implement automatic backups:

- **On app startup** (daily backup if last backup >24 hours old)
- **Before database migrations** (app updates)
- **Manual backup button** in Settings UI

```typescript
// desktop/src/electron-main.ts

import schedule from 'node-schedule'

async function setupAutomaticBackups() {
  const backupDir = path.join(app.getPath('userData'), 'backups')
  await fs.ensureDir(backupDir)

  // Daily backup at 2 AM (when app is likely idle)
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('[Backup] Starting scheduled backup...')
    await backupDatabase()
  })

  // Backup on app start (if last backup is old)
  const lastBackup = await getLastBackupTime()
  const hoursSinceBackup = (Date.now() - lastBackup) / (1000 * 60 * 60)

  if (hoursSinceBackup > 24) {
    console.log('[Backup] Last backup >24h old, creating backup...')
    await backupDatabase()
  }
}

async function backupDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'hrskills.db')
  const backupDir = path.join(app.getPath('userData'), 'backups')
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupPath = path.join(backupDir, `hrskills-backup-${timestamp}.db`)

  try {
    // CRITICAL: Ensure SQLite isn't mid-write (checkpoint WAL first)
    // This requires executing PRAGMA commands via better-sqlite3 or Drizzle

    await fs.copy(dbPath, backupPath)

    // Verify backup integrity (can be opened)
    // Use better-sqlite3 to try opening it

    // Clean old backups (keep last 30 days)
    await cleanOldBackups(backupDir, 30)

    console.log(`[Backup] Success: ${backupPath}`)
    return backupPath
  } catch (error) {
    console.error('[Backup] Failed:', error)

    // Notify user via main window
    mainWindow?.webContents.send('backup:failed', error.message)
  }
}

async function cleanOldBackups(backupDir: string, keepDays: number) {
  const files = await fs.readdir(backupDir)
  const now = Date.now()
  const keepMs = keepDays * 24 * 60 * 60 * 1000

  for (const file of files) {
    if (!file.endsWith('.db')) continue

    const filePath = path.join(backupDir, file)
    const stats = await fs.stat(filePath)

    if (now - stats.mtimeMs > keepMs) {
      console.log(`[Backup] Deleting old backup: ${file}`)
      await fs.remove(filePath)
    }
  }
}
```

#### 8.4.2 Database Corruption Recovery

SQLite can corrupt on crashes. Detect and recover:

```typescript
import Database from 'better-sqlite3'

async function verifyDatabaseIntegrity(): Promise<boolean> {
  const dbPath = path.join(app.getPath('userData'), 'hrskills.db')

  try {
    const db = new Database(dbPath, { readonly: true })

    // Run integrity check
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
    db.close()

    return result.integrity_check === 'ok'
  } catch (error) {
    console.error('[DB] Integrity check failed:', error)
    return false
  }
}

async function recoverFromCorruption() {
  console.error('[DB] Database corrupted! Attempting recovery...')

  const dbPath = path.join(app.getPath('userData'), 'hrskills.db')
  const backupDir = path.join(app.getPath('userData'), 'backups')
  const corruptPath = `${dbPath}.corrupt-${Date.now()}`

  // Move corrupt DB aside (don't delete - forensics)
  await fs.move(dbPath, corruptPath)

  // Find most recent valid backup
  const backups = await fs.readdir(backupDir)
  const sortedBackups = backups
    .filter(f => f.endsWith('.db'))
    .sort()
    .reverse()

  for (const backup of sortedBackups) {
    const backupPath = path.join(backupDir, backup)

    try {
      // Test if backup is valid
      const testDb = new Database(backupPath, { readonly: true })
      const check = testDb.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
      testDb.close()

      if (check.integrity_check === 'ok') {
        // Restore from this backup
        await fs.copy(backupPath, dbPath)
        console.log(`[DB] Restored from backup: ${backup}`)

        // Notify user
        dialog.showMessageBox({
          type: 'warning',
          title: 'Database Recovered',
          message: 'The database was corrupted and has been restored from a backup.',
          detail: `Restored from: ${backup}\nCorrupt file saved to: ${corruptPath}`,
        })

        return true
      }
    } catch (error) {
      console.error(`[DB] Backup ${backup} also corrupted, trying next...`)
    }
  }

  // No valid backups found
  dialog.showErrorBox(
    'Database Recovery Failed',
    'Could not recover the database from backups. Please contact support.'
  )

  app.quit()
}

// In app startup sequence:
app.on('ready', async () => {
  const isValid = await verifyDatabaseIntegrity()

  if (!isValid) {
    await recoverFromCorruption()
  }

  await setupAutomaticBackups()
  // ... rest of startup
})
```

#### 8.4.3 GDPR Data Export

Users have the **right to data portability**:

```typescript
// In IPC handler (see section 4.5.4)
ipcMain.handle('db:exportGdpr', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Export All HR Data (GDPR)',
    defaultPath: `hrskills-gdpr-export-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (result.canceled || !result.filePath) return

  // Export entire database as JSON
  const dbPath = path.join(app.getPath('userData'), 'hrskills.db')
  const db = new Database(dbPath, { readonly: true })

  const data = {
    exportDate: new Date().toISOString(),
    version: app.getVersion(),

    employees: db.prepare('SELECT * FROM employees').all(),
    metrics: db.prepare('SELECT * FROM employee_metrics').all(),
    conversations: db.prepare('SELECT * FROM conversations').all(),
    messages: db.prepare('SELECT * FROM messages').all(),
    // ... all tables
  }

  db.close()

  await fs.writeJson(result.filePath, data, { spaces: 2 })

  dialog.showMessageBox({
    type: 'info',
    title: 'Export Complete',
    message: `All HR data exported to:\n${result.filePath}`,
  })
})
```

#### 8.4.4 Backup Storage Location

```
~/Library/Application Support/HR Command Center/
├── hrskills.db                     # Main database
├── backups/                        # Automatic backups
│   ├── hrskills-backup-2025-01-15T02-00-00.db
│   ├── hrskills-backup-2025-01-16T02-00-00.db
│   └── ... (30 days retained)
└── hrskills.db.corrupt-1234567890  # Quarantined corrupt files
```

**User notification:** Add a section in Settings UI showing:
- Last backup time
- Backup location
- Button: "Backup Now"
- Button: "Open Backup Folder"

---

## 9. Testing Checklist

Use this checklist as you progress.

### 9.1 Local Development (Before Packaging)

- [ ] `npm run build` in `webapp` succeeds.
- [ ] `npm run start` in `webapp` works and the app loads at `http://localhost:3000`.
- [ ] All API calls use relative paths (`/api/...`) and work correctly.
- [ ] Setting `DB_DIR` to a custom directory (via env var) correctly writes `hrskills.db` there.

### 9.2 Electron Dev Mode

- [ ] `webapp` dev server and `desktop` Electron app can run together.
- [ ] Electron window loads the app at `http://localhost:3000`.
- [ ] Closing the Electron app cleanly stops the Next.js dev server (or you understand current behavior).
- [ ] Logs from the Next.js server are visible in the terminal for debugging.

### 9.3 Packaged Build (macOS)

- [ ] `npm run build:web` (or equivalent) builds the webapp.
- [ ] `npm run dist` (from `desktop`) creates a `.dmg` or `.app`.
- [ ] Opening the packaged app:
  - [ ] Starts the local backend.
  - [ ] Shows the UI.
  - [ ] Creates the SQLite DB in the expected user path.
- [ ] Basic flows work: logging in (if applicable), running chat, generating analytics, etc.

### 9.4 Privacy & Security Checks

- [ ] No API keys or secrets are hard-coded in the renderer bundle.
- [ ] Local SQLite DB is created under `userData` path, not in a random temp directory.
- [ ] Documentation describes what data is stored locally and what is sent to AI providers.
- [ ] Security checklist from Section 4.5.5 completed.

### 9.5 Crash Reporting & Monitoring

Since desktop users can't easily report bugs, **automatic crash reporting is essential**.

#### 9.5.1 Integrate Sentry for Electron

You already use Sentry for the webapp. Extend it to Electron:

```bash
cd desktop
npm install @sentry/electron
```

```typescript
// desktop/src/electron-main.ts
import * as Sentry from '@sentry/electron'

// CRITICAL: Initialize BEFORE any other code
if (app.isPackaged) {
  Sentry.init({
    dsn: 'your-sentry-dsn', // Same DSN as webapp or separate project
    environment: 'desktop-production',
    release: `hrskills-desktop@${app.getVersion()}`,

    // PRIVACY: Don't send PII in breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Redact sensitive data from URLs, messages, etc.
      if (breadcrumb.message?.includes('employee')) {
        breadcrumb.message = '[REDACTED]'
      }
      return breadcrumb
    },

    // Attach context
    initialScope: {
      tags: {
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
      }
    },
  })
}
```

#### 9.5.2 Capture Unhandled Errors

```typescript
// Catch main process crashes
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error)
  Sentry.captureException(error)

  // Show user-friendly error dialog
  dialog.showErrorBox(
    'Application Error',
    'An unexpected error occurred. The error has been reported.'
  )

  // Don't quit immediately - let Sentry flush
  setTimeout(() => app.quit(), 1000)
})

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason)
  Sentry.captureException(reason)
})

// Catch renderer crashes
app.on('render-process-gone', (event, webContents, details) => {
  console.error('[FATAL] Renderer crashed:', details)

  Sentry.captureException(new Error(`Renderer crash: ${details.reason}`), {
    extra: { exitCode: details.exitCode }
  })

  // Try to reload the window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.reload()
  }
})
```

#### 9.5.3 User-Accessible Logs

Help users troubleshoot by making logs accessible:

```typescript
import log from 'electron-log'

// Configure logging
log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}'

// Log location: ~/Library/Logs/HR Command Center/main.log

// Add menu item: Help → View Logs
import { Menu, shell } from 'electron'

const menu = Menu.buildFromTemplate([
  {
    label: 'Help',
    submenu: [
      {
        label: 'View Logs',
        click: () => {
          shell.openPath(log.transports.file.getFile().path)
        }
      },
      {
        label: 'Open Data Folder',
        click: () => {
          shell.openPath(app.getPath('userData'))
        }
      }
    ]
  }
])

Menu.setApplicationMenu(menu)
```

#### 9.5.4 Anonymous Telemetry (Opt-In)

For bug tracking and feature usage:

```typescript
// Only if user consents (checkbox in Settings)
import { randomUUID } from 'crypto'

interface TelemetryEvent {
  event: string
  properties?: Record<string, any>
  timestamp: string
  sessionId: string
}

class Telemetry {
  private enabled: boolean = false
  private sessionId: string = randomUUID()

  async initialize() {
    // Read user preference from database
    this.enabled = await getUserPreference('telemetryEnabled')
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return

    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    }

    // Send to your analytics endpoint (not Anthropic/OpenAI!)
    // Or use a service like PostHog (open-source alternative)
    fetch('https://your-telemetry-endpoint.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetryEvent),
    }).catch(() => {
      // Silent fail - never interrupt user experience
    })
  }
}

const telemetry = new Telemetry()

// Track non-PII events
telemetry.track('app_launched', { version: app.getVersion() })
telemetry.track('skill_used', { skill: 'retention-risk' }) // No employee data
telemetry.track('ai_provider_failover', { from: 'anthropic', to: 'openai' })
```

**Privacy Notice:** Display in Settings:
> "Optional anonymous usage data helps us improve the app. We never collect employee data, names, or other personal information."

---

## 10. Auto-Update Strategy

**You can't fix bugs if users don't update.** Auto-updates are essential for production desktop apps.

### 10.1 Choose Update Mechanism

**Recommended:** `electron-updater` (part of electron-builder)

```bash
cd desktop
npm install electron-updater
```

### 10.2 Update Server Architecture

**Option A: GitHub Releases (Free, Simple)**

- Upload `.dmg` and `latest-mac.yml` to GitHub Releases
- electron-updater checks for new versions automatically

**Option B: S3 + CloudFront (Production)**

- Upload artifacts to S3 bucket
- Serve via CloudFront (faster, more control)
- Generate `latest-mac.yml` with version info

**For MVP:** Use GitHub Releases.

### 10.3 Implement Auto-Update

```typescript
// desktop/src/electron-main.ts
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Configure updater
autoUpdater.logger = log
autoUpdater.autoDownload = false // User-initiated download
autoUpdater.autoInstallOnAppQuit = true

function setupAutoUpdater() {
  // Check for updates on startup (after 10 seconds)
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates()
    }
  }, 10000)

  // Check every 6 hours
  setInterval(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates()
    }
  }, 6 * 60 * 60 * 1000)

  // Update available
  autoUpdater.on('update-available', (info) => {
    log.info('[Update] New version available:', info.version)

    // Notify renderer
    mainWindow?.webContents.send('update:available', info.version)

    // Show notification (non-intrusive)
    const notification = new Notification({
      title: 'Update Available',
      body: `Version ${info.version} is ready to download.`,
      silent: true,
    })

    notification.on('click', () => {
      // User clicks notification → start download
      autoUpdater.downloadUpdate()
    })

    notification.show()
  })

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info(`[Update] Download progress: ${progress.percent}%`)
    mainWindow?.webContents.send('update:progress', progress.percent)
  })

  // Download complete
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Update] Download complete:', info.version)

    // Prompt user to restart
    const result = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the app.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    })

    if (result === 0) {
      // User chose "Restart Now"
      autoUpdater.quitAndInstall(false, true)
    }
  })

  // Error handling
  autoUpdater.on('error', (error) => {
    log.error('[Update] Error:', error)
    // Silent fail - don't bother user with update errors
  })
}

app.on('ready', () => {
  setupAutoUpdater()
  // ... rest of startup
})
```

### 10.4 Update UI in Renderer

In your Settings page:

```typescript
// webapp/app/settings/page.tsx (or wherever appropriate)

const [updateStatus, setUpdateStatus] = useState<{
  available: boolean
  version?: string
  progress?: number
}>({ available: false })

useEffect(() => {
  if (typeof window === 'undefined' || !window.electronAPI) return

  // Listen for update notifications
  window.electronAPI.onUpdateAvailable((version) => {
    setUpdateStatus({ available: true, version })
  })

  window.electronAPI.onUpdateProgress((percent) => {
    setUpdateStatus((prev) => ({ ...prev, progress: percent }))
  })
}, [])

// In your Settings UI:
{updateStatus.available && (
  <div className="rounded-md bg-blue-50 p-4">
    <h3 className="text-sm font-medium text-blue-800">
      Update Available: v{updateStatus.version}
    </h3>
    {updateStatus.progress !== undefined ? (
      <div className="mt-2">
        <div className="h-2 w-full bg-blue-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded transition-all"
            style={{ width: `${updateStatus.progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Downloading... {updateStatus.progress.toFixed(0)}%
        </p>
      </div>
    ) : (
      <button
        onClick={() => window.electronAPI.downloadUpdate()}
        className="mt-2 text-sm text-blue-600 underline"
      >
        Download Now
      </button>
    )}
  </div>
)}
```

### 10.5 electron-builder Configuration

In `desktop/electron-builder.yml`:

```yaml
appId: com.yourcompany.hrcommandcenter
productName: HR Command Center
copyright: Copyright © 2025

# Update server
publish:
  - provider: github
    owner: your-github-org
    repo: HRSkills
    private: false  # Or true if private repo
    releaseType: release

mac:
  target:
    - target: dmg
      arch: [x64, arm64]  # Universal binary
  category: public.app-category.business
  icon: icons/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: entitlements.mac.plist
  entitlementsInherit: entitlements.mac.plist

# Auto-update settings
autoUpdater:
  requestHeaders:
    Authorization: "token ${GITHUB_TOKEN}"  # If private repo
```

### 10.6 CI/CD for Releases

In `.github/workflows/desktop-release.yml`:

```yaml
name: Desktop Release

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags (v1.0.0, v1.0.1, etc.)

jobs:
  release-mac:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies (webapp)
        run: cd webapp && npm ci

      - name: Build webapp
        run: cd webapp && npm run build

      - name: Install dependencies (desktop)
        run: cd desktop && npm ci

      - name: Build Electron app
        run: cd desktop && npm run build

      - name: Package and publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          CSC_LINK: ${{ secrets.MAC_CERT_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
        run: cd desktop && npm run dist

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: macos-release
          path: desktop/dist/*.dmg
```

### 10.7 Rollback Strategy

If an update breaks the app:

1. **Immediate:** Pull the GitHub release (stops new installs)
2. **Quick fix:** Release a new version (v1.0.2) with revert
3. **Notify users:** In-app notification: "If you're experiencing issues, please reinstall from our website."

**Database migration rollback:**

```typescript
// Before applying migration, backup database
await backupDatabase()

try {
  await runMigration()
} catch (error) {
  log.error('[Migration] Failed, restoring backup...')
  await restoreLastBackup()

  dialog.showErrorBox(
    'Update Failed',
    'The app update could not be completed. Your data has been restored.'
  )

  // Report to Sentry
  Sentry.captureException(error, {
    tags: { migration: 'failed' }
  })

  app.quit()
}
```

---

## 11. Future Enhancements and Tauri Considerations

Once you have a working Electron-based desktop app, you can consider:

- **Deeper OS integration**: menus, global shortcuts, drag-and-drop, system tray, dock badges, etc.
- **Better key storage**: use macOS Keychain via Electron APIs to store AI keys.
- **Multi-instance handling**: Single instance lock, dynamic port allocation.
- **Offline mode**: Graceful degradation when internet is unavailable.
- **Native notifications**: For alerts and chat responses.
- **Deep linking**: `hrskills://` URLs for opening specific features.
- **Window state persistence**: Remember size/position between launches.
- **Tauri migration (optional, later)**:
  - If you decide you want smaller binaries and a Rust-based backend, you can:
    - Gradually reimplement backend logic (auth, DB, AI calls) in Rust.
    - Use your existing React/Next frontend as a Tauri webview.
  - This is a larger architectural change and can be treated as a future project.

For now, the plan above gives you a clear, incremental path from **"Next.js webapp" → "macOS desktop app with a local backend and local SQLite storage"**, while staying in familiar TypeScript/Node territory.

---

## Appendix A: Complete Code Examples

### A.1 Full `desktop/package.json`

```json
{
  "name": "hrskills-desktop",
  "version": "1.0.0",
  "productName": "HR Command Center",
  "description": "HR automation platform with local data storage",
  "main": "dist/electron-main.js",
  "author": "Your Company",
  "license": "PROPRIETARY",

  "scripts": {
    "start": "npm run build && electron .",
    "dev": "npm run build:watch & electron .",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:win": "npm run build && electron-builder --win",
    "postinstall": "electron-builder install-app-deps"
  },

  "dependencies": {
    "electron-log": "^5.0.1",
    "electron-updater": "^6.1.7",
    "better-sqlite3": "^9.2.2",
    "fs-extra": "^11.2.0",
    "node-schedule": "^2.1.1"
  },

  "devDependencies": {
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "@sentry/electron": "^4.17.0",
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/better-sqlite3": "^7.6.8",
    "@types/fs-extra": "^11.0.4",
    "@types/node-schedule": "^2.1.5"
  },

  "build": {
    "appId": "com.yourcompany.hrcommandcenter",
    "productName": "HR Command Center",
    "files": [
      "dist/**/*",
      "icons/**/*",
      "../webapp/.next/**/*",
      "../webapp/public/**/*",
      "../webapp/package.json",
      "../webapp/next.config.js"
    ],
    "extraResources": [
      {
        "from": "../webapp",
        "to": "webapp",
        "filter": ["!node_modules", "!.next/cache"]
      }
    ],
    "mac": {
      "target": ["dmg"],
      "icon": "icons/icon.icns",
      "category": "public.app-category.business",
      "hardenedRuntime": true,
      "entitlements": "entitlements.mac.plist",
      "entitlementsInherit": "entitlements.mac.plist"
    },
    "dmg": {
      "contents": [
        { "x": 130, "y": 220 },
        { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
      ]
    },
    "publish": {
      "provider": "github",
      "owner": "your-github-org",
      "repo": "HRSkills"
    }
  }
}
```

### A.2 Full `desktop/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### A.3 Skeleton `desktop/src/electron-main.ts`

**See the full 400+ line skeleton implementation in `desktop-app-electron-plan-additions.md`, Appendix A.3**

The complete skeleton includes:
- Sentry initialization
- Database setup and integrity checks
- Automatic backup scheduling
- Next.js server management
- Secure window creation with CSP
- IPC handlers with validation
- Auto-updater configuration
- Application lifecycle management
- Error handling
- Application menu with native integration

### A.4 Full `desktop/src/preload.ts`

**See the complete implementation in `desktop-app-electron-plan-additions.md`, Appendix A.4**

The full preload script includes:
- Secure context bridge configuration
- Whitelisted API exposure
- TypeScript type definitions
- Update notification handlers
- Backup failure handlers

### A.5 macOS Entitlements (`desktop/entitlements.mac.plist`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Required for hardened runtime -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>

    <!-- Network access for AI APIs -->
    <key>com.apple.security.network.client</key>
    <true/>

    <!-- Microphone (if adding voice features later) -->
    <!-- Uncomment if needed:
    <key>com.apple.security.device.audio-input</key>
    <true/>
    -->
</dict>
</plist>
```

---

## Summary

This comprehensive plan now includes:

1. **All original content** - Conceptual overview, prerequisites, setup steps
2. **Critical security sections** - IPC architecture, sandboxing, CSP (Section 4.5)
3. **Database resilience** - Automatic backups, corruption recovery, GDPR export (Section 8.4)
4. **Production monitoring** - Sentry integration, crash reporting, telemetry (Section 9.5)
5. **Auto-update infrastructure** - electron-updater, CI/CD workflow, rollback strategy (Section 10)
6. **Complete code examples** - Full package.json, tsconfig, electron-main.ts skeleton, preload.ts, entitlements (Appendix A)

**Priority Implementation Order:**

1. **Phase 1 (MVP):** Sections 0-6 (basic Electron shell working)
2. **Phase 2 (Security):** Section 4.5 (IPC security - CRITICAL before any testing with real data)
3. **Phase 3 (Resilience):** Sections 8.4, 9.5, 10 (backups, monitoring, updates)
4. **Phase 4 (Polish):** Section 7 (code signing), Section 11 (future enhancements)

**Next Steps:**

1. ✅ Merged document created
2. Create implementation checklist (break into actionable tasks)
3. Review with security-auditor agent (PII compliance verification)
4. Begin Phase 1 implementation

---

**Document Version:** 3.0 (Complete with Implementation Roadmap)
**Last Updated:** 2025-01-20
**Status:** Ready for Phase 0 execution
