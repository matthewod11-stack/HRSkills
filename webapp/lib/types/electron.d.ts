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
}

export type AIProvider = 'anthropic' | 'openai'
export type ExportFormat = 'json' | 'csv'

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

  // Event listeners
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateProgress: (callback: (percent: number) => void) => void
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
