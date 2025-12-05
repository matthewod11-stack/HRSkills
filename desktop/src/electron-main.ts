// Electron main process
// Phase 3: Next.js integration complete
// Phase 4: Secure IPC implementation
// Phase 6: Crash reporting (Sentry) and logging (electron-log)
// Phase 7: Auto-update infrastructure (electron-updater)

// =============================================================================
// SENTRY INITIALIZATION (must be first - before other imports)
// =============================================================================

import * as Sentry from '@sentry/electron/main'
import log from 'electron-log/main'

// Configure electron-log
log.initialize()
log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB rotation
log.transports.console.level = 'debug'

// Initialize Sentry (production only)
// DSN is safe to embed - it only allows sending errors, not reading them
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://99e78fec149a4cd76cb1bed6efdbc286@o4510364361752576.ingest.us.sentry.io/4510364368371712'

if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Set release for version tracking
    release: `hr-command-center@${process.env.npm_package_version || '1.0.0'}`,
    environment: process.env.NODE_ENV || 'development',
    // Only send errors, not performance data (to minimize overhead)
    tracesSampleRate: 0,
    // Filter out common non-errors
    beforeSend(event) {
      // Don't send errors during development
      if (process.env.NODE_ENV !== 'production') {
        return null
      }
      return event
    },
  })
  log.info('[Sentry] Initialized for production')
} else {
  log.info('[Sentry] Skipped (development mode or no DSN)')
}

// =============================================================================
// GLOBAL ERROR HANDLERS (catch uncaught errors)
// =============================================================================

process.on('uncaughtException', (error) => {
  log.error('[FATAL] Uncaught exception:', error)
  Sentry.captureException(error)
})

process.on('unhandledRejection', (reason) => {
  log.error('[FATAL] Unhandled rejection:', reason)
  if (reason instanceof Error) {
    Sentry.captureException(reason)
  } else {
    Sentry.captureMessage(`Unhandled rejection: ${String(reason)}`)
  }
})

import { app, BrowserWindow, dialog, ipcMain, shell, Menu } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs-extra'
import detectPort from 'detect-port'
import keytar from 'keytar'
import { z } from 'zod'
import Database from 'better-sqlite3'
import { autoUpdater } from 'electron-updater'

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PORT = 3000
const SERVER_STARTUP_TIMEOUT = 30000 // 30 seconds
const SERVER_POLL_INTERVAL = 500 // 500ms
const SERVICE_NAME = 'HR Command Center' // For Keychain storage

// ============================================================================
// ZOD VALIDATION SCHEMAS (for IPC input validation)
// ============================================================================

const exportFormatSchema = z.enum(['json', 'csv'])
const providerSchema = z.enum(['anthropic', 'openai'])

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null
let nextProcess: ChildProcess | null = null
let serverPort: number = DEFAULT_PORT
let isQuitting: boolean = false

// ============================================================================
// PORT MANAGEMENT
// ============================================================================

/**
 * Find an available port starting from the given port.
 * If the port is in use, detect-port will return the next available port.
 */
async function findAvailablePort(startPort: number): Promise<number> {
  console.log(`[Port] Checking port ${startPort}...`)
  const availablePort = await detectPort(startPort)

  if (availablePort !== startPort) {
    console.warn(`[Port] Port ${startPort} in use, using ${availablePort}`)
  } else {
    console.log(`[Port] Port ${startPort} is available`)
  }

  return availablePort
}

// ============================================================================
// NEXT.JS SERVER MANAGEMENT
// ============================================================================

/**
 * Get the path to the webapp directory.
 * In packaged builds, it's in the resources folder.
 * In development, it's the sibling webapp directory.
 */
async function getWebappPath(): Promise<string> {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'webapp')
  }
  return path.join(__dirname, '..', '..', 'webapp')
}

/**
 * Start the Next.js server as a child process.
 * Sets up the database directory and spawns Next.js with proper environment.
 */
async function startNextServer(): Promise<void> {
  const webappPath = await getWebappPath()
  const dbDir = path.join(app.getPath('userData'), 'database')

  // Ensure database directory exists
  await fs.ensureDir(dbDir)

  // Find available port
  serverPort = await findAvailablePort(DEFAULT_PORT)

  console.log(`[Server] Starting Next.js at port ${serverPort}...`)
  console.log(`[Server] Webapp path: ${webappPath}`)
  console.log(`[Server] DB directory: ${dbDir}`)

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(serverPort),
    DB_DIR: dbDir,
  }

  // Use npx next start with our detected port (not npm run start which has hardcoded port)
  const command = 'npx'
  const args = ['next', 'start', '-p', String(serverPort)]

  nextProcess = spawn(command, args, {
    cwd: webappPath,
    env,
    stdio: 'pipe',
    shell: true,
  })

  // Forward stdout to console
  nextProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`)
  })

  // Forward stderr to console
  nextProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`)
  })

  // Handle process errors
  nextProcess.on('error', (error) => {
    console.error('[Next.js] Process error:', error)
    handleServerCrash(error)
  })

  // Handle process exit
  nextProcess.on('exit', (code, signal) => {
    console.log(`[Next.js] Exited with code ${code}, signal ${signal}`)
    // Only treat as crash if exit code is non-zero and not during intentional quit
    if (code !== 0 && code !== null && !isQuitting) {
      handleServerCrash(new Error(`Next.js exited with code ${code}`))
    }
  })
}

