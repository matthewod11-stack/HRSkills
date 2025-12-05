'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, Loader2, AlertCircle, Download, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { useElectron } from '@/lib/hooks/useElectron'
import type { UpdateAvailableInfo, UpdateProgress } from '@/lib/types/electron.d'

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error'

interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  availableVersion: string | null
  downloadProgress: number
  errorMessage: string
  isPackaged: boolean
}

/**
 * UpdateSettings component for desktop app
 * Shows current version and provides manual update check
 * Only renders when running in Electron
 */
export function UpdateSettings() {
  const { api, isElectron } = useElectron()
  const [state, setState] = useState<UpdateState>({
    status: 'idle',
    currentVersion: '',
    availableVersion: null,
    downloadProgress: 0,
    errorMessage: '',
    isPackaged: false,
  })

  // Fetch version info on mount
  useEffect(() => {
    async function loadUpdateInfo() {
      if (api) {
        try {
          const info = await api.getUpdateInfo()
          setState((prev) => ({
            ...prev,
            currentVersion: info.currentVersion,
            isPackaged: info.isPackaged,
          }))
        } catch (error) {
          console.error('Failed to load update info:', error)
        }
      }
    }
    loadUpdateInfo()
  }, [api])

  // Set up event listeners for update events
  useEffect(() => {
    if (!api) return

    const handleUpdateAvailable = (info: UpdateAvailableInfo) => {
      setState((prev) => ({
        ...prev,
        status: 'available',
        availableVersion: info.version,
      }))
    }

    const handleUpdateNotAvailable = () => {
      setState((prev) => ({
        ...prev,
        status: 'up-to-date',
      }))
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, status: 'idle' }))
      }, 3000)
    }

    const handleUpdateProgress = (progress: UpdateProgress) => {
      setState((prev) => ({
        ...prev,
        status: 'downloading',
        downloadProgress: progress.percent,
      }))
    }

    const handleUpdateDownloaded = (info: { version: string }) => {
      setState((prev) => ({
        ...prev,
        status: 'downloaded',
        availableVersion: info.version,
      }))
    }

    const handleUpdateError = (error: { message: string }) => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error.message,
      }))
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, status: 'idle', errorMessage: '' }))
      }, 5000)
    }

    // Register listeners
    api.onUpdateAvailable(handleUpdateAvailable)
    api.onUpdateNotAvailable(handleUpdateNotAvailable)
    api.onUpdateProgress(handleUpdateProgress)
    api.onUpdateDownloaded(handleUpdateDownloaded)
    api.onUpdateError(handleUpdateError)

    // Cleanup listeners on unmount
    return () => {
      api.removeAllListeners('update:available')
      api.removeAllListeners('update:not-available')
      api.removeAllListeners('update:progress')
      api.removeAllListeners('update:downloaded')
      api.removeAllListeners('update:error')
    }
  }, [api])

  const handleCheckForUpdates = useCallback(async () => {
    if (!api) return

    setState((prev) => ({ ...prev, status: 'checking', errorMessage: '' }))

    try {
      const result = await api.checkForUpdates()

      if (!result.checking && result.reason === 'development') {
        // In development mode, show a message
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'Update checks are disabled in development mode',
        }))
        setTimeout(() => {
          setState((prev) => ({ ...prev, status: 'idle', errorMessage: '' }))
        }, 3000)
      }
      // If checking started successfully, the event listeners will handle the rest
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to check for updates',
      }))
    }
  }, [api])

  // Don't render if not in Electron
  if (!isElectron || !api) {
    return null
  }

  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'checking':
        return 'Checking for updates...'
      case 'available':
        return `Version ${state.availableVersion} is available`
      case 'downloading':
        return `Downloading update... ${Math.round(state.downloadProgress)}%`
      case 'downloaded':
        return `Version ${state.availableVersion} ready to install`
      case 'up-to-date':
        return 'You have the latest version'
      case 'error':
        return state.errorMessage || 'Update check failed'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-amber" />
      case 'available':
        return <Download className="w-4 h-4 text-amber" />
      case 'downloading':
        return <Loader2 className="w-4 h-4 animate-spin text-amber" />
      case 'downloaded':
        return <CheckCircle2 className="w-4 h-4 text-sage" />
      case 'up-to-date':
        return <CheckCircle2 className="w-4 h-4 text-sage" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-terracotta" />
      default:
        return null
    }
  }

  const getStatusColor = (): string => {
    switch (state.status) {
      case 'available':
      case 'downloading':
        return 'bg-amber/10 text-amber'
      case 'downloaded':
      case 'up-to-date':
        return 'bg-sage/10 text-sage'
      case 'error':
        return 'bg-terracotta/10 text-terracotta'
      default:
        return 'bg-charcoal-soft/10 text-charcoal-light'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-cream-white border-2 border-amber/30 rounded-3xl p-6 shadow-soft hover:border-amber/50 transition-all"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber to-terracotta rounded-2xl flex items-center justify-center shadow-warm">
          <Package className="w-6 h-6 text-cream-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-charcoal">App Updates</h2>
          <p className="text-xs text-charcoal-light">
            Keep HR Command Center up to date
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Version */}
        <div className="p-4 bg-amber/5 border border-warm rounded-2xl shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-amber" />
                <span className="text-xs text-charcoal-light font-medium">Current Version</span>
              </div>
              <p className="text-lg font-bold text-charcoal">
                {state.currentVersion || 'Loading...'}
              </p>
            </div>
            {!state.isPackaged && (
              <span className="px-2 py-1 bg-charcoal-soft/20 text-charcoal-light text-xs rounded-lg">
                Development
              </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        {state.status !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusMessage()}</span>
          </div>
        )}

        {/* Download Progress Bar */}
        {state.status === 'downloading' && (
          <div className="w-full bg-warm rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber to-terracotta h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.downloadProgress}%` }}
            />
          </div>
        )}

        {/* Check for Updates Button */}
        <button
          type="button"
          onClick={handleCheckForUpdates}
          disabled={state.status === 'checking' || state.status === 'downloading'}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber hover:bg-amber-dark disabled:opacity-50 disabled:cursor-not-allowed text-cream-white rounded-xl text-sm font-medium transition-all hover-lift shadow-soft hover:shadow-warm"
        >
          {state.status === 'checking' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Check for Updates
            </>
          )}
        </button>

        {/* Info Text */}
        <p className="text-xs text-charcoal-soft text-center">
          {state.isPackaged
            ? 'Updates are downloaded automatically and installed on restart'
            : 'Update checks require a packaged app build'}
        </p>
      </div>
    </motion.div>
  )
}
