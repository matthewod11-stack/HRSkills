'use client'

/**
 * Welcome Dialog Component
 *
 * First-run experience for new users showing:
 * - 30-second demo video
 * - Pre-loaded example conversation
 * - 3 quick-start prompts
 * - Information about demo data
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Database, MessageSquare, ArrowRight, Play } from 'lucide-react'

interface WelcomeDialogProps {
  onClose?: () => void
  onQuickStart?: (prompt: string) => void
}

const QUICK_START_PROMPTS = [
  {
    icon: Database,
    label: 'Show engineering headcount',
    prompt: 'Show me our engineering headcount with breakdown by level and recent changes',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  },
  {
    icon: Sparkles,
    label: 'Who are my flight risks?',
    prompt: 'Who are my flight risks? Show me employees at risk of leaving and why',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
  },
  {
    icon: MessageSquare,
    label: 'Create a job description',
    prompt: 'Help me create a job description for a Senior Software Engineer position',
    color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
  }
]

const DEMO_CONVERSATION = {
  title: 'Engineering Headcount Analysis',
  messages: [
    {
      role: 'user' as const,
      content: 'Show me our engineering headcount'
    },
    {
      role: 'assistant' as const,
      content: `Based on the current data, here's your engineering headcount:

**Total Engineers**: 47 employees

**By Level**:
- IC1-2 (Junior): 12 engineers
- IC3 (Mid): 18 engineers
- IC4-5 (Senior/Staff): 17 engineers

**Recent Changes**:
- Down 3 from last quarter (-6%)
- 2 senior engineers departed
- 1 mid-level engineer transitioned to Product

**Key Insights**:
- 2 senior engineers are identified as flight risks
- 3 open requisitions unfilled for 60+ days
- Average time-to-hire increased 40% this quarter

Would you like me to:
- Draft job descriptions for open roles
- Create retention plan for at-risk engineers
- Analyze hiring bottlenecks`
    }
  ]
}

export function WelcomeDialog({ onClose, onQuickStart }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(true)

  useEffect(() => {
    // Check if user has seen welcome before
    const hasSeenWelcome = localStorage.getItem('hrskills_seen_welcome')

    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('hrskills_seen_welcome', 'true')
    setOpen(false)
    onClose?.()
  }

  const handleQuickStart = (prompt: string) => {
    handleClose()
    onQuickStart?.(prompt)
  }

  const handleViewExampleConversation = () => {
    handleClose()
    // This will be handled by the parent component to load the demo conversation
    onQuickStart?.(DEMO_CONVERSATION.messages[0].content)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Welcome to HR Command Center!
          </DialogTitle>
          <DialogDescription className="text-base">
            Your AI-powered HR assistant that takes action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Demo Video Section */}
          {showVideo && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">See it in action (30 seconds)</h3>

              {/* Video Placeholder - In production, replace with actual video */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <Play className="h-10 w-10 text-blue-600 dark:text-blue-400 ml-1" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Demo video coming soon
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVideo(false)}
                    className="text-xs"
                  >
                    Skip video
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Example Conversation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Example conversation</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-800">
              {DEMO_CONVERSATION.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`
                    rounded-lg p-3 text-sm
                    ${msg.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 ml-12'
                      : 'bg-white dark:bg-gray-800 mr-12'
                    }
                  `}
                >
                  <div className="font-semibold text-xs mb-1 opacity-70">
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewExampleConversation}
              className="w-full"
            >
              Try this example
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Quick Start Prompts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Try asking:</h3>
            <div className="grid gap-3">
              {QUICK_START_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickStart(prompt.prompt)}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2
                      transition-all hover:scale-[1.02] hover:shadow-md
                      ${prompt.color}
                      border-current/20
                    `}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{prompt.label}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Demo Data Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  You're using demo data
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  200 employees with realistic metrics, flight risks, and performance data.
                  You can upload your own CSV data anytime in Settings.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              className="flex-1"
              size="lg"
            >
              Get Started
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                handleClose()
                window.location.href = '/settings'
              }}
              variant="outline"
              size="lg"
            >
              Settings
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <button
              onClick={handleClose}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Don't show this again
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to trigger welcome dialog
 */
export function useWelcomeDialog() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hrskills_seen_welcome')
    setShouldShow(!hasSeenWelcome)
  }, [])

  const resetWelcome = () => {
    localStorage.removeItem('hrskills_seen_welcome')
    setShouldShow(true)
  }

  return {
    shouldShow,
    resetWelcome
  }
}