/**
 * Wait for the Next.js server to be ready by polling the localhost URL.
 * Returns true if server is ready, false if timeout is reached.
 */
async function waitForServer(): Promise<boolean> {
  const startTime = Date.now()
  const url = `http://localhost:${serverPort}`

  console.log(`[Server] Waiting for ${url}...`)

  while (Date.now() - startTime < SERVER_STARTUP_TIMEOUT) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      // Server is ready if we get any response (even 404 means server is up)
      if (response.ok || response.status === 404) {
        console.log('[Server] Ready!')
        return true
      }
    } catch {
      // Server not ready yet, continue polling
    }

    await new Promise(resolve => setTimeout(resolve, SERVER_POLL_INTERVAL))
  }

  console.error('[Server] Startup timeout after 30 seconds')
  return false
}

/**
 * Stop the Next.js server gracefully.
 * Sends SIGTERM first, then SIGKILL after 5 seconds if still running.
 */
function stopNextServer(): void {
  if (nextProcess) {
    console.log('[Server] Stopping Next.js...')

    nextProcess.kill('SIGTERM')

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        console.log('[Server] Force killing Next.js...')
        nextProcess.kill('SIGKILL')
      }
    }, 5000)
  }
}

/**
 * Handle Next.js server crash.
 * Shows a dialog allowing the user to restart or quit.
 * Only triggers for unexpected exits (not during intentional quit).
 * Reports crash to Sentry for monitoring.
 */
function handleServerCrash(error: Error): void {
  // Don't show dialog if we're intentionally quitting
  if (isQuitting) {
    log.info('[Server] Ignoring crash during quit')
    return
  }

  log.error('[Server] Crash detected:', error.message)

  // Report to Sentry
  Sentry.captureException(error, {
    tags: { component: 'next-server' },
    extra: { serverPort },
  })

  const result = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Server Error',
    message: 'The application server has stopped unexpectedly.',
    detail: 'Would you like to restart the application?',
    buttons: ['Restart', 'Quit'],
    defaultId: 0,
  })

  if (result === 0) {
    // User chose Restart
    log.info('[Server] User requested restart')
    app.relaunch()
    app.quit()
  } else {
    // User chose Quit
    log.info('[Server] User chose to quit')
    app.quit()
  }
}

// Export for testing
export {
  findAvailablePort,
  startNextServer,
  waitForServer,
  stopNextServer,
  handleServerCrash,
  getWebappPath,
  DEFAULT_PORT,
  SERVER_STARTUP_TIMEOUT,
  SERVER_POLL_INTERVAL,
  serverPort,
  // Phase 5: Backup functions
  createBackup,
  autoBackupOnStartup,
  AUTO_BACKUP_INTERVAL_MS,
  // Phase 5: Scheduled backup functions
  checkScheduledBackup,
  startBackupSchedule,
  stopBackupSchedule,
  SCHEDULED_BACKUP_HOUR,
  BACKUP_CHECK_INTERVAL_MS,
  // Phase 5: Backup cleanup
  cleanupOldBackups,
  BACKUP_RETENTION_DAYS,
  // Phase 5: Integrity check
  checkDatabaseIntegrity,
  checkIntegrityOnStartup,
  // Phase 5: Corruption recovery
  findLatestBackup,
  restoreFromBackup,
}

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

