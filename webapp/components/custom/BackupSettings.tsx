'use client'

import { useState, useEffect } from 'react'
import { HardDrive, FolderOpen, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useElectron } from '@/lib/hooks/useElectron'

interface BackupState {
  lastBackupTime: string | null
  isBackingUp: boolean
  backupResult: 'success' | 'error' | null
  backupMessage: string
}

/**
 * BackupSettings component for desktop app
 * Shows last backup time and provides manual backup controls
 * Only renders when running in Electron
 */
export function BackupSettings() {
  const { api, isElectron } = useElectron()
  const [state, setState] = useState<BackupState>({
    lastBackupTime: null,
    isBackingUp: false,
    backupResult: null,
    backupMessage: '',
  })

  // Fetch last backup time on mount
  useEffect(() => {
    async function loadConfig() {
      if (api) {
        try {
          const config = await api.getConfig()
          setState((prev) => ({
            ...prev,
            lastBackupTime: config.lastBackupTime || null,
          }))
        } catch (error) {
          console.error('Failed to load backup config:', error)
        }
      }
    }
    loadConfig()
  }, [api])

  // Don't render if not in Electron
  if (!isElectron || !api) {
    return null
  }

  const handleBackup = async () => {
    setState((prev) => ({
      ...prev,
      isBackingUp: true,
      backupResult: null,
      backupMessage: '',
    }))

    try {
      const backupPath = await api.backupDatabase()

      if (backupPath) {
        // Refresh config to get updated lastBackupTime
        const config = await api.getConfig()
        setState((prev) => ({
          ...prev,
          isBackingUp: false,
          backupResult: 'success',
          backupMessage: 'Backup created successfully',
          lastBackupTime: config.lastBackupTime || null,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isBackingUp: false,
          backupResult: 'error',
          backupMessage: 'No database to backup',
        }))
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, backupResult: null, backupMessage: '' }))
      }, 3000)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isBackingUp: false,
        backupResult: 'error',
        backupMessage: error instanceof Error ? error.message : 'Backup failed',
      }))
    }
  }

  const handleOpenFolder = async () => {
    try {
      await api.openBackupFolder()
    } catch (error) {
      console.error('Failed to open backup folder:', error)
    }
  }

  const formatLastBackupTime = (isoString: string | null): string => {
    if (!isoString) return 'Never'

    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Less than an hour ago'
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-cream-white border-2 border-sage/30 rounded-3xl p-6 shadow-soft hover:border-sage/50 transition-all"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-sage to-sage-light rounded-2xl flex items-center justify-center shadow-warm">
          <HardDrive className="w-6 h-6 text-cream-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-charcoal">Database Backups</h2>
          <p className="text-xs text-charcoal-light">
            Automatic backups run daily at 2 AM
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Last Backup Status */}
        <div className="p-4 bg-sage/5 border border-warm rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-sage" />
            <span className="text-xs text-charcoal-light font-medium">Last Backup</span>
          </div>
          <p className="text-lg font-bold text-charcoal">
            {formatLastBackupTime(state.lastBackupTime)}
          </p>
          {state.lastBackupTime && (
            <p className="text-xs text-charcoal-soft mt-1">
              {new Date(state.lastBackupTime).toLocaleString()}
            </p>
          )}
        </div>

        {/* Backup Result Message */}
        {state.backupResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl ${
              state.backupResult === 'success'
                ? 'bg-sage/10 text-sage'
                : 'bg-terracotta/10 text-terracotta'
            }`}
          >
            {state.backupResult === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{state.backupMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBackup}
            disabled={state.isBackingUp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-sage hover:bg-sage-light disabled:opacity-50 disabled:cursor-not-allowed text-cream-white rounded-xl text-sm font-medium transition-all hover-lift shadow-soft hover:shadow-warm"
          >
            {state.isBackingUp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Backing up...
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                Backup Now
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenFolder}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-cream hover:bg-warm border-2 border-warm hover:border-sage/40 text-charcoal rounded-xl text-sm font-medium transition-all hover-lift shadow-soft"
          >
            <FolderOpen className="w-4 h-4" />
            Open Folder
          </button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-charcoal-soft text-center">
          Backups are stored locally and kept for 30 days
        </p>
      </div>
    </motion.div>
  )
}
