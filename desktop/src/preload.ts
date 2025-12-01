// Preload script - minimal scaffold
// Full implementation will be added in Phase 4

import { contextBridge } from 'electron'

// Expose minimal API for now
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
})