interface AppConfig {
  licenseKey?: string
  licenseValidated?: boolean
  aiProviderConfigured?: boolean
  setupComplete?: boolean
  lastBackupTime?: string  // ISO timestamp of last automatic backup
  lastScheduledBackupDate?: string  // YYYY-MM-DD of last scheduled (2 AM) backup
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

// ============================================================================
// AUTOMATIC BACKUP (Phase 5)
// ============================================================================

const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Create a backup of the database.
 * Reusable by both auto-backup and manual IPC handler.
 * Returns the backup path if successful, null if no database exists.
 */
async function createBackup(): Promise<string | null> {
  const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')
  const backupDir = path.join(app.getPath('userData'), 'backups')

  if (!await fs.pathExists(dbPath)) {
    console.log('[Backup] No database to backup')
    return null
  }

  await fs.ensureDir(backupDir)
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupPath = path.join(backupDir, `hrskills-backup-${timestamp}.db`)

  await fs.copy(dbPath, backupPath)
  console.log(`[Backup] Created: ${backupPath}`)
  return backupPath
}

// ============================================================================
// BACKUP CLEANUP (Phase 5 - Keep 30 days)
// ============================================================================

const BACKUP_RETENTION_DAYS = 30
const BACKUP_FILENAME_REGEX = /^hrskills-backup-(\d{4}-\d{2}-\d{2})T.*\.db$/

/**
 * Clean up old backups, keeping only the last 30 days.
 * Runs after each successful backup to prevent disk space accumulation.
 */
async function cleanupOldBackups(): Promise<void> {
  const backupDir = path.join(app.getPath('userData'), 'backups')

  if (!await fs.pathExists(backupDir)) {
    return
  }

  try {
    const files = await fs.readdir(backupDir)
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    let deletedCount = 0

    for (const file of files) {
      const match = file.match(BACKUP_FILENAME_REGEX)
      if (!match) {
        continue // Skip non-backup files
      }

      const dateStr = match[1] // YYYY-MM-DD
      const backupDate = new Date(dateStr)

      if (backupDate < cutoffDate) {
        const filePath = path.join(backupDir, file)
        await fs.remove(filePath)
        deletedCount++
        console.log(`[Cleanup] Deleted old backup: ${file}`)
      }
    }

    if (deletedCount > 0) {
      console.log(`[Cleanup] Removed ${deletedCount} backup(s) older than ${BACKUP_RETENTION_DAYS} days`)
    }
  } catch (error) {
    // Log error but don't fail - cleanup is non-critical
    console.error('[Cleanup] Failed to clean old backups:', error)
  }
}

// ============================================================================
// BACKUP RECOVERY (Phase 5 - Corruption Recovery)
// ============================================================================

/**
 * Find the most recent backup file in the backups directory.
 * Backups are named: hrskills-backup-YYYY-MM-DDTHH-MM-SS.db
 * Returns the full path to the most recent backup, or null if none exist.
 */
async function findLatestBackup(): Promise<string | null> {
  const backupDir = path.join(app.getPath('userData'), 'backups')

  if (!await fs.pathExists(backupDir)) {
    console.log('[Recovery] No backups directory exists')
    return null
  }

  try {
    const files = await fs.readdir(backupDir)

    // Filter to only backup files and extract dates for sorting
    const backups = files
      .filter((file) => file.match(BACKUP_FILENAME_REGEX))
      .map((file) => ({
        file,
        path: path.join(backupDir, file),
        // Extract timestamp: hrskills-backup-2025-12-02T10-30-00.db
        timestamp: file.replace('hrskills-backup-', '').replace('.db', ''),
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)) // Newest first

    if (backups.length === 0) {
      console.log('[Recovery] No backup files found')
      return null
    }

    console.log(`[Recovery] Found ${backups.length} backup(s), latest: ${backups[0].file}`)
    return backups[0].path
  } catch (error) {
    console.error('[Recovery] Error finding backups:', error)
    return null
  }
}

/**
 * Restore the database from a backup file.
 * Creates a safety copy of the corrupt database before overwriting.
 * Returns true if successful, false otherwise.
 */
async function restoreFromBackup(backupPath: string): Promise<boolean> {
  const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')
  const dbDir = path.dirname(dbPath)

  try {
    // Verify backup exists and is readable
    if (!await fs.pathExists(backupPath)) {
      console.error('[Recovery] Backup file does not exist:', backupPath)
      return false
    }

    // Create a safety copy of the corrupt database (for forensic purposes)
    if (await fs.pathExists(dbPath)) {
      const corruptBackupPath = dbPath + '.corrupt-' + Date.now()
      console.log(`[Recovery] Saving corrupt database to: ${corruptBackupPath}`)
      await fs.copy(dbPath, corruptBackupPath)
    }

    // Ensure database directory exists
    await fs.ensureDir(dbDir)

    // Remove WAL and SHM files if they exist (they're tied to the old database)
    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'
    if (await fs.pathExists(walPath)) {
      await fs.remove(walPath)
      console.log('[Recovery] Removed stale WAL file')
    }
    if (await fs.pathExists(shmPath)) {
      await fs.remove(shmPath)
      console.log('[Recovery] Removed stale SHM file')
    }

    // Copy backup over the corrupt database
    console.log(`[Recovery] Restoring from: ${backupPath}`)
    await fs.copy(backupPath, dbPath, { overwrite: true })

    // Verify the restored database is healthy
    const verifyResult = checkDatabaseIntegrity(dbPath)
    if (!verifyResult.isHealthy) {
      console.error('[Recovery] Restored database is also corrupt!')
      return false
    }

    console.log('[Recovery] Database restored successfully!')
    return true
  } catch (error) {
    console.error('[Recovery] Restore failed:', error)
    return false
  }
}

// ============================================================================
// DATABASE INTEGRITY CHECK (Phase 5)
// ============================================================================

interface IntegrityCheckResult {
  isHealthy: boolean
  errors: string[]
}

/**
 * Run SQLite PRAGMA integrity_check on the database.
 * Returns { isHealthy: true, errors: [] } if OK, or { isHealthy: false, errors: [...] } if corruption detected.
 */
function checkDatabaseIntegrity(dbPath: string): IntegrityCheckResult {
  try {
    console.log('[Integrity] Running PRAGMA integrity_check...')
    const db = new Database(dbPath, { readonly: true })

    try {
      const results = db.pragma('integrity_check') as Array<{ integrity_check: string }>
      db.close()

      // PRAGMA integrity_check returns "ok" if healthy, or error messages if corrupted
      const errors = results
        .map((row) => row.integrity_check)
        .filter((msg) => msg !== 'ok')

      if (errors.length === 0) {
        console.log('[Integrity] Database is healthy')
        return { isHealthy: true, errors: [] }
      } else {
        console.error('[Integrity] Database corruption detected:', errors)
        return { isHealthy: false, errors }
      }
    } catch (error) {
      db.close()
      throw error
    }
  } catch (error) {
    console.error('[Integrity] Check failed:', error)
    return {
      isHealthy: false,
      errors: [error instanceof Error ? error.message : 'Unknown error during integrity check'],
    }
  }
}

/**
 * Check database integrity on startup and show dialog if corruption detected.
 * Returns true if database is healthy or doesn't exist, false if corrupted.
 */
async function checkIntegrityOnStartup(): Promise<boolean> {
  const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')

  if (!await fs.pathExists(dbPath)) {
    console.log('[Integrity] No database yet, skipping check')
    return true
  }

  const result = checkDatabaseIntegrity(dbPath)

  if (!result.isHealthy) {
    // Show dialog to user about corruption
    const response = dialog.showMessageBoxSync({
      type: 'error',
      title: 'Database Problem Detected',
      message: 'The database may be corrupted.',
      detail: `Errors found:\n${result.errors.join('\n')}\n\nWould you like to restore from a backup?`,
      buttons: ['Restore from Backup', 'Continue Anyway', 'Quit'],
      defaultId: 0,
    })

    if (response === 0) {
      // User wants to restore from backup
      console.log('[Integrity] User requested backup restore')

      const latestBackup = await findLatestBackup()

      if (!latestBackup) {
        // No backups available
        const noBackupResponse = dialog.showMessageBoxSync({
          type: 'warning',
          title: 'No Backups Available',
          message: 'No backup files were found.',
          detail: 'The database may have been corrupted before any backups were created. You can continue with the current database or quit the application.',
          buttons: ['Continue Anyway', 'Quit'],
          defaultId: 0,
        })

        if (noBackupResponse === 1) {
          app.quit()
          return false
        }
        console.log('[Integrity] No backups available, user chose to continue')
        return false
      }

      // Attempt to restore from backup
      const restored = await restoreFromBackup(latestBackup)

      if (restored) {
        // Success! Restart the app to load with restored database
        dialog.showMessageBoxSync({
          type: 'info',
          title: 'Database Restored',
          message: 'The database has been successfully restored from backup.',
          detail: 'The application will now restart to load the restored data.',
          buttons: ['OK'],
        })
        console.log('[Integrity] Database restored, restarting app')
        app.relaunch()
        app.quit()
        return false
      } else {
        // Restore failed
        const restoreFailedResponse = dialog.showMessageBoxSync({
          type: 'error',
          title: 'Restore Failed',
          message: 'Failed to restore the database from backup.',
          detail: 'The backup file may also be corrupted. You can continue with the current database or quit the application.',
          buttons: ['Continue Anyway', 'Quit'],
          defaultId: 1,
        })

        if (restoreFailedResponse === 1) {
          app.quit()
          return false
        }
        console.log('[Integrity] Restore failed, user chose to continue')
        return false
      }
    } else if (response === 2) {
      // User wants to quit
      app.quit()
      return false
    }
    // User chose to continue anyway
    console.log('[Integrity] User chose to continue despite corruption')
  }

  return result.isHealthy
}

/**
 * Check if automatic backup is needed (>24h since last backup) and run it.
 * Non-blocking: runs in background, doesn't delay app startup.
 */
async function autoBackupOnStartup(): Promise<void> {
  try {
    const config = await getConfig()
    const lastBackup = config.lastBackupTime ? new Date(config.lastBackupTime) : null
    const now = new Date()

    // Skip if backup was done within the last 24 hours
    if (lastBackup) {
      const msSinceLastBackup = now.getTime() - lastBackup.getTime()
      if (msSinceLastBackup < AUTO_BACKUP_INTERVAL_MS) {
        const hoursAgo = Math.round(msSinceLastBackup / (60 * 60 * 1000))
        console.log(`[AutoBackup] Last backup was ${hoursAgo}h ago, skipping`)
        return
      }
    }

    // Check if database exists before attempting backup
    const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')
    if (!await fs.pathExists(dbPath)) {
      console.log('[AutoBackup] No database yet, skipping')
      return
    }

    console.log('[AutoBackup] Starting automatic backup...')
    const backupPath = await createBackup()

    if (backupPath) {
      // Update config with new backup time
      await saveConfig({ lastBackupTime: now.toISOString() })
      console.log(`[AutoBackup] Complete: ${backupPath}`)

      // Clean up old backups after successful backup
      await cleanupOldBackups()
    }
  } catch (error) {
    // Log error but don't crash the app - backup is non-critical
    console.error('[AutoBackup] Failed:', error)
  }
}

// ============================================================================
// SCHEDULED BACKUP (Phase 5 - Daily at 2 AM)
// ============================================================================

const SCHEDULED_BACKUP_HOUR = 2 // 2 AM local time
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000 // Check every hour

let backupScheduleInterval: NodeJS.Timeout | null = null

/**
 * Get today's date as YYYY-MM-DD string for comparison.
 */
function getTodayDateString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * Check if it's time for a scheduled backup (2 AM) and run it.
 * Only runs once per calendar day.
 */
async function checkScheduledBackup(): Promise<void> {
  try {
    const now = new Date()
    const currentHour = now.getHours()
    const todayDate = getTodayDateString()

    // Only run during the backup hour (2 AM)
    if (currentHour !== SCHEDULED_BACKUP_HOUR) {
      return
    }

    // Check if we already ran scheduled backup today
    const config = await getConfig()
    if (config.lastScheduledBackupDate === todayDate) {
      console.log('[ScheduledBackup] Already ran today, skipping')
      return
    }

    // Check if database exists
    const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')
    if (!await fs.pathExists(dbPath)) {
      console.log('[ScheduledBackup] No database yet, skipping')
      return
    }

    console.log('[ScheduledBackup] Running daily 2 AM backup...')
    const backupPath = await createBackup()

    if (backupPath) {
      // Update both lastBackupTime and lastScheduledBackupDate
      await saveConfig({
        lastBackupTime: now.toISOString(),
        lastScheduledBackupDate: todayDate,
      })
      console.log(`[ScheduledBackup] Complete: ${backupPath}`)

      // Clean up old backups after successful backup
      await cleanupOldBackups()
    }
  } catch (error) {
    console.error('[ScheduledBackup] Failed:', error)
  }
}

/**
 * Start the scheduled backup timer.
 * Checks every hour if it's time for the daily backup.
 */
function startBackupSchedule(): void {
  console.log(`[ScheduledBackup] Starting scheduler (backup hour: ${SCHEDULED_BACKUP_HOUR}:00)`)

  // Check immediately on startup (in case app starts during backup hour)
  checkScheduledBackup().catch((err) => {
    console.error('[ScheduledBackup] Initial check failed:', err)
  })

  // Then check every hour
  backupScheduleInterval = setInterval(() => {
    checkScheduledBackup().catch((err) => {
      console.error('[ScheduledBackup] Scheduled check failed:', err)
    })
  }, BACKUP_CHECK_INTERVAL_MS)
}

/**
 * Stop the scheduled backup timer.
 * Called on app quit to clean up resources.
 */
function stopBackupSchedule(): void {
  if (backupScheduleInterval) {
    console.log('[ScheduledBackup] Stopping scheduler')
    clearInterval(backupScheduleInterval)
    backupScheduleInterval = null
  }
}

// ============================================================================
// AUTO-UPDATE (Phase 7)
// ============================================================================

const UPDATE_CHECK_DELAY_MS = 10 * 1000  // 10 seconds after launch
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000  // 6 hours

let updateCheckInterval: NodeJS.Timeout | null = null

/**
 * Configure and initialize the auto-updater.
 * Sets up event handlers for update lifecycle.
 */
function setupAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false  // Don't auto-download, prompt user first
  autoUpdater.autoInstallOnAppQuit = true  // Install pending update on quit
  autoUpdater.logger = log  // Use electron-log for updater logs

  log.info('[AutoUpdater] Initializing...')

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('[AutoUpdater] Update available:', info.version)

    // Notify renderer about available update
    if (mainWindow) {
      mainWindow.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
      })
    }

    // Ask user if they want to download
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download it now? The update will be installed when you quit the app.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        log.info('[AutoUpdater] User chose to download update')
        autoUpdater.downloadUpdate()
      } else {
        log.info('[AutoUpdater] User deferred update')
      }
    })
  })

  // Event: No update available
  autoUpdater.on('update-not-available', (info) => {
    log.info('[AutoUpdater] No update available, current version is latest:', info.version)

    // Notify renderer
    if (mainWindow) {
      mainWindow.webContents.send('update:not-available', {
        version: info.version,
      })
    }
  })

  // Event: Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`)

    // Update window progress bar if available
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100)
      // Also notify renderer for UI updates
      mainWindow.webContents.send('update:progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      })
    }
  })

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[AutoUpdater] Update downloaded:', info.version)

    // Clear progress bar
    if (mainWindow) {
      mainWindow.setProgressBar(-1)  // Remove progress bar
      // Notify renderer
      mainWindow.webContents.send('update:downloaded', {
        version: info.version,
      })
    }

    // Ask user if they want to restart now
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: `Version ${info.version} has been downloaded. Restart now to apply the update?`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        log.info('[AutoUpdater] User chose to restart and install')
        autoUpdater.quitAndInstall()
      } else {
        log.info('[AutoUpdater] User deferred restart, will install on quit')
      }
    })
  })

  // Event: Error
  autoUpdater.on('error', (error) => {
    log.error('[AutoUpdater] Error:', error.message)

    // Notify renderer
    if (mainWindow) {
      mainWindow.webContents.send('update:error', {
        message: error.message,
      })
    }

    // Report to Sentry (non-critical, don't show dialog for every error)
    Sentry.captureException(error, {
      tags: { component: 'auto-updater' },
    })
  })
}

