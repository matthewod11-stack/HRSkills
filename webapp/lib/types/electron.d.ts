/**
 * TypeScript definitions for Electron API exposed via preload script
 * Phase 4: Secure IPC Implementation
 *
 * Usage in webapp:
 * ```typescript
 * if (window.electronAPI) {
 *   const version = await window.electronAPI.getVersion()
 * }
 * ```
 */

export interface AppConfig {
  licenseKey?: string
  licenseValidated?: boolean
  aiProviderConfigured?: boolean
  setupComplete?: boolean
  lastBackupTime?: string  // ISO timestamp of last backup
  lastScheduledBackupDate?: string  // YYYY-MM-DD of last scheduled backup
}

export type AIProvider = 'anthropic' | 'openai'
export type ExportFormat = 'json' | 'csv'

// Update event payloads
export interface UpdateAvailableInfo {
  version: string
  releaseDate?: string
}

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdateCheckResult {
  checking: boolean
  reason?: string
}

export interface UpdateInfo {
  currentVersion: string
  isPackaged: boolean
}

export interface ElectronAPI {
  // Flag to detect Electron environment
  readonly isElectron: true

  // App info
  getVersion: () => Promise<string>
  getDataPath: () => Promise<string>
  isPackaged: () => Promise<boolean>

  // Config operations
  getConfig: () => Promise<AppConfig>
  setConfig: (updates: Partial<AppConfig>) => Promise<boolean>

  // Keychain operations (secure API key storage via macOS Keychain)
  storeApiKey: (provider: AIProvider, key: string) => Promise<boolean>
  retrieveApiKey: (provider: AIProvider) => Promise<string | null>
  deleteApiKey: (provider: AIProvider) => Promise<boolean>

  // Database operations
  backupDatabase: () => Promise<string | null>
  exportData: (format: ExportFormat) => Promise<string | null>

  // Window controls
  minimize: () => void
  maximize: () => void
  close: () => void

  // External URLs (security: only HTTPS allowed)
  openExternal: (url: string) => Promise<boolean>

  // Open backup folder in Finder
  openBackupFolder: () => Promise<boolean>

  // Auto-update operations (Phase 7)
  checkForUpdates: () => Promise<UpdateCheckResult>
  getUpdateInfo: () => Promise<UpdateInfo>

  // Event listeners - updates
  onUpdateAvailable: (callback: (info: UpdateAvailableInfo) => void) => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => void
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => void
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => void
  onUpdateError: (callback: (error: { message: string }) => void) => void

  // Event listeners - backup
  onBackupFailed: (callback: (error: string) => void) => void

  // Cleanup
  removeAllListeners: (channel: string) => void
}

// Extend Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

// Export empty object to make this a module
export {}
