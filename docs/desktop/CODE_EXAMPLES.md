# HR Command Center Desktop — Code Examples

> **Purpose:** Copy-paste ready implementation code.
> **Related Docs:** [ROADMAP.md](./ROADMAP.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Table of Contents

1. [Package Configuration](#1-package-configuration)
2. [Electron Main Process](#2-electron-main-process)
3. [Preload Script](#3-preload-script)
4. [TypeScript Definitions](#4-typescript-definitions)
5. [First-Run Detection & Setup Route](#5-first-run-detection--setup-route)
6. [API Key Storage (Keychain)](#6-api-key-storage-keychain)
7. [Test Connection Endpoint](#7-test-connection-endpoint)
8. [Setup Wizard Components](#8-setup-wizard-components)
9. [macOS Entitlements](#9-macos-entitlements)
10. [CI/CD Workflow](#10-cicd-workflow)

---

## 1. Package Configuration

### desktop/package.json

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
    "dev": "npm run build && electron . --dev",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "postinstall": "electron-builder install-app-deps"
  },

  "dependencies": {
    "electron-log": "^5.0.1",
    "electron-updater": "^6.1.7",
    "better-sqlite3": "^9.2.2",
    "fs-extra": "^11.2.0",
    "node-schedule": "^2.1.1",
    "keytar": "^7.9.0",
    "detect-port": "^1.5.1",
    "zod": "^3.22.4"
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
      "icons/**/*"
    ],
    "extraResources": [
      {
        "from": "../webapp/.next",
        "to": "webapp/.next"
      },
      {
        "from": "../webapp/public",
        "to": "webapp/public"
      },
      {
        "from": "../webapp/package.json",
        "to": "webapp/package.json"
      },
      {
        "from": "../webapp/next.config.js",
        "to": "webapp/next.config.js"
      },
      {
        "from": "../webapp/node_modules",
        "to": "webapp/node_modules"
      }
    ],
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "icons/icon.icns",
      "category": "public.app-category.business",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
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

### desktop/tsconfig.json

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

---

## 2. Electron Main Process

### desktop/src/electron-main.ts

```typescript
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
  Notification,
} from 'electron'
import { autoUpdater } from 'electron-updater'
import * as Sentry from '@sentry/electron'
import log from 'electron-log'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import schedule from 'node-schedule'
import Database from 'better-sqlite3'
import detectPort from 'detect-port'
import keytar from 'keytar'
import { z } from 'zod'

// ============================================================================
// CONSTANTS
// ============================================================================

const APP_NAME = 'HR Command Center'
const SERVICE_NAME = 'HR Command Center'
const DEFAULT_PORT = 3000
const SERVER_STARTUP_TIMEOUT = 30000 // 30 seconds
const SERVER_POLL_INTERVAL = 500 // 500ms

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null
let nextProcess: ChildProcess | null = null
let serverPort: number = DEFAULT_PORT

// ============================================================================
// SENTRY INITIALIZATION (Production Only)
// ============================================================================

if (app.isPackaged) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'your-sentry-dsn',
    environment: 'desktop-production',
    release: `hrskills-desktop@${app.getVersion()}`,
    beforeBreadcrumb(breadcrumb) {
      // Redact sensitive data
      if (breadcrumb.message?.toLowerCase().includes('employee')) {
        breadcrumb.message = '[REDACTED - employee data]'
      }
      return breadcrumb
    },
  })
}

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}'
log.info(`[App] Starting ${APP_NAME} v${app.getVersion()}`)

// ============================================================================
// ERROR HANDLERS
// ============================================================================

process.on('uncaughtException', (error) => {
  log.error('[FATAL] Uncaught exception:', error)
  Sentry.captureException(error)

  dialog.showErrorBox(
    'Application Error',
    'An unexpected error occurred. The error has been reported.'
  )

  setTimeout(() => app.quit(), 1000)
})

process.on('unhandledRejection', (reason) => {
  log.error('[ERROR] Unhandled promise rejection:', reason)
  Sentry.captureException(reason)
})

// ============================================================================
// PORT MANAGEMENT
// ============================================================================

async function findAvailablePort(startPort: number): Promise<number> {
  log.info(`[Port] Checking port ${startPort}...`)
  const availablePort = await detectPort(startPort)

  if (availablePort !== startPort) {
    log.warn(`[Port] Port ${startPort} in use, using ${availablePort}`)
  }

  return availablePort
}

// ============================================================================
// DATABASE MANAGEMENT
// ============================================================================

function getDatabasePath(): string {
  return path.join(app.getPath('userData'), 'database', 'hrskills.db')
}

function getBackupDir(): string {
  return path.join(app.getPath('userData'), 'backups')
}

async function verifyDatabaseIntegrity(): Promise<boolean> {
  const dbPath = getDatabasePath()

  if (!await fs.pathExists(dbPath)) {
    log.info('[DB] Database does not exist yet (first run)')
    return true
  }

  try {
    const db = new Database(dbPath, { readonly: true })
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
    db.close()

    const isValid = result.integrity_check === 'ok'
    log.info(`[DB] Integrity check: ${isValid ? 'PASSED' : 'FAILED'}`)
    return isValid
  } catch (error) {
    log.error('[DB] Integrity check error:', error)
    return false
  }
}

async function backupDatabase(): Promise<string | null> {
  const dbPath = getDatabasePath()
  const backupDir = getBackupDir()

  if (!await fs.pathExists(dbPath)) {
    log.info('[Backup] No database to backup')
    return null
  }

  try {
    await fs.ensureDir(backupDir)

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const backupPath = path.join(backupDir, `hrskills-backup-${timestamp}.db`)

    // Checkpoint WAL before copying
    try {
      const db = new Database(dbPath)
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
    } catch {
      log.warn('[Backup] Could not checkpoint WAL')
    }

    await fs.copy(dbPath, backupPath)
    log.info(`[Backup] Created: ${backupPath}`)

    // Clean old backups
    await cleanOldBackups(30)

    return backupPath
  } catch (error) {
    log.error('[Backup] Failed:', error)
    mainWindow?.webContents.send('backup:failed', String(error))
    return null
  }
}

async function cleanOldBackups(keepDays: number): Promise<void> {
  const backupDir = getBackupDir()

  if (!await fs.pathExists(backupDir)) return

  const files = await fs.readdir(backupDir)
  const now = Date.now()
  const keepMs = keepDays * 24 * 60 * 60 * 1000

  for (const file of files) {
    if (!file.endsWith('.db')) continue

    const filePath = path.join(backupDir, file)
    const stats = await fs.stat(filePath)

    if (now - stats.mtimeMs > keepMs) {
      log.info(`[Backup] Deleting old: ${file}`)
      await fs.remove(filePath)
    }
  }
}

async function recoverFromCorruption(): Promise<boolean> {
  log.error('[DB] Database corrupted! Attempting recovery...')

  const dbPath = getDatabasePath()
  const backupDir = getBackupDir()
  const corruptPath = `${dbPath}.corrupt-${Date.now()}`

  // Move corrupt DB aside
  await fs.move(dbPath, corruptPath)

  // Find valid backup
  if (!await fs.pathExists(backupDir)) {
    return false
  }

  const backups = await fs.readdir(backupDir)
  const sortedBackups = backups.filter(f => f.endsWith('.db')).sort().reverse()

  for (const backup of sortedBackups) {
    const backupPath = path.join(backupDir, backup)

    try {
      const testDb = new Database(backupPath, { readonly: true })
      const check = testDb.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
      testDb.close()

      if (check.integrity_check === 'ok') {
        await fs.copy(backupPath, dbPath)
        log.info(`[DB] Restored from: ${backup}`)

        dialog.showMessageBox({
          type: 'warning',
          title: 'Database Recovered',
          message: 'The database was corrupted and restored from a backup.',
          detail: `Restored from: ${backup}`,
        })

        return true
      }
    } catch {
      log.error(`[DB] Backup ${backup} also corrupt`)
    }
  }

  dialog.showErrorBox(
    'Database Recovery Failed',
    'Could not recover database. Please contact support.'
  )

  return false
}

async function setupAutomaticBackups(): Promise<void> {
  await fs.ensureDir(getBackupDir())

  // Daily backup at 2 AM
  schedule.scheduleJob('0 2 * * *', async () => {
    log.info('[Backup] Running scheduled backup...')
    await backupDatabase()
  })

  // Backup on startup if needed
  const backupDir = getBackupDir()
  const files = await fs.readdir(backupDir).catch(() => [])
  const dbFiles = files.filter(f => f.endsWith('.db'))

  if (dbFiles.length === 0) {
    log.info('[Backup] No existing backups, creating initial backup...')
    await backupDatabase()
  } else {
    // Check if last backup is >24h old
    const latestBackup = dbFiles.sort().reverse()[0]
    const backupPath = path.join(backupDir, latestBackup)
    const stats = await fs.stat(backupPath)
    const hoursSinceBackup = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60)

    if (hoursSinceBackup > 24) {
      log.info('[Backup] Last backup >24h old, creating backup...')
      await backupDatabase()
    }
  }
}

// ============================================================================
// NEXT.JS SERVER MANAGEMENT
// ============================================================================

async function getWebappPath(): Promise<string> {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'webapp')
  }
  return path.join(__dirname, '..', '..', 'webapp')
}

async function startNextServer(): Promise<void> {
  const webappPath = await getWebappPath()
  const dbDir = path.join(app.getPath('userData'), 'database')

  await fs.ensureDir(dbDir)

  serverPort = await findAvailablePort(DEFAULT_PORT)

  log.info(`[Server] Starting Next.js at port ${serverPort}...`)
  log.info(`[Server] Webapp path: ${webappPath}`)
  log.info(`[Server] DB directory: ${dbDir}`)

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(serverPort),
    DB_DIR: dbDir,
  }

  // Use npx next start for packaged app, npm run start for dev
  const command = app.isPackaged ? 'npx' : 'npm'
  const args = app.isPackaged ? ['next', 'start', '-p', String(serverPort)] : ['run', 'start']

  nextProcess = spawn(command, args, {
    cwd: webappPath,
    env,
    stdio: 'pipe',
    shell: true,
  })

  nextProcess.stdout?.on('data', (data) => {
    log.info(`[Next.js] ${data.toString().trim()}`)
  })

  nextProcess.stderr?.on('data', (data) => {
    log.error(`[Next.js] ${data.toString().trim()}`)
  })

  nextProcess.on('error', (error) => {
    log.error('[Next.js] Process error:', error)
    handleServerCrash(error)
  })

  nextProcess.on('exit', (code, signal) => {
    log.info(`[Next.js] Exited with code ${code}, signal ${signal}`)

    if (code !== 0 && code !== null && !app.isQuitting) {
      handleServerCrash(new Error(`Next.js exited with code ${code}`))
    }
  })
}

function handleServerCrash(error: Error): void {
  log.error('[Server] Crash detected:', error)
  Sentry.captureException(error)

  const result = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Server Error',
    message: 'The application server has stopped unexpectedly.',
    detail: 'Would you like to restart the application?',
    buttons: ['Restart', 'Quit'],
    defaultId: 0,
  })

  if (result === 0) {
    app.relaunch()
    app.quit()
  } else {
    app.quit()
  }
}

async function waitForServer(): Promise<boolean> {
  const startTime = Date.now()
  const url = `http://localhost:${serverPort}`

  log.info(`[Server] Waiting for ${url}...`)

  while (Date.now() - startTime < SERVER_STARTUP_TIMEOUT) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok || response.status === 404) {
        log.info('[Server] Ready!')
        return true
      }
    } catch {
      // Server not ready yet
    }

    await new Promise(resolve => setTimeout(resolve, SERVER_POLL_INTERVAL))
  }

  log.error('[Server] Startup timeout')
  return false
}

function stopNextServer(): void {
  if (nextProcess) {
    log.info('[Server] Stopping Next.js...')

    nextProcess.kill('SIGTERM')

    // Force kill after 5 seconds
    setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        nextProcess.kill('SIGKILL')
      }
    }, 5000)
  }
}

// ============================================================================
// FIRST-RUN DETECTION
// ============================================================================

interface AppConfig {
  licenseKey?: string
  licenseValidated?: boolean
  aiProviderConfigured?: boolean
  setupComplete?: boolean
}

async function getConfig(): Promise<AppConfig> {
  const configPath = path.join(app.getPath('userData'), 'config.json')

  if (!await fs.pathExists(configPath)) {
    return {}
  }

  try {
    return await fs.readJson(configPath)
  } catch {
    return {}
  }
}

async function saveConfig(updates: Partial<AppConfig>): Promise<void> {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  const existing = await getConfig()
  await fs.writeJson(configPath, { ...existing, ...updates }, { spaces: 2 })
}

async function getStartUrl(): Promise<string> {
  const config = await getConfig()

  // First run - no config at all
  if (!config.setupComplete) {
    return `http://localhost:${serverPort}/setup`
  }

  // License not validated
  if (!config.licenseValidated) {
    return `http://localhost:${serverPort}/setup?step=license`
  }

  // AI not configured
  if (!config.aiProviderConfigured) {
    return `http://localhost:${serverPort}/setup?step=ai`
  }

  // All good
  return `http://localhost:${serverPort}`
}

// ============================================================================
// WINDOW CREATION
// ============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
    },
  })

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http://localhost:* https://api.anthropic.com https://api.openai.com; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:;"
        ]
      }
    })
  })

  // Disable DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools()
    })
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Handle renderer crashes
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    log.error('[Renderer] Crashed:', details)
    Sentry.captureException(new Error(`Renderer crash: ${details.reason}`))

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