/**
 * Check for updates manually.
 * Called by the initial delay timer and periodic interval.
 */
async function checkForUpdates(): Promise<void> {
  // Skip update checks in development
  if (!app.isPackaged) {
    log.info('[AutoUpdater] Skipping check (development mode)')
    return
  }

  try {
    log.info('[AutoUpdater] Checking for updates...')
    await autoUpdater.checkForUpdates()
  } catch (error) {
    log.error('[AutoUpdater] Check failed:', error)
  }
}

/**
 * Start the auto-update check schedule.
 * Checks 10 seconds after launch, then every 6 hours.
 */
function startUpdateSchedule(): void {
  // Skip in development
  if (!app.isPackaged) {
    log.info('[AutoUpdater] Schedule disabled (development mode)')
    return
  }

  log.info('[AutoUpdater] Starting update schedule')

  // Check 10 seconds after launch
  setTimeout(() => {
    checkForUpdates()
  }, UPDATE_CHECK_DELAY_MS)

  // Then check every 6 hours
  updateCheckInterval = setInterval(() => {
    checkForUpdates()
  }, UPDATE_CHECK_INTERVAL_MS)
}

/**
 * Stop the auto-update check schedule.
 * Called on app quit to clean up resources.
 */
function stopUpdateSchedule(): void {
  if (updateCheckInterval) {
    log.info('[AutoUpdater] Stopping update schedule')
    clearInterval(updateCheckInterval)
    updateCheckInterval = null
  }
}

