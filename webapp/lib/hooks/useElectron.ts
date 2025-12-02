'use client'

import { useEffect, useState } from 'react'
import type { ElectronAPI } from '@/lib/types/electron'

/**
 * Hook to access Electron API in Next.js components
 *
 * Usage:
 * ```typescript
 * const { api, isElectron } = useElectron()
 *
 * if (isElectron && api) {
 *   const version = await api.getVersion()
 * }
 * ```
 */
export function useElectron() {
  const [api, setApi] = useState<ElectronAPI | null>(null)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Only check on client side
    if (typeof window !== 'undefined' && window.electronAPI) {
      setApi(window.electronAPI)
      setIsElectron(true)
    }
  }, [])

  return { api, isElectron }
}

/**
 * Check if running in Electron (SSR-safe)
 */
export function isElectronEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.electronAPI
}