// Validation schemas
const exportFormatSchema = z.enum(['json', 'csv'])
const providerSchema = z.enum(['anthropic', 'openai'])

function setupIpcHandlers(): void {
  // Database backup
  ipcMain.handle('db:backup', async () => {
    return await backupDatabase()
  })

  // Database export
  ipcMain.handle('db:export', async (_, format: unknown) => {
    const validatedFormat = exportFormatSchema.parse(format)

    const result = await dialog.showSaveDialog({
      title: 'Export HR Data',
      defaultPath: `hrskills-export-${Date.now()}.${validatedFormat}`,
      filters: [{ name: validatedFormat.toUpperCase(), extensions: [validatedFormat] }]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    // TODO: Implement export logic
    return result.filePath
  })

  // App info
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:dataPath', () => path.basename(app.getPath('userData')))
  ipcMain.handle('app:isPackaged', () => app.isPackaged)

  // Keychain operations
  ipcMain.handle('keychain:store', async (_, provider: unknown, key: string) => {
    const validatedProvider = providerSchema.parse(provider)
    await keytar.setPassword(SERVICE_NAME, `${validatedProvider}-api-key`, key)
    return true
  })

  ipcMain.handle('keychain:retrieve', async (_, provider: unknown) => {
    const validatedProvider = providerSchema.parse(provider)
    return await keytar.getPassword(SERVICE_NAME, `${validatedProvider}-api-key`)
  })

  ipcMain.handle('keychain:delete', async (_, provider: unknown) => {
    const validatedProvider = providerSchema.parse(provider)
    return await keytar.deletePassword(SERVICE_NAME, `${validatedProvider}-api-key`)
  })

  // Config operations
  ipcMain.handle('config:get', async () => await getConfig())
  ipcMain.handle('config:set', async (_, updates: Partial<AppConfig>) => {
    await saveConfig(updates)
    return true
  })

  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // Open external URL
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    // Only allow https URLs
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs are allowed')
    }
    await shell.openExternal(url)
    return true
  })
}

