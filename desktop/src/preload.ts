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

  // --- Auto-Update Operations (Phase 7) ---
  checkForUpdates: (): Promise<{ checking: boolean; reason?: string }> =>
    ipcRenderer.invoke('update:checkForUpdates'),

  getUpdateInfo: (): Promise<{ currentVersion: string; isPackaged: boolean }> =>
    ipcRenderer.invoke('update:getInfo'),

  // --- Event Listeners (for updates, backup status) ---
  onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string }) => void): void => {
    ipcRenderer.on('update:available', (_, info) => callback(info))
  },

  onUpdateNotAvailable: (callback: (info: { version: string }) => void): void => {
    ipcRenderer.on('update:not-available', (_, info) => callback(info))
  },

  onUpdateProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): void => {
    ipcRenderer.on('update:progress', (_, progress) => callback(progress))
  },

  onUpdateDownloaded: (callback: (info: { version: string }) => void): void => {
    ipcRenderer.on('update:downloaded', (_, info) => callback(info))
  },

  onUpdateError: (callback: (error: { message: string }) => void): void => {
    ipcRenderer.on('update:error', (_, error) => callback(error))
  },

  onBackupFailed: (callback: (error: string) => void): void => {
    ipcRenderer.on('backup:failed', (_, error) => callback(error))
  },

  // Cleanup function for removing listeners
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },
})
