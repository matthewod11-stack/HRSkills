# HR Command Center Desktop App – Electron Implementation Plan (macOS First)

> **This document has been reorganized.** For easier implementation, use these focused documents:
>
> | Document | Purpose |
> |----------|---------|
> | **[ROADMAP.md](./desktop/ROADMAP.md)** | Actionable checklist with reordered phases |
> | **[ARCHITECTURE.md](./desktop/ARCHITECTURE.md)** | Technical specification & concepts |
> | **[CODE_EXAMPLES.md](./desktop/CODE_EXAMPLES.md)** | Copy-paste ready implementation code |
>
> **Key improvements in the split docs:**
> - Phases reordered for better testability (Electron working before licensing)
> - Critical gaps filled: port detection, API key storage (Keychain), Next.js crash handling
> - Linear checklist extracted for tracking
> - Realistic timeline: 12-16 weeks (not 8-10)
>
> This original document is preserved as the comprehensive reference.

---

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

**Estimated Timeline:** 8-10 weeks (assuming full-time focus)
**Critical Path Items:** 9 manual pause points requiring your action
**Risk Level:** Medium (PII handling + code signing complexity)

---

## Distribution Model: Direct Sales (NOT App Store)

> **Decision:** We are selling direct from our website, NOT through the Mac App Store.

### Why Direct Sales?

| Factor | Direct Sales ✓ | Mac App Store ✗ |
|--------|----------------|-----------------|
| **Revenue** | Keep ~97% (Stripe 2.9% + $0.30) | Keep 70-85% (Apple takes 15-30%) |
| **Control** | Full pricing/licensing control | Apple approval required |
| **Updates** | Ship instantly via GitHub | Review delays (1-7 days) |
| **User Data** | Never touches our servers | Same |
| **Requirements** | Code signing + notarization | Same + App Store guidelines |

### Architecture: Local-First Privacy Model

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER'S COMPUTER                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  HR Command Center Desktop App                            │  │
│  │  ├── Electron shell                                       │  │
│  │  ├── Next.js (runs locally on localhost:3000)             │  │
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

WE MANAGE: License key validation (simple API), app updates
CUSTOMER OWNS: All their HR data, their AI API keys, runs on their machine
WE NEVER SEE: Employee names, salaries, PII, chat history, documents
```

### Customer Journey: Purchase to First Use

```
1. DISCOVER
   └── Customer visits hrcommandcenter.com

2. PURCHASE
   └── Click "Buy Now" → Stripe Checkout ($X one-time or subscription)
   └── Stripe webhook generates license key
   └── Customer receives email with:
       - Download link (.dmg)
       - License key
       - Quick start guide PDF

