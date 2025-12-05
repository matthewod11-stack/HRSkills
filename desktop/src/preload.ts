// Preload script - Phase 4 Secure IPC Implementation
// This script runs in an isolated context and exposes safe APIs to the renderer

import { contextBridge, ipcRenderer } from 'electron'

// Expose safe APIs to renderer via context bridge
// All IPC calls are validated on the main process side
contextBridge.exposeInMainWorld('electronAPI', {
  // Flag to detect Electron environment
  isElectron: true,

  // --- App Info ---
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getDataPath: (): Promise<string> => ipcRenderer.invoke('app:dataPath'),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke('app:isPackaged'),

  // --- Config Operations ---
  getConfig: (): Promise<{
    licenseKey?: string
    licenseValidated?: boolean
    aiProviderConfigured?: boolean
    setupComplete?: boolean
    lastBackupTime?: string  // ISO timestamp of last backup
    lastScheduledBackupDate?: string  // YYYY-MM-DD of last scheduled backup
  }> => ipcRenderer.invoke('config:get'),

  setConfig: (updates: Record<string, unknown>): Promise<boolean> =>
    ipcRenderer.invoke('config:set', updates),

  // --- Keychain Operations (secure API key storage) ---
  storeApiKey: (provider: 'anthropic' | 'openai', key: string): Promise<boolean> =>
    ipcRenderer.invoke('keychain:store', provider, key),

  retrieveApiKey: (provider: 'anthropic' | 'openai'): Promise<string | null> =>
    ipcRenderer.invoke('keychain:retrieve', provider),

  deleteApiKey: (provider: 'anthropic' | 'openai'): Promise<boolean> =>
    ipcRenderer.invoke('keychain:delete', provider),

  // --- Database Operations ---
  backupDatabase: (): Promise<string | null> => ipcRenderer.invoke('db:backup'),

  exportData: (format: 'json' | 'csv'): Promise<string | null> =>
    ipcRenderer.invoke('db:export', format),

  // --- Window Controls ---
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close'),

  // --- External URLs ---
  openExternal: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('shell:openExternal', url),

  // --- Open Backup Folder ---
  openBackupFolder: (): Promise<boolean> =>
    ipcRenderer.invoke('shell:openBackupFolder'),

  // --- Event Listeners (for future use: updates, backup status) ---
  onUpdateAvailable: (callback: (version: string) => void): void => {
    ipcRenderer.on('update:available', (_, version) => callback(version))
  },

  onUpdateProgress: (callback: (percent: number) => void): void => {
    ipcRenderer.on('update:progress', (_, percent) => callback(percent))
  },

  onBackupFailed: (callback: (error: string) => void): void => {
    ipcRenderer.on('backup:failed', (_, error) => callback(error))
  },

  // Cleanup function for removing listeners
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },
})