// ============================================================================
// AUTO-UPDATER
// ============================================================================

function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    log.info('[Updater] Skipping in dev mode')
    return
  }

  autoUpdater.logger = log
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Check after 10 seconds
  setTimeout(() => autoUpdater.checkForUpdates(), 10000)

  // Check every 6 hours
  setInterval(() => autoUpdater.checkForUpdates(), 6 * 60 * 60 * 1000)

  autoUpdater.on('update-available', (info) => {
    log.info('[Updater] Update available:', info.version)
    mainWindow?.webContents.send('update:available', info.version)

    new Notification({
      title: 'Update Available',
      body: `Version ${info.version} is ready to download.`,
      silent: true,
    }).show()
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:progress', progress.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Updater] Downloaded:', info.version)

    const result = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    })

    if (result === 0) {
      autoUpdater.quitAndInstall(false, true)
    }
  })

  autoUpdater.on('error', (error) => {
    log.error('[Updater] Error:', error)
  })

  // IPC for manual update
  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
}

// ============================================================================
// APPLICATION MENU
// ============================================================================

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'View Logs',
          click: () => shell.openPath(log.transports.file.getFile().path)
        },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => autoUpdater.checkForUpdates()
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/your-org/HRSkills/issues')
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Track quit state
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}
app.isQuitting = false

