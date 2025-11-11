'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { get } from '@/lib/api-helpers/fetch-with-retry'

interface MetricDetail {
  name: string
  role: string
  date: string | null
}

type MetricDetailsType = 'headcount' | 'attrition' | null

interface MetricDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  metric: MetricDetailsType
  title: string
  description: string
}

export function MetricDetailsDialog({ isOpen, onClose, metric, title, description }: MetricDetailsDialogProps) {
  const [data, setData] = useState<MetricDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !metric) {
      setData([])
      setError(null)
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await get(`/api/metrics/details?metric=${metric}`)
        setData(result.data || [])
      } catch (err: any) {
        console.error('Error fetching metric details:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, metric])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-xl bg-black/90 border-2 border-white/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" aria-hidden="true" />
              <span className="sr-only">Loading metric details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="bg-white/5 border border-white/20 rounded-lg p-8 text-center text-gray-400">
              No data available
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="backdrop-blur-sm bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-400">{item.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {metric === 'headcount' ? 'Hired' : metric === 'attrition' ? 'Terminated' : 'Updated'}
                      </p>
                      <p className="text-sm font-mono text-blue-400">{formatDate(item.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