// Export for testing
export {
  setupAutoUpdater,
  checkForUpdates,
  startUpdateSchedule,
  stopUpdateSchedule,
  UPDATE_CHECK_DELAY_MS,
  UPDATE_CHECK_INTERVAL_MS,
}

// ============================================================================
// IPC HANDLERS (Secure bridge between renderer and main process)
// ============================================================================

function setupIpcHandlers(): void {
  console.log('[IPC] Setting up handlers...')

  // --- App Info ---
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:dataPath', () => app.getPath('userData'))
  ipcMain.handle('app:isPackaged', () => app.isPackaged)

  // --- Config Operations ---
  ipcMain.handle('config:get', async () => {
    return await getConfig()
  })

  ipcMain.handle('config:set', async (_, updates: unknown) => {
    // Basic validation - updates should be an object
    if (typeof updates !== 'object' || updates === null) {
      throw new Error('Invalid config updates')
    }
    await saveConfig(updates as Partial<AppConfig>)
    return true
  })

  // --- Keychain Operations (secure API key storage) ---
  ipcMain.handle('keychain:store', async (_, provider: unknown, key: unknown) => {
    try {
      const validatedProvider = providerSchema.parse(provider)
      if (typeof key !== 'string' || key.length < 10) {
        throw new Error('Invalid API key')
      }
      await keytar.setPassword(SERVICE_NAME, `${validatedProvider}-api-key`, key)
      console.log(`[Keychain] Stored API key for ${validatedProvider}`)
      return true
    } catch (error) {
      console.error('[Keychain] Store error:', error)
      throw error
    }
  })

  ipcMain.handle('keychain:retrieve', async (_, provider: unknown) => {
    try {
      const validatedProvider = providerSchema.parse(provider)
      const key = await keytar.getPassword(SERVICE_NAME, `${validatedProvider}-api-key`)
      return key
    } catch (error) {
      console.error('[Keychain] Retrieve error:', error)
      throw error
    }
  })

  ipcMain.handle('keychain:delete', async (_, provider: unknown) => {
    try {
      const validatedProvider = providerSchema.parse(provider)
      const deleted = await keytar.deletePassword(SERVICE_NAME, `${validatedProvider}-api-key`)
      console.log(`[Keychain] Deleted API key for ${validatedProvider}: ${deleted}`)
      return deleted
    } catch (error) {
      console.error('[Keychain] Delete error:', error)
      throw error
    }
  })

  // --- Database Operations ---
  ipcMain.handle('db:backup', async () => {
    try {
      const backupPath = await createBackup()
      if (backupPath) {
        // Update lastBackupTime on manual backup too
        await saveConfig({ lastBackupTime: new Date().toISOString() })
        // Clean up old backups
        await cleanupOldBackups()
      }
      return backupPath
    } catch (error) {
      console.error('[Backup] Failed:', error)
      throw error
    }
  })

  ipcMain.handle('db:export', async (_, format: unknown) => {
    try {
      const validatedFormat = exportFormatSchema.parse(format)

      const result = await dialog.showSaveDialog({
        title: 'Export HR Data',
        defaultPath: `hrskills-export-${Date.now()}.${validatedFormat}`,
        filters: [{ name: validatedFormat.toUpperCase(), extensions: [validatedFormat] }]
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      // Note: Actual export logic will be implemented in Phase 5
      // For now, return the selected path
      return result.filePath
    } catch (error) {
      console.error('[Export] Error:', error)
      throw error
    }
  })

  // --- Window Controls ---
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // --- External URLs (security: only allow https) ---
  ipcMain.handle('shell:openExternal', async (_, url: unknown) => {
    if (typeof url !== 'string') {
      throw new Error('Invalid URL')
    }
    // Only allow HTTPS URLs for security
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs are allowed')
    }
    await shell.openExternal(url)
    return true
  })

  // --- Open Backup Folder (for Settings UI) ---
  ipcMain.handle('shell:openBackupFolder', async () => {
    const backupDir = path.join(app.getPath('userData'), 'backups')
    await fs.ensureDir(backupDir)  // Create if doesn't exist
    await shell.openPath(backupDir)
    return true
  })

  // --- Auto-Update Operations (Phase 7) ---
  ipcMain.handle('update:checkForUpdates', async () => {
    // Skip in development
    if (!app.isPackaged) {
      log.info('[IPC] Update check skipped (development mode)')
      return { checking: false, reason: 'development' }
    }

    try {
      log.info('[IPC] Manual update check triggered')
      await autoUpdater.checkForUpdates()
      return { checking: true }
    } catch (error) {
      log.error('[IPC] Update check failed:', error)
      throw error
    }
  })

  ipcMain.handle('update:getInfo', async () => {
    return {
      currentVersion: app.getVersion(),
      isPackaged: app.isPackaged,
    }
  })

  console.log('[IPC] Handlers ready')
}

// ============================================================================
// APPLICATION MENU (Phase 6 - Help → View Logs)
// ============================================================================

function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // View menu
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
        { role: 'togglefullscreen' },
        // DevTools only in development
        ...(!app.isPackaged ? [
          { type: 'separator' as const },
          { role: 'toggleDevTools' as const },
        ] : []),
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'View Logs',
          click: async () => {
            const logPath = log.transports.file.getFile().path
            log.info('[Menu] Opening log file:', logPath)
            await shell.openPath(path.dirname(logPath))
          },
        },
        {
          label: 'Open Data Folder',
          click: async () => {
            const dataPath = app.getPath('userData')
            log.info('[Menu] Opening data folder:', dataPath)
            await shell.openPath(dataPath)
          },
        },
        { type: 'separator' },
        {
          label: 'Report a Bug',
          click: async () => {
            await shell.openExternal('https://github.com/matthewod11-stack/HRSkills/issues/new')
          },
        },
        { type: 'separator' },
        {
          label: 'About HR Command Center',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About HR Command Center',
              message: `HR Command Center v${app.getVersion()}`,
              detail: 'Chat-first HR automation platform.\n\n© 2025 FoundryHR',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  log.info('[Menu] Application menu configured')
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '..', 'icons', 'icon-1024.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security settings (Phase 4)
      contextIsolation: true,     // Isolate renderer from Node.js
      nodeIntegration: false,      // No direct Node.js access in renderer
      sandbox: true,               // Run renderer in sandbox
      webSecurity: true,           // Enable web security
      allowRunningInsecureContent: false,
      webviewTag: false,           // Disable <webview> tag
    },
  })

  // Content Security Policy (Phase 4)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +  // Next.js requires inline scripts
          "style-src 'self' 'unsafe-inline'; " +                  // Tailwind uses inline styles
          "connect-src 'self' http://localhost:* https://api.anthropic.com https://api.openai.com https://api.stripe.com; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:; " +
          "frame-ancestors 'none';"
        ]
      }
    })
  })

  // Disable DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      console.log('[Security] DevTools blocked in production')
      mainWindow?.webContents.closeDevTools()
    })
  }

  // Handle external links - open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost')) {
      return { action: 'allow' }
    }
    // Open external links in system browser
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle renderer process crashes (Phase 6)
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log.error('[Renderer] Process gone:', details.reason, details.exitCode)

    // Report to Sentry
    Sentry.captureMessage(`Renderer process gone: ${details.reason}`, {
      level: 'error',
      tags: { component: 'renderer' },
      extra: { reason: details.reason, exitCode: details.exitCode },
    })

    // Show dialog unless it was a clean exit
    if (details.reason !== 'clean-exit') {
      const result = dialog.showMessageBoxSync({
        type: 'error',
        title: 'Application Error',
        message: 'The application window has crashed.',
        detail: `Reason: ${details.reason}\n\nWould you like to reload the application?`,
        buttons: ['Reload', 'Quit'],
        defaultId: 0,
      })

      if (result === 0) {
        mainWindow?.reload()
      } else {
        app.quit()
      }
    }
  })

  // Handle unresponsive renderer (Phase 6)
  mainWindow.on('unresponsive', () => {
    log.warn('[Renderer] Window became unresponsive')

    Sentry.captureMessage('Renderer became unresponsive', {
      level: 'warning',
      tags: { component: 'renderer' },
    })
  })

  mainWindow.on('responsive', () => {
    log.info('[Renderer] Window became responsive again')
  })
}

