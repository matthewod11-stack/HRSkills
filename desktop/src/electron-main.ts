// Electron main process
// Phase 3: Next.js integration complete
// Phase 4: Secure IPC implementation

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs-extra'
import detectPort from 'detect-port'
import keytar from 'keytar'
import { z } from 'zod'

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
 */
function handleServerCrash(error: Error): void {
  // Don't show dialog if we're intentionally quitting
  if (isQuitting) {
    console.log('[Server] Ignoring crash during quit')
    return
  }

  console.error('[Server] Crash detected:', error.message)

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
    console.log('[Server] User requested restart')
    app.relaunch()
    app.quit()
  } else {
    // User chose Quit
    console.log('[Server] User chose to quit')
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
}

// ============================================================================
// CONFIG MANAGEMENT
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
    const dbPath = path.join(app.getPath('userData'), 'database', 'hrskills.db')
    const backupDir = path.join(app.getPath('userData'), 'backups')

    if (!await fs.pathExists(dbPath)) {
      console.log('[Backup] No database to backup')
      return null
    }

    try {
      await fs.ensureDir(backupDir)
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const backupPath = path.join(backupDir, `hrskills-backup-${timestamp}.db`)

      await fs.copy(dbPath, backupPath)
      console.log(`[Backup] Created: ${backupPath}`)
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

  console.log('[IPC] Handlers ready')
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
  console.log('[App] Ready, starting initialization...')

  // Setup IPC handlers before creating window (Phase 4)
  setupIpcHandlers()

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
  stopNextServer()
})