3. INSTALL
   └── Download .dmg from our CDN (or GitHub Releases)
   └── Drag to /Applications (standard macOS install)
   └── First launch → Gatekeeper allows (we're signed + notarized)

4. ACTIVATE (First-Run Wizard - Step 1)
   └── Welcome screen explains local-first privacy
   └── Enter license key (validates against our simple API)
   └── License stored locally (works offline after activation)

5. AI SETUP (First-Run Wizard - Step 2) ⭐ CRITICAL FOR NON-TECHNICAL USERS
   └── Guided walkthrough with screenshots
   └── "Get your AI key" button → opens Anthropic signup in browser
   └── Copy/paste key into app
   └── Test connection → green checkmark
   └── Optional: Add backup OpenAI key

6. READY
   └── Optional: Import existing data or start fresh with demo data
   └── Dashboard loads → customer is ready to use

Total time: ~10 minutes from purchase to first chat
```

### What We Host vs. What's Local

| Component | Location | Notes |
|-----------|----------|-------|
| Product website | Our hosting (Vercel) | Sales, docs, support |
| License validation API | Our hosting (single endpoint) | Called once on activation |
| App downloads (.dmg) | GitHub Releases or S3 | Free via GitHub |
| Update server | GitHub Releases | electron-updater checks here |
| Customer's HR data | Customer's Mac | Never leaves their machine |
| Customer's AI keys | Customer's Mac (encrypted) | We never see these |
| Chat history | Customer's Mac | SQLite database |

---

## Critical Gaps in This Plan

The technical specification below is comprehensive but some items need attention:

### ✅ RESOLVED

### 1. **Distribution Model** → RESOLVED (see above)
- Direct sales via website, NOT App Store
- Customer journey documented
- Architecture clarified

### 4. **First-Run Experience** → RESOLVED (see Phase 8)
- Comprehensive onboarding wizard with API key setup
- Non-technical user focus with guided walkthrough
- License activation + AI setup in single flow

### 11. **Legal & Licensing** → RESOLVED (see Phase 0.5)
- Payment infrastructure (Stripe)
- License key generation and validation
- EULA and privacy policy requirements documented

### ⚠️ STILL NEEDS ATTENTION

### 2. **Icon Assets** (MISSING)
- Plan mentions `desktop/icons/icon.icns` but no creation guide
- Need 1024x1024 source image → .icns conversion process

### 3. **Port Conflict Resolution** (MISSING)
- Assumes port 3000 is always available
- No dynamic port allocation strategy
- No graceful fallback if Next.js fails to start

### 5. **Beta Testing Phase** (IN PLAN - Phase 11)
- Plan exists but needs beta tester recruitment strategy
- Feedback collection mechanism needed

### 6. **User Documentation** (IN PLAN - Phase 12)
- Installation guide template needed
- FAQ based on beta feedback

### 7. **Offline Mode Strategy** (INCOMPLETE)
- Plan mentions "graceful degradation" but no implementation details
- Need UI feedback when AI providers are unreachable
- Need local-only features that work without internet

### 8. **Multi-User macOS Support** (LOW PRIORITY)
- Single user per machine assumed for v1.0
- Can revisit if enterprise customers request

### 9. **Resource Limits & Monitoring** (MISSING)
- No memory limits for Next.js child process
- No CPU usage monitoring
- No automatic restart on memory leaks

### 10. **Windows Support Timeline** (DEFERRED)
- macOS only for v1.0
- Windows support based on customer demand post-launch
- Decision point: 3 months after macOS launch

### 12. **Rollback Strategy** (INCOMPLETE)
- Update rollback covered, but not initial deployment rollback
- What if v1.0.0 has critical bugs after public launch?
- Hotfix deployment process

---

## Implementation Phases Overview

| Phase | Timeline | Focus | Manual Pause Points |
|-------|----------|-------|---------------------|
| 0 | Week 1 | Pre-flight validation & planning | 0A: Review baseline |
| **0.5** | **Week 1-2** | **Payment & Licensing Infrastructure** | **0.5A: Stripe setup** |
| 1 | Week 2 | Branch setup & Electron scaffolding | 1A: Verify Electron works |
| 2 | Week 2 | Icon creation & branding | — |
| 3 | Week 3 | Next.js integration | — |
| 4 | Week 3-4 | Secure IPC implementation | 4A: Security audit |
| 5 | Week 4 | Database backup & recovery | — |
| 6 | Week 4 | Crash reporting & monitoring | 6A: Sentry config |
| 7 | Week 5 | Auto-update infrastructure | 7A: GitHub secrets |
| 8 | Week 5-6 | **First-run wizard & API key setup** | 8A: UX review |
| 9 | Week 6 | Feature parity validation | 9A: Feature sign-off |
| 10 | Week 5-6 | macOS code signing & notarization | 10A: Apple setup, 10B: Verify |
| 11 | Week 6 | Beta testing | 11A: Beta retrospective |
| 12 | Week 6-7 | User documentation | — |
| 13 | Week 7-8 | Production build & release | 13A: Legal review, 13B: Go/No-Go |

---

## Phase 0: Pre-Flight Validation & Planning (Week 1)

**Goal:** Ensure webapp is production-ready before any desktop work begins

### Tasks:
- [ ] Run core validation suite: `cd webapp && npm run type-check` and `npm run format:check`
- [ ] Verify production build completes successfully: `cd webapp && npm run build`
- [ ] Document current webapp performance baselines
  - Chat response times (p50, p95, p99)
  - Database query performance
  - Bundle size metrics
- [ ] Create feature inventory spreadsheet (all 25 skills + UI features)
- [ ] Verify all environment variables work in production mode
- [ ] Test multi-provider AI failover chain (Anthropic → OpenAI)
- [ ] Run security audit on auth/PII handling paths
- [ ] Document known issues in webapp (technical debt tracker)

### Deliverables:
- `docs/desktop/WEBAPP_BASELINE.md` - Performance/feature baseline
- `docs/desktop/FEATURE_PARITY_CHECKLIST.md` - All features to replicate
- Security audit report from security-auditor agent

### 🔴 PAUSE POINT 0A: Review Baseline
**You must:** Review baseline docs and approve proceeding to desktop implementation

---

## Phase 0.5: Payment & Licensing Infrastructure (Week 1-2)

**Goal:** Set up direct sales infrastructure before building the app

> **Why before Electron work?** You want the purchase → download → activate flow designed first. This influences the first-run experience (Phase 8) and ensures you're not retrofitting licensing later.

### 0.5.1 Stripe Setup

#### Tasks:
- [ ] Create Stripe account (if not exists): https://dashboard.stripe.com
- [ ] Create product in Stripe Dashboard
  - Product name: "HR Command Center"
  - Pricing: One-time purchase OR subscription (decide)
  - Price: $X (decide based on market research)
- [ ] Configure Stripe Checkout
  - Success URL: `https://hrcommandcenter.com/purchase/success?session_id={CHECKOUT_SESSION_ID}`
  - Cancel URL: `https://hrcommandcenter.com/purchase/cancelled`
- [ ] Set up Stripe webhook endpoint
  - Event: `checkout.session.completed`
  - Endpoint: `https://hrcommandcenter.com/api/webhooks/stripe`

#### Stripe Webhook Handler (Serverless Function)

```typescript
// pages/api/webhooks/stripe.ts (or app/api/webhooks/stripe/route.ts)
import Stripe from 'stripe'
import { generateLicenseKey, storeLicense, sendPurchaseEmail } from '@/lib/licensing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Generate unique license key
    const licenseKey = generateLicenseKey()

    // Store in database
    await storeLicense({
      key: licenseKey,
      customerEmail: session.customer_email!,
      stripeCustomerId: session.customer as string,
      stripeSessionId: session.id,
      createdAt: new Date(),
      activatedAt: null, // Set when user activates in app
      machineId: null,   // Set when user activates in app
    })

    // Send purchase confirmation email
    await sendPurchaseEmail({
      to: session.customer_email!,
      licenseKey,
      downloadUrl: 'https://hrcommandcenter.com/download',
    })
  }

  return new Response('OK', { status: 200 })
}
```

### 0.5.2 License Key System

#### License Key Format

```
HRCC-XXXX-XXXX-XXXX-XXXX

Where:
- HRCC = Product prefix
- Each X = Alphanumeric (A-Z, 0-9, excluding confusing chars like O/0, I/1)
- Example: HRCC-A3B7-K9M2-P4N8-Q6R1
```

#### License Key Generation

```typescript
// lib/licensing/generate.ts
import { randomBytes } from 'crypto'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No O/0, I/1, L

export function generateLicenseKey(): string {
  const segments: string[] = []

  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      const randomIndex = randomBytes(1)[0] % CHARSET.length
      segment += CHARSET[randomIndex]
    }
    segments.push(segment)
  }

  return `HRCC-${segments.join('-')}`
}
```

#### License Validation API (Single Endpoint)

```typescript
// app/api/license/validate/route.ts
import { db } from '@/lib/db'
import { licensesTable } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'

const validateSchema = z.object({
  licenseKey: z.string().regex(/^HRCC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/),
  machineId: z.string().min(10).max(100),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { licenseKey, machineId } = validateSchema.parse(body)

    // Find license
    const license = await db.select()
      .from(licensesTable)
      .where(eq(licensesTable.key, licenseKey))
      .limit(1)

    if (license.length === 0) {
      return Response.json({ valid: false, error: 'Invalid license key' }, { status: 400 })
    }

    const existingLicense = license[0]

    // Check if already activated on different machine
    if (existingLicense.machineId && existingLicense.machineId !== machineId) {
      return Response.json({
        valid: false,
        error: 'License already activated on another device',
        hint: 'Contact support@hrcommandcenter.com to transfer your license'
      }, { status: 400 })
    }

    // Activate if first time
    if (!existingLicense.activatedAt) {
      await db.update(licensesTable)
        .set({
          activatedAt: new Date(),
          machineId: machineId,
        })
        .where(eq(licensesTable.key, licenseKey))
    }

    return Response.json({
      valid: true,
      customerEmail: existingLicense.customerEmail,
      activatedAt: existingLicense.activatedAt || new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ valid: false, error: 'Invalid request format' }, { status: 400 })
    }
    return Response.json({ valid: false, error: 'Validation failed' }, { status: 500 })
  }
}
```

### 0.5.3 Database Schema for Licenses

```typescript
// Add to webapp/db/schema.ts

export const licensesTable = sqliteTable('licenses', {
  id: text('id').primaryKey().$defaultFn(() => `lic_${Date.now()}`),
  key: text('key').notNull().unique(),
  customerEmail: text('customer_email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSessionId: text('stripe_session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),
  machineId: text('machine_id'),
  deactivatedAt: integer('deactivated_at', { mode: 'timestamp' }),
  notes: text('notes'),
})
```

### 0.5.4 Purchase Success Page

```typescript
// app/purchase/success/page.tsx
export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  // Fetch session details from Stripe (optional, for display)

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-4">Thank You for Your Purchase!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Check your email for your license key and download instructions.
        </p>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-2">What happens next?</h2>
          <ol className="text-left text-sm space-y-2">
            <li>1. Check your email for your license key</li>
            <li>2. Download HR Command Center for macOS</li>
            <li>3. Open the app and enter your license key</li>
            <li>4. Follow the setup wizard to connect your AI provider</li>
          </ol>
        </div>

        <a
          href="/download"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Download Now
        </a>
      </div>
    </div>
  )
}
```

### 0.5.5 Email Templates

#### Purchase Confirmation Email

```
Subject: Your HR Command Center License Key 🔑

Hi there!

Thank you for purchasing HR Command Center. Here's everything you need to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LICENSE KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HRCC-A3B7-K9M2-P4N8-Q6R1

Keep this email safe - you'll need this key to activate the app.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GETTING STARTED (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DOWNLOAD
   → https://hrcommandcenter.com/download

2. INSTALL
   → Open the .dmg file
   → Drag HR Command Center to your Applications folder

3. ACTIVATE
   → Open the app
   → Enter your license key when prompted

4. CONNECT AI
   → The app will guide you through setting up your AI provider
   → We recommend Anthropic Claude for best results
   → Don't have an API key? The app will help you get one!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Setup Guide: https://hrcommandcenter.com/docs/getting-started
❓ FAQ: https://hrcommandcenter.com/faq
📧 Support: support@hrcommandcenter.com

Your data stays on YOUR computer. We never see your HR information.

Welcome aboard!
The HR Command Center Team
```

### Deliverables:
- [ ] Stripe product and checkout configured
- [ ] Webhook endpoint deployed and tested
- [ ] License validation API deployed
- [ ] Database schema updated with licenses table
- [ ] Purchase success page live
- [ ] Email template configured (use SendGrid, Resend, or Postmark)
- [ ] Test full purchase flow with Stripe test mode

### 🔴 PAUSE POINT 0.5A: Stripe Configuration
**You must:**
1. Complete Stripe account setup
2. Test full purchase flow in test mode
3. Verify webhook receives events
4. Verify email sends with license key

---

## Phase 1: Branch Setup & Desktop Scaffolding (Week 2)

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

## Phase 8: First-Run Wizard & API Key Setup (Week 5-6)

**Goal:** Create a seamless onboarding experience for NON-TECHNICAL users

> **⭐ CRITICAL:** This is the make-or-break moment. A confused user during setup = refund request. The wizard must be foolproof with clear visual guidance at every step.

### 8.1 Design Principles

1. **Zero jargon** - Say "your AI assistant connection" not "API key"
2. **Visual guidance** - Screenshots showing exactly where to click
3. **One action per screen** - Don't overwhelm
4. **Instant feedback** - Green checkmarks, progress indicators
5. **Graceful errors** - Helpful messages, not technical errors
6. **Skip nothing** - Guide through EVERY step, assume nothing

### 8.2 First-Run Detection

```typescript
// desktop/src/electron-main.ts
import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

async function isFirstRun(): Promise<boolean> {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  return !(await fs.pathExists(configPath))
}

async function checkLicenseStatus(): Promise<'none' | 'valid' | 'expired'> {
  const configPath = path.join(app.getPath('userData'), 'config.json')

  if (!(await fs.pathExists(configPath))) {
    return 'none'
  }

  const config = await fs.readJson(configPath)

  if (!config.licenseKey) {
    return 'none'
  }

  // Check if license is still valid (optional: re-validate with server)
  return 'valid'
}
```

### 8.3 Wizard Flow (5 Steps)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: WELCOME                                            │
│                                                             │
│  [App Logo]                                                 │
│                                                             │
│  Welcome to HR Command Center!                              │
│                                                             │
│  Your AI-powered HR assistant that keeps                    │
│  all your data private on this computer.                    │
│                                                             │
│  Setup takes about 5 minutes.                               │
│                                                             │
│  ○───○───○───○───○  Step 1 of 5                             │
│                                                             │
│              [ Get Started → ]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 2: ACTIVATE LICENSE                                   │
│                                                             │
│  Enter your license key                                     │
│                                                             │
│  You received this in your purchase confirmation email.     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HRCC-____-____-____-____                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Can't find your key? Check email from                     │
│   noreply@hrcommandcenter.com]                              │
│                                                             │
│  ●───○───○───○───○  Step 2 of 5                             │
│                                                             │
│  [ ← Back ]              [ Activate → ]                     │
│                                                             │
│  ✓ Valid license!  (or)  ✗ Invalid key - check for typos   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 3: CONNECT YOUR AI ASSISTANT                          │
│                                                             │
│  HR Command Center uses Claude AI to help you.              │
│  You'll need your own AI account (takes 2 minutes).         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Anthropic Logo]                                   │   │
│  │                                                     │   │
│  │  Claude by Anthropic                                │   │
│  │  ★★★★★ Recommended - Best for HR tasks              │   │
│  │                                                     │   │
│  │  [ Set up Claude → ]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [OpenAI Logo]                                      │   │
│  │                                                     │   │
│  │  ChatGPT by OpenAI                                  │   │
│  │  Alternative option                                 │   │
│  │                                                     │   │
│  │  [ Set up ChatGPT → ]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ●───●───○───○───○  Step 3 of 5                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 3A: GET YOUR CLAUDE KEY (Sub-wizard)                  │
│                                                             │
│  Let's connect Claude AI. Follow these steps:               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP A: Create an Anthropic account                 │   │
│  │                                                     │   │
│  │ Click the button below. A browser window will open. │   │
│  │                                                     │   │
│  │ [ Open Anthropic Sign Up ↗ ]                        │   │
│  │                                                     │   │
│  │ Already have an account? [ Skip to Step B ]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP B: Add payment method                          │   │
│  │                                                     │   │
│  │ Anthropic requires a credit card for API access.    │   │
│  │ You only pay for what you use (~$5-15/month typical)│   │
│  │                                                     │   │
│  │ 1. Go to console.anthropic.com                      │   │
│  │ 2. Click "Billing" in the left menu                 │   │
│  │ 3. Add your payment method                          │   │
│  │                                                     │   │
│  │ [SCREENSHOT: Anthropic billing page]                │   │
│  │                                                     │   │
│  │ [ Open Billing Page ↗ ]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP C: Create your API key                         │   │
│  │                                                     │   │
│  │ 1. Go to console.anthropic.com/settings/keys        │   │
│  │ 2. Click "Create Key"                               │   │
│  │ 3. Name it "HR Command Center"                      │   │
│  │ 4. Click "Create"                                   │   │
│  │ 5. COPY the key (starts with sk-ant-)               │   │
│  │                                                     │   │
│  │ [SCREENSHOT: API keys page with arrow pointing to   │   │
│  │  "Create Key" button]                               │   │
│  │                                                     │   │
│  │ [ Open API Keys Page ↗ ]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP D: Paste your key here                         │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ sk-ant-api03-________________________      │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ [ Test Connection ]                                 │   │
│  │                                                     │   │
│  │ ✓ Connected successfully!                           │   │
│  │   Model: Claude 3.5 Sonnet                          │   │
│  │   Status: Ready                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│              [ ← Back ]        [ Continue → ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 4: CHOOSE YOUR DATA                                   │
│                                                             │
│  How would you like to start?                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [ ] Start Fresh                                    │   │
│  │      Begin with an empty database                   │   │
│  │      Perfect if you're importing your own data      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] Try Demo Mode                                  │   │
│  │      Explore with 50 sample employees               │   │
│  │      You can clear this data anytime                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [ ] Import Existing Data                           │   │
│  │      Have a spreadsheet? Import your employee list  │   │
│  │      Supports: Excel (.xlsx), CSV                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ●───●───●───○───○  Step 4 of 5                             │
│                                                             │
│              [ ← Back ]        [ Continue → ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 5: YOU'RE ALL SET!                                    │
│                                                             │
│  [Celebration animation / confetti]                         │
│                                                             │
│  🎉 HR Command Center is ready!                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ License activated                                │   │
│  │  ✓ Claude AI connected                              │   │
│  │  ✓ Demo data loaded                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Quick tips to get started:                                 │
│                                                             │
│  💬 "Show me employees at risk of leaving"                  │
│  📊 "What's our turnover rate this quarter?"                │
│  📝 "Draft a performance review for Sarah Chen"             │
│                                                             │
│  ●───●───●───●───●  Complete!                               │
│                                                             │
│              [ Open HR Command Center → ]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Implementation: Wizard Components

```typescript
// webapp/components/onboarding/SetupWizard.tsx
'use client'

import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { LicenseStep } from './steps/LicenseStep'
import { AIProviderStep } from './steps/AIProviderStep'
import { DataStep } from './steps/DataStep'
import { CompleteStep } from './steps/CompleteStep'

type WizardStep = 'welcome' | 'license' | 'ai-provider' | 'data' | 'complete'

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [config, setConfig] = useState({
    licenseKey: '',
    aiProvider: '' as 'anthropic' | 'openai' | '',
    aiApiKey: '',
    dataMode: '' as 'fresh' | 'demo' | 'import' | '',
  })

  const steps: WizardStep[] = ['welcome', 'license', 'ai-provider', 'data', 'complete']
  const currentIndex = steps.indexOf(step)

  const goNext = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex])
    }
  }

  const goBack = () => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  i <= currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 'welcome' && <WelcomeStep onNext={goNext} />}
        {step === 'license' && (
          <LicenseStep
            value={config.licenseKey}
            onChange={(key) => setConfig({ ...config, licenseKey: key })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'ai-provider' && (
          <AIProviderStep
            config={config}
            onChange={(updates) => setConfig({ ...config, ...updates })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'data' && (
          <DataStep
            value={config.dataMode}
            onChange={(mode) => setConfig({ ...config, dataMode: mode })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'complete' && <CompleteStep onComplete={onComplete} />}
      </div>
    </div>
  )
}
```

### 8.5 API Key Setup Sub-Wizard (Critical for Non-Technical Users)

```typescript
// webapp/components/onboarding/steps/AIProviderStep.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  config: { aiProvider: string; aiApiKey: string }
  onChange: (updates: Partial<{ aiProvider: string; aiApiKey: string }>) => void
  onNext: () => void
  onBack: () => void
}

type SubStep = 'choose' | 'anthropic-guide' | 'openai-guide' | 'test'

export function AIProviderStep({ config, onChange, onNext, onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>('choose')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const testConnection = async () => {
    setTestStatus('testing')
    setErrorMessage('')

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.aiProvider,
          apiKey: config.aiApiKey,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTestStatus('success')
        // Save to local config
        await saveApiKey(config.aiProvider, config.aiApiKey)
      } else {
        setTestStatus('error')
        setErrorMessage(friendlyErrorMessage(result.error))
      }
    } catch {
      setTestStatus('error')
      setErrorMessage('Could not connect. Check your internet connection.')
    }
  }

  // Render based on sub-step
  if (subStep === 'choose') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your AI Assistant
          </h2>
          <p className="text-gray-600">
            HR Command Center uses AI to help you. Choose your provider below.
          </p>
        </div>

        <div className="space-y-4">
          {/* Anthropic Option - Recommended */}
          <button
            onClick={() => {
              onChange({ aiProvider: 'anthropic' })
              setSubStep('anthropic-guide')
            }}
            className="w-full p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                {/* Anthropic logo */}
                <span className="text-2xl">🔶</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Claude by Anthropic</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Best for HR tasks. Excellent at writing, analysis, and understanding context.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  ~$5-15/month for typical HR usage
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>

          {/* OpenAI Option */}
          <button
            onClick={() => {
              onChange({ aiProvider: 'openai' })
              setSubStep('openai-guide')
            }}
            className="w-full p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">ChatGPT by OpenAI</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Alternative option if you already have an OpenAI account.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  ~$5-20/month for typical HR usage
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  if (subStep === 'anthropic-guide') {
    return (
      <AnthropicSetupGuide
        apiKey={config.aiApiKey}
        onApiKeyChange={(key) => onChange({ aiApiKey: key })}
        testStatus={testStatus}
        errorMessage={errorMessage}
        onTest={testConnection}
        onBack={() => setSubStep('choose')}
        onNext={testStatus === 'success' ? onNext : undefined}
      />
    )
  }

  // Similar for openai-guide...
  return null
}

// Detailed Anthropic setup guide with screenshots
function AnthropicSetupGuide({
  apiKey,
  onApiKeyChange,
  testStatus,
  errorMessage,
  onTest,
  onBack,
  onNext,
}: {
  apiKey: string
  onApiKeyChange: (key: string) => void
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  errorMessage: string
  onTest: () => void
  onBack: () => void
  onNext?: () => void
}) {
  const [expandedStep, setExpandedStep] = useState<'A' | 'B' | 'C' | 'D'>('A')

  const openInBrowser = (url: string) => {
    // In Electron, this opens the user's default browser
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Claude AI
        </h2>
        <p className="text-gray-600">
          Follow these steps to connect Claude. Takes about 2 minutes.
        </p>
      </div>

      {/* Step A: Create Account */}
      <div className={`border rounded-xl overflow-hidden ${expandedStep === 'A' ? 'border-blue-500' : ''}`}>
        <button
          onClick={() => setExpandedStep('A')}
          className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              expandedStep === 'A' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              A
            </div>
            <span className="font-medium">Create an Anthropic account</span>
          </div>
          <span>{expandedStep === 'A' ? '−' : '+'}</span>
        </button>

        {expandedStep === 'A' && (
          <div className="p-4 space-y-4">
            <p className="text-gray-600">
              Click the button below to create a free Anthropic account.
              A browser window will open.
            </p>

            <button
              onClick={() => openInBrowser('https://console.anthropic.com/signup')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              Open Anthropic Sign Up
              <span>↗</span>
            </button>

            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                onClick={() => setExpandedStep('B')}
                className="text-blue-600 hover:underline"
              >
                Skip to Step B
              </button>
            </p>

            <button
              onClick={() => setExpandedStep('B')}
              className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              I've created my account →
            </button>
          </div>
        )}
      </div>

      {/* Step B: Add Payment */}
      <div className={`border rounded-xl overflow-hidden ${expandedStep === 'B' ? 'border-blue-500' : ''}`}>
        <button
          onClick={() => setExpandedStep('B')}
          className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              expandedStep === 'B' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              B
            </div>
            <span className="font-medium">Add a payment method</span>
          </div>
          <span>{expandedStep === 'B' ? '−' : '+'}</span>
        </button>

        {expandedStep === 'B' && (
          <div className="p-4 space-y-4">
            <p className="text-gray-600">
              Anthropic requires a credit card for API access.
              <span className="font-medium"> You only pay for what you use </span>
              (~$5-15/month for typical HR tasks).
            </p>

            {/* Screenshot placeholder - you'd add actual screenshot */}
            <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
              [Screenshot: Anthropic billing page]
            </div>

            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Go to console.anthropic.com</li>
              <li>2. Click "Settings" → "Billing" in the menu</li>
              <li>3. Add your credit card</li>
            </ol>

            <button
              onClick={() => openInBrowser('https://console.anthropic.com/settings/billing')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              Open Billing Settings
              <span>↗</span>
            </button>

            <button
              onClick={() => setExpandedStep('C')}
              className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              I've added my payment method →
            </button>
          </div>
        )}
      </div>

      {/* Step C: Create API Key */}
      <div className={`border rounded-xl overflow-hidden ${expandedStep === 'C' ? 'border-blue-500' : ''}`}>
        <button
          onClick={() => setExpandedStep('C')}
          className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              expandedStep === 'C' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              C
            </div>
            <span className="font-medium">Create your API key</span>
          </div>
          <span>{expandedStep === 'C' ? '−' : '+'}</span>
        </button>

        {expandedStep === 'C' && (
          <div className="p-4 space-y-4">
            <p className="text-gray-600">
              Now create your API key. This is like a password that lets HR Command Center
              talk to Claude.
            </p>

            {/* Screenshot placeholder */}
            <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
              [Screenshot: API keys page with "Create Key" button highlighted]
            </div>

            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Click the button below to open the API keys page</li>
              <li>2. Click the <span className="font-medium">"Create Key"</span> button</li>
              <li>3. Name it <span className="font-mono bg-gray-100 px-1">HR Command Center</span></li>
              <li>4. Click "Create"</li>
              <li>5. <span className="font-medium text-orange-600">COPY the key</span> (it starts with sk-ant-)</li>
            </ol>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ Important: You can only see the key once! Make sure to copy it before closing.
            </div>

            <button
              onClick={() => openInBrowser('https://console.anthropic.com/settings/keys')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              Open API Keys Page
              <span>↗</span>
            </button>

            <button
              onClick={() => setExpandedStep('D')}
              className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              I've copied my key →
            </button>
          </div>
        )}
      </div>

      {/* Step D: Paste Key */}
      <div className={`border rounded-xl overflow-hidden ${expandedStep === 'D' ? 'border-blue-500' : ''}`}>
        <button
          onClick={() => setExpandedStep('D')}
          className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              expandedStep === 'D' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              D
            </div>
            <span className="font-medium">Paste your key here</span>
          </div>
          <span>{expandedStep === 'D' ? '−' : '+'}</span>
        </button>

        {expandedStep === 'D' && (
          <div className="p-4 space-y-4">
            <p className="text-gray-600">
              Paste the API key you just copied:
            </p>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {testStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ✗ {errorMessage}
              </div>
            )}

            {testStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✓ Connected successfully! Claude is ready.
              </div>
            )}

            <button
              onClick={onTest}
              disabled={!apiKey || testStatus === 'testing'}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testStatus === 'testing' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Testing connection...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          ← Back
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}

// Helper function to convert technical errors to friendly messages
function friendlyErrorMessage(error: string): string {
  if (error.includes('401') || error.includes('invalid_api_key')) {
    return "That key doesn't seem to work. Please check you copied the full key (starts with sk-ant-)."
  }
  if (error.includes('insufficient_funds') || error.includes('402')) {
    return "Your Anthropic account needs a payment method. Go back to Step B to add one."
  }
  if (error.includes('rate_limit')) {
    return "Too many requests. Please wait a moment and try again."
  }
  return "Could not connect. Please check the key and try again."
}
```

### 8.6 Screenshots Required

Create these screenshots for the setup wizard:

| Screenshot | Description | Location |
|------------|-------------|----------|
| `anthropic-signup.png` | Anthropic signup page | Step A |
| `anthropic-billing.png` | Billing settings with "Add payment" highlighted | Step B |
| `anthropic-api-keys.png` | API keys page with "Create Key" button highlighted | Step C |
| `anthropic-create-key.png` | Create key modal with name field | Step C |
| `anthropic-copy-key.png` | Key created, showing copy button | Step C |
| `openai-signup.png` | OpenAI signup page | OpenAI flow |
| `openai-api-keys.png` | OpenAI API keys page | OpenAI flow |

**Image dimensions:** 600x400px, PNG format
**Location:** `webapp/public/onboarding/`

### 8.7 Test Connection API

```typescript
// webapp/app/api/ai/test-connection/route.ts
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { z } from 'zod'

const requestSchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z.string().min(10),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, apiKey } = requestSchema.parse(body)

    if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey })

      // Simple test message
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
      })

      return Response.json({
        success: true,
        model: response.model,
        message: 'Connected to Claude successfully',
      })
    }

    if (provider === 'openai') {
      const client = new OpenAI({ apiKey })

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
      })

      return Response.json({
        success: true,
        model: response.model,
        message: 'Connected to OpenAI successfully',
      })
    }
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || 'Connection test failed',
    }, { status: 400 })
  }
}
```

### Deliverables:
- [ ] First-run detection implemented in Electron main process
- [ ] Complete 5-step wizard UI
- [ ] API key setup sub-wizard with step-by-step guidance
- [ ] Screenshots created for all guided steps
- [ ] Test connection API endpoint
- [ ] Friendly error messages (no technical jargon)
- [ ] Demo data option working
- [ ] Config saved to local storage after completion
- [ ] Test full flow on clean macOS account (no dev tools)

### 🔴 PAUSE POINT 8A: UX Review
**You must:**
1. Run through the entire wizard as a non-technical user would
2. Have someone unfamiliar with the product test the flow
3. Verify all external links open correctly in browser
4. Confirm error messages are helpful and non-technical

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