app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('ready', async () => {
  log.info('[App] Ready')

  // Verify database integrity
  const isDbValid = await verifyDatabaseIntegrity()
  if (!isDbValid) {
    const recovered = await recoverFromCorruption()
    if (!recovered) {
      app.quit()
      return
    }
  }

  // Setup backups
  await setupAutomaticBackups()

  // Start Next.js
  await startNextServer()

  const serverReady = await waitForServer()
  if (!serverReady) {
    dialog.showErrorBox('Startup Error', 'Could not start application server.')
    app.quit()
    return
  }

  // Setup IPC and menu
  setupIpcHandlers()
  createMenu()
  setupAutoUpdater()

  // Create window
  createWindow()

  // Load appropriate URL
  const startUrl = await getStartUrl()
  log.info(`[App] Loading: ${startUrl}`)
  mainWindow?.loadURL(startUrl)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    getStartUrl().then(url => mainWindow?.loadURL(url))
  }
})

app.on('will-quit', () => {
  stopNextServer()
})
```

---

## 3. Preload Script

### desktop/src/preload.ts

```typescript
import { contextBridge, ipcRenderer } from 'electron'

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getDataPath: () => ipcRenderer.invoke('app:dataPath'),
  isPackaged: () => ipcRenderer.invoke('app:isPackaged'),

  // Database operations
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  exportData: (format: 'json' | 'csv') => ipcRenderer.invoke('db:export', format),

  // Keychain operations
  storeApiKey: (provider: 'anthropic' | 'openai', key: string) =>
    ipcRenderer.invoke('keychain:store', provider, key),
  retrieveApiKey: (provider: 'anthropic' | 'openai') =>
    ipcRenderer.invoke('keychain:retrieve', provider),
  deleteApiKey: (provider: 'anthropic' | 'openai') =>
    ipcRenderer.invoke('keychain:delete', provider),

  // Config operations
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (updates: Record<string, unknown>) => ipcRenderer.invoke('config:set', updates),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // External URLs
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),

  // Event listeners
  onUpdateAvailable: (callback: (version: string) => void) => {
    ipcRenderer.on('update:available', (_, version) => callback(version))
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update:progress', (_, percent) => callback(percent))
  },
  onBackupFailed: (callback: (error: string) => void) => {
    ipcRenderer.on('backup:failed', (_, error) => callback(error))
  },
})
```

---

## 4. TypeScript Definitions

### webapp/lib/types/electron.d.ts

```typescript
export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>
  getDataPath: () => Promise<string>
  isPackaged: () => Promise<boolean>

  // Database operations
  backupDatabase: () => Promise<string | null>
  exportData: (format: 'json' | 'csv') => Promise<string | null>

  // Keychain operations
  storeApiKey: (provider: 'anthropic' | 'openai', key: string) => Promise<boolean>
  retrieveApiKey: (provider: 'anthropic' | 'openai') => Promise<string | null>
  deleteApiKey: (provider: 'anthropic' | 'openai') => Promise<boolean>

  // Config operations
  getConfig: () => Promise<{
    licenseKey?: string
    licenseValidated?: boolean
    aiProviderConfigured?: boolean
    setupComplete?: boolean
  }>
  setConfig: (updates: Record<string, unknown>) => Promise<boolean>

  // Window controls
  minimize: () => void
  maximize: () => void
  close: () => void

  // External URLs
  openExternal: (url: string) => Promise<boolean>

  // Updater
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>

  // Event listeners
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateProgress: (callback: (percent: number) => void) => void
  onBackupFailed: (callback: (error: string) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
```

---

## 5. First-Run Detection & Setup Route

### webapp/app/setup/page.tsx

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SetupWizard } from '@/components/onboarding/SetupWizard'

export default function SetupPage() {
  const searchParams = useSearchParams()
  const initialStep = searchParams.get('step')
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI)
  }, [])

  const handleComplete = async () => {
    if (window.electronAPI) {
      await window.electronAPI.setConfig({ setupComplete: true })
      // Reload to main app
      window.location.href = '/'
    }
  }

  // Don't render setup in browser (web) mode
  if (!isElectron) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">This page is only available in the desktop app.</p>
      </div>
    )
  }

  return <SetupWizard initialStep={initialStep} onComplete={handleComplete} />
}
```

### webapp/lib/hooks/useElectron.ts

```typescript
'use client'

import { useEffect, useState } from 'react'
import type { ElectronAPI } from '@/lib/types/electron'

export function useElectron() {
  const [api, setApi] = useState<ElectronAPI | null>(null)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      setApi(window.electronAPI)
      setIsElectron(true)
    }
  }, [])

  return { api, isElectron }
}
```

---

## 6. API Key Storage (Keychain)

### webapp/lib/api-key-storage.ts

```typescript
'use client'

import type { ElectronAPI } from '@/lib/types/electron'

type Provider = 'anthropic' | 'openai'

/**
 * Store API key securely
 * - Desktop: Uses macOS Keychain via Electron
 * - Web: Uses localStorage (less secure, but necessary)
 */
export async function storeApiKey(provider: Provider, key: string): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return await window.electronAPI.storeApiKey(provider, key)
  }

  // Fallback to localStorage for web (less secure)
  try {
    localStorage.setItem(`api-key-${provider}`, key)
    return true
  } catch {
    return false
  }
}

/**
 * Retrieve API key
 */
export async function retrieveApiKey(provider: Provider): Promise<string | null> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return await window.electronAPI.retrieveApiKey(provider)
  }

  // Fallback to localStorage
  return localStorage.getItem(`api-key-${provider}`)
}

/**
 * Delete API key
 */
export async function deleteApiKey(provider: Provider): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return await window.electronAPI.deleteApiKey(provider)
  }

  try {
    localStorage.removeItem(`api-key-${provider}`)
    return true
  } catch {
    return false
  }
}

/**
 * Check if API key exists
 */
export async function hasApiKey(provider: Provider): Promise<boolean> {
  const key = await retrieveApiKey(provider)
  return !!key
}
```

---

## 7. Test Connection Endpoint

### webapp/app/api/ai/test-connection/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
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

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
      })

      return NextResponse.json({
        success: true,
        provider: 'anthropic',
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

      return NextResponse.json({
        success: true,
        provider: 'openai',
        model: response.model,
        message: 'Connected to OpenAI successfully',
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Connection test failed'

    // Convert to friendly error
    const friendlyMessage = getFriendlyError(message)

    return NextResponse.json(
      { success: false, error: friendlyMessage, technical: message },
      { status: 400 }
    )
  }
}

function getFriendlyError(error: string): string {
  if (error.includes('401') || error.includes('invalid_api_key')) {
    return "That key doesn't seem to work. Please check you copied the full key."
  }
  if (error.includes('insufficient_funds') || error.includes('402')) {
    return 'Your account needs a payment method. Please add one in your provider dashboard.'
  }
  if (error.includes('rate_limit')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (error.includes('ENOTFOUND') || error.includes('network')) {
    return 'Could not connect. Please check your internet connection.'
  }
  return 'Could not connect. Please check the key and try again.'
}
```

---

## 8. Setup Wizard Components

### webapp/components/onboarding/SetupWizard.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { LicenseStep } from './steps/LicenseStep'
import { AIProviderStep } from './steps/AIProviderStep'
import { DataStep } from './steps/DataStep'
import { CompleteStep } from './steps/CompleteStep'

type WizardStep = 'welcome' | 'license' | 'ai-provider' | 'data' | 'complete'

interface SetupWizardProps {
  initialStep?: string | null
  onComplete: () => void
}

export function SetupWizard({ initialStep, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [config, setConfig] = useState({
    licenseKey: '',
    aiProvider: '' as 'anthropic' | 'openai' | '',
    aiApiKey: '',
    dataMode: '' as 'fresh' | 'demo' | 'import' | '',
  })

  useEffect(() => {
    if (initialStep === 'license') setStep('license')
    else if (initialStep === 'ai') setStep('ai-provider')
  }, [initialStep])

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  i <= currentIndex ? 'bg-amber-600' : 'bg-gray-200'
                }`}
              />
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 transition-colors ${
                    i < currentIndex ? 'bg-amber-600' : 'bg-gray-200'
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

### webapp/components/onboarding/steps/WelcomeStep.tsx

```typescript
'use client'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center">
        <span className="text-4xl">HR</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to HR Command Center
        </h1>
        <p className="text-gray-600">
          Your AI-powered HR assistant that keeps all your data private on this computer.
        </p>
      </div>

      <div className="bg-amber-50 rounded-lg p-4 text-left">
        <h3 className="font-medium text-amber-900 mb-2">What makes this different:</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>Your HR data never leaves your computer</li>
          <li>AI processing happens via your own API key</li>
          <li>No cloud storage, no data sharing</li>
        </ul>
      </div>

      <p className="text-sm text-gray-500">Setup takes about 5 minutes.</p>

      <button
        onClick={onNext}
        className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  )
}
```

---

## 9. macOS Entitlements

### desktop/entitlements.mac.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Required for hardened runtime with Electron -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>

    <!-- Network access for AI APIs -->
    <key>com.apple.security.network.client</key>
    <true/>

    <!-- Keychain access for API key storage -->
    <key>com.apple.security.keychain</key>
    <true/>
</dict>
</plist>
```

---

## 10. CI/CD Workflow

### .github/workflows/desktop-release.yml

```yaml
name: Desktop Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release-mac:
    runs-on: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            webapp/package-lock.json
            desktop/package-lock.json

      - name: Install webapp dependencies
        run: cd webapp && npm ci

      - name: Build webapp
        run: cd webapp && npm run build

      - name: Install desktop dependencies
        run: cd desktop && npm ci

      - name: Build Electron
        run: cd desktop && npm run build

      - name: Package and Publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          CSC_LINK: ${{ secrets.MAC_CERT_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
        run: cd desktop && npm run dist

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: macos-release
          path: |
            desktop/dist/*.dmg
            desktop/dist/*.zip
            desktop/dist/latest-mac.yml
```

---

## Usage Notes

### Checking if Running in Electron

```typescript
// Client-side check
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// Use the hook
import { useElectron } from '@/lib/hooks/useElectron'
const { api, isElectron } = useElectron()

if (isElectron && api) {
  const version = await api.getVersion()
}
```

### Conditional Features

```typescript
// Show desktop-only features
{isElectron && (
  <button onClick={() => api?.backupDatabase()}>
    Backup Database
  </button>
)}

// Hide web-only features in desktop
{!isElectron && (
  <a href="/login">Sign in with Google</a>
)}
```

---

**Document Version:** 1.0
**Created:** 2025-11-26
**Source:** Extracted and enhanced from desktop-app-electron-plan.md