/**
 * Load the Next.js app URL into the main window.
 */
function loadApp(): void {
  if (mainWindow) {
    const url = `http://localhost:${serverPort}`
    console.log(`[App] Loading ${url}`)
    mainWindow.loadURL(url)
  }
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.on('ready', async () => {
  log.info('[App] Ready, starting initialization...')

  // Setup application menu (Phase 6 - includes Help → View Logs)
  setupApplicationMenu()

  // Setup IPC handlers before creating window (Phase 4)
  setupIpcHandlers()

  // Setup auto-updater (Phase 7)
  setupAutoUpdater()

  // Create the window first (shows while server starts)
  createWindow()

  // Show a loading state while server starts
  mainWindow?.loadURL('data:text/html,<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui;background:#fef3c7;"><div style="text-align:center"><h1 style="color:#92400e">HR Command Center</h1><p style="color:#a16207">Starting server...</p></div></body></html>')

  try {
    // Start the Next.js server
    await startNextServer()

    // Wait for server to be ready
    const serverReady = await waitForServer()

    if (!serverReady) {
      dialog.showErrorBox(
        'Startup Error',
        'Could not start the application server. Please try again or contact support.'
      )
      app.quit()
      return
    }

    // Load the app
    loadApp()

    // Check database integrity on startup (Phase 5)
    checkIntegrityOnStartup().catch((err) => {
      console.error('[App] Integrity check failed:', err)
    })

    // Run automatic backup check in background (non-blocking)
    autoBackupOnStartup().catch((err) => {
      console.error('[App] Auto-backup check failed:', err)
    })

    // Start scheduled backup timer (Phase 5 - daily 2 AM backups)
    startBackupSchedule()

    // Start auto-update check schedule (Phase 7 - 10s delay, then every 6 hours)
    startUpdateSchedule()
  } catch (error) {
    console.error('[App] Startup error:', error)
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    loadApp()
  }
})

app.on('before-quit', () => {
  console.log('[App] Before quit - setting isQuitting flag')
  isQuitting = true
})

app.on('will-quit', () => {
  console.log('[App] Quitting, stopping server...')
  stopBackupSchedule()  // Clean up backup timer
  stopUpdateSchedule()  // Clean up update timer
  stopNextServer()
})
