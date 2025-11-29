# HR Command Center Desktop — Architecture & Technical Specification

> **Purpose:** Reference documentation for understanding the desktop app architecture.
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [CODE_EXAMPLES.md](./CODE_EXAMPLES.md)

---

## Table of Contents

1. [Conceptual Overview](#1-conceptual-overview)
2. [Distribution Model](#2-distribution-model)
3. [Folder Structure](#3-folder-structure)
4. [Security Architecture](#4-security-architecture)
5. [Database Strategy](#5-database-strategy)
6. [AI Provider Integration](#6-ai-provider-integration)
7. [Update Strategy](#7-update-strategy)
8. [Offline Mode](#8-offline-mode)
9. [First-Run Experience](#9-first-run-experience)

---

## 1. Conceptual Overview

### What We're Building

**Today:** `webapp/` is a Next.js app with:
- UI served at `/`
- API routes at `/api/*`
- SQLite database via Drizzle ORM

**Goal:** Bundle this into a desktop application that:
- Runs locally on macOS
- Stores all HR data in local SQLite
- Connects to Anthropic/OpenAI for AI features
- Launches like any native Mac app

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER'S COMPUTER                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  HR Command Center Desktop App                            │  │
│  │  ├── Electron shell (native wrapper)                      │  │
│  │  ├── Next.js server (localhost:3000)                      │  │
│  │  ├── SQLite database (all HR data stays HERE)             │  │
│  │  └── License key (validated once, stored locally)         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼ (AI API calls only)                 │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │  Anthropic/OpenAI   │
                 │  (Customer's own    │
                 │   API keys)         │
                 └─────────────────────┘

WE MANAGE: License validation, app updates
CUSTOMER OWNS: All HR data, AI API keys
WE NEVER SEE: Employee names, salaries, PII, chat history
```

### How It Works

```
Electron (native shell)
    │
    ├── Starts Next.js server as child process
    │   └── Sets DB_DIR to ~/Library/Application Support/HR Command Center/
    │
    ├── Waits for server to be ready (polls localhost:3000)
    │
    └── Opens BrowserWindow pointing to localhost:3000
```

---

## 2. Distribution Model

### Decision: Direct Sales (NOT App Store)

| Factor | Direct Sales | Mac App Store |
|--------|--------------|---------------|
| **Revenue** | ~97% (Stripe fees) | 70-85% (Apple takes 15-30%) |
| **Control** | Full pricing control | Apple approval required |
| **Updates** | Ship instantly | 1-7 day review delays |
| **Requirements** | Code signing + notarization | Same + App Store guidelines |

### Customer Journey

```
1. DISCOVER
   └── Customer visits hrcommandcenter.com

2. PURCHASE
   └── Stripe Checkout ($X one-time or subscription)
   └── Webhook generates license key
   └── Email sent with: download link, license key, quick start guide

3. INSTALL
   └── Download .dmg from CDN or GitHub Releases
   └── Drag to /Applications
   └── First launch → Gatekeeper allows (signed + notarized)

4. ACTIVATE (First-Run Wizard Step 1)
   └── Enter license key
   └── Validates against our API
   └── Stored locally (works offline after activation)

5. AI SETUP (First-Run Wizard Step 2)
   └── Guided walkthrough with screenshots
   └── Copy/paste API key
   └── Test connection

6. READY
   └── Dashboard loads
```

### What We Host vs. What's Local

| Component | Location | Notes |
|-----------|----------|-------|
| Product website | Our hosting (Vercel) | Sales, docs, support |
| License validation API | Our hosting | Called once on activation |
| App downloads (.dmg) | GitHub Releases | Free |
| Update server | GitHub Releases | electron-updater checks here |
| Customer's HR data | Customer's Mac | Never leaves their machine |
| Customer's AI keys | Customer's Mac (encrypted) | We never see these |
| Chat history | Customer's Mac | SQLite database |

---

## 3. Folder Structure

### Repository Layout

```
HRSkills/
├── webapp/                    # Existing Next.js app (unchanged)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── desktop/                   # NEW: Electron shell
│   ├── package.json           # Electron dependencies
│   ├── tsconfig.json          # TypeScript config for Electron
│   ├── electron-builder.yml   # Packaging configuration
│   ├── entitlements.mac.plist # macOS security entitlements
│   ├── src/
│   │   ├── electron-main.ts   # Main process (starts Next.js, creates windows)
│   │   └── preload.ts         # Secure bridge between main and renderer
│   └── icons/
│       ├── icon.icns          # macOS icon
│       └── icon.png           # Source (1024x1024)
│
└── docs/desktop/              # Desktop-specific documentation
    ├── ROADMAP.md             # Implementation checklist
    ├── ARCHITECTURE.md        # This file
    └── CODE_EXAMPLES.md       # Complete code templates
```

### User Data Location

```
~/Library/Application Support/HR Command Center/
├── database/
│   └── hrskills.db            # Main SQLite database
├── backups/
│   ├── hrskills-backup-2025-01-15T02-00-00.db
│   └── ... (30 days retained)
├── config.json                # App configuration
└── hrskills.db.corrupt-*      # Quarantined corrupt files (if any)

~/Library/Logs/HR Command Center/
└── main.log                   # Application logs (5MB rotation)
```

---

## 4. Security Architecture

### Electron Process Model

Electron has two processes:

1. **Main Process** (Node.js) — Full system access, runs backend
2. **Renderer Process** (Chromium) — Runs web UI, **must be sandboxed**

**Golden Rule:** Never give the renderer direct Node.js access.

### Security Configuration

```typescript
// BrowserWindow configuration (electron-main.ts)
const mainWindow = new BrowserWindow({
  webPreferences: {
    // CRITICAL SECURITY SETTINGS
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,    // Isolates preload from webpage
    nodeIntegration: false,    // Blocks direct Node.js access
    sandbox: true,             // OS-level sandboxing
    webSecurity: true,         // Same-origin policy
    allowRunningInsecureContent: false,
    webviewTag: false,         // No embedded webviews
  }
})
```

### Content Security Policy

```typescript
// Set in main process
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +  // Next.js requires
        "connect-src 'self' https://api.anthropic.com https://api.openai.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:;"
      ]
    }
  })
})
```

### IPC Architecture

The **preload script** is the ONLY safe way for renderer to talk to main:

```typescript
// preload.ts - Whitelist exactly what renderer can do
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  exportData: (format: 'json' | 'csv') => ipcRenderer.invoke('db:export', format),

  // System info (read-only)
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getDataPath: () => ipcRenderer.invoke('app:dataPath'),

  // Secure key storage
  storeApiKey: (provider: string, key: string) =>
    ipcRenderer.invoke('keychain:store', provider, key),
  retrieveApiKey: (provider: string) =>
    ipcRenderer.invoke('keychain:retrieve', provider),

  // NEVER expose:
  // - File system access (path traversal risk)
  // - Shell execution (command injection risk)
  // - Arbitrary IPC channels (privilege escalation)
})
```

### Security Checklist

- [ ] `contextIsolation: true` in all BrowserWindow instances
- [ ] `nodeIntegration: false` in all BrowserWindow instances
- [ ] `sandbox: true` enabled
- [ ] CSP configured (no `unsafe-eval`)
- [ ] All IPC handlers validate inputs with Zod
- [ ] No `shell.openExternal()` with user-controlled URLs
- [ ] No `fs` operations with user-controlled paths
- [ ] DevTools disabled in production (`app.isPackaged` check)

---

## 5. Database Strategy

### Location Management

```typescript
// In electron-main.ts
const dbDir = path.join(app.getPath('userData'), 'database')
await fs.ensureDir(dbDir)

// Set before spawning Next.js
process.env.DB_DIR = dbDir
```

The webapp's `lib/db/index.ts` reads `DB_DIR` and creates `hrskills.db` there.

### Backup Strategy

| Trigger | When |
|---------|------|
| Startup | If last backup >24 hours old |
| Scheduled | Daily at 2 AM |
| Pre-migration | Before database schema changes |
| Manual | User clicks "Backup Now" in Settings |

**Retention:** 30 days, then automatic cleanup.

### Corruption Recovery

```
1. App starts
2. Run PRAGMA integrity_check
3. If corrupt:
   a. Move corrupt file to *.corrupt-{timestamp}
   b. Find most recent valid backup
   c. Restore from backup
   d. Show user notification
```

### GDPR Data Export

Users can export all their data as JSON for portability:

```typescript
// IPC handler for GDPR export
ipcMain.handle('db:exportGdpr', async () => {
  const data = {
    exportDate: new Date().toISOString(),
    employees: /* all employee records */,
    metrics: /* all metrics */,
    conversations: /* all chat history */,
    // ... all tables
  }
  // User picks save location via dialog
})
```

---

## 6. AI Provider Integration

### Key Storage Strategy

**Decision:** Use macOS Keychain for API keys

**Why Keychain over encrypted DB field?**
- OS-level encryption (no key management burden)
- Survives app reinstalls
- Standard macOS security practice
- Users can see/delete keys in Keychain Access

```typescript
// Using keytar (or safeStorage from Electron)
import keytar from 'keytar'

const SERVICE_NAME = 'HR Command Center'

// Store
await keytar.setPassword(SERVICE_NAME, 'anthropic-api-key', apiKey)

// Retrieve
const apiKey = await keytar.getPassword(SERVICE_NAME, 'anthropic-api-key')

// Delete
await keytar.deletePassword(SERVICE_NAME, 'anthropic-api-key')
```

### Failover Chain

The app inherits the webapp's multi-provider failover:

```
Anthropic → OpenAI (if Anthropic fails)
```

Circuit breaker pattern prevents cascading failures.

### Network Documentation

Document clearly for users:
- App sends prompts to AI providers (Anthropic/OpenAI)
- App does NOT send bulk HR data anywhere
- App does NOT phone home (except license validation once)

---

## 7. Update Strategy

### Mechanism: electron-updater + GitHub Releases

```
1. App checks for updates:
   - 10 seconds after launch
   - Every 6 hours while running

2. If update available:
   - Show notification (non-intrusive)
   - User clicks → download begins
   - Progress shown in Settings

3. Download complete:
   - "Restart to Update" prompt
   - Installs on app quit
```

### Rollback Strategy

If an update breaks the app:

1. **Immediate:** Pull the GitHub release (stops new downloads)
2. **Quick fix:** Release v1.0.2 with revert
3. **Notify users:** In-app notification about reinstall

Database migrations always backup first, can restore on failure.

### Release Process

```yaml
# .github/workflows/desktop-release.yml triggers on:
on:
  push:
    tags:
      - 'v*'  # v1.0.0, v1.0.1, etc.

# Workflow:
1. Build webapp (npm run build)
2. Build Electron (npm run build)
3. Package + sign + notarize
4. Upload to GitHub Releases
```

---

## 8. Offline Mode

### Feature Matrix

| Feature | Online | Offline |
|---------|--------|---------|
| Chat with AI | Yes | No (queued) |
| View employees | Yes | Yes |
| Analytics queries | Yes | Yes |
| Export data | Yes | Yes |
| Import data | Yes | Yes |
| Settings | Yes | Yes |

### Graceful Degradation

When AI providers unreachable:

1. **Detection:** Automatic via health checks
2. **UI Feedback:** Banner: "AI features temporarily unavailable"
3. **Queueing:** Optional - queue messages, send when online
4. **Local fallback:** Show cached responses if available

### Implementation

```typescript
// In chat route, check connectivity before AI call
const isOnline = await checkAIProviderHealth()

if (!isOnline) {
  return {
    message: "I'm currently unable to connect to AI services. " +
             "Please check your internet connection.",
    offline: true
  }
}
```

---

## 9. First-Run Experience

### Detection Flow

```
Electron starts
    │
    ├── Check: Does config.json exist?
    │   │
    │   ├── NO → First run
    │   │   └── Load http://localhost:3000/setup
    │   │
    │   └── YES → Check license validity
    │       │
    │       ├── VALID → Load http://localhost:3000
    │       │
    │       └── INVALID → Load http://localhost:3000/setup?step=license
```

### Implementation

```typescript
// electron-main.ts
async function getStartUrl(): Promise<string> {
  const configPath = path.join(app.getPath('userData'), 'config.json')

  if (!await fs.pathExists(configPath)) {
    return 'http://localhost:3000/setup'
  }

  const config = await fs.readJson(configPath)

  if (!config.licenseKey || !config.licenseValidated) {
    return 'http://localhost:3000/setup?step=license'
  }

  if (!config.aiProviderConfigured) {
    return 'http://localhost:3000/setup?step=ai'
  }

  return 'http://localhost:3000'
}
```

### Wizard Steps

1. **Welcome** — Privacy explanation, "Get Started"
2. **License** — Enter key from purchase email, validate
3. **AI Provider** — Choose Anthropic or OpenAI
4. **API Key Setup** — Step-by-step guide with screenshots
5. **Data Choice** — Fresh, demo, or import
6. **Complete** — Celebration, quick tips

### API Key Setup Sub-Wizard

Critical for non-technical users:

```
Step A: Create Anthropic account
        [Open Anthropic Sign Up] → opens browser

Step B: Add payment method
        [Screenshot of billing page]
        [Open Billing Page] → opens browser

Step C: Create API key
        [Screenshot of API keys page]
        1. Click "Create Key"
        2. Name it "HR Command Center"
        3. Copy the key

Step D: Paste key here
        [Input field]
        [Test Connection] → shows green checkmark
```

### Error Messages

Convert technical errors to friendly language:

| Technical | Friendly |
|-----------|----------|
| `401 invalid_api_key` | "That key doesn't seem to work. Check you copied the full key (starts with sk-ant-)." |
| `402 insufficient_funds` | "Your Anthropic account needs a payment method. Go back to Step B." |
| `rate_limit` | "Too many requests. Please wait a moment and try again." |

---

## Appendix: Technology Stack

### Desktop-Specific Dependencies

```json
{
  "dependencies": {
    "electron-log": "^5.0.1",
    "electron-updater": "^6.1.7",
    "better-sqlite3": "^9.2.2",
    "fs-extra": "^11.2.0",
    "node-schedule": "^2.1.1",
    "keytar": "^7.9.0"
  },
  "devDependencies": {
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "@sentry/electron": "^4.17.0"
  }
}
```

### Requirements

- **macOS:** 10.15+ (Catalina or later)
- **Node.js:** 20+ (bundled with Electron)
- **Storage:** ~500MB for app + database
- **RAM:** 512MB minimum
- **Network:** Required for AI features, optional for local features

---

**Document Version:** 1.0
**Created:** 2025-11-26
**Source:** Extracted from desktop-app-electron-plan.md
