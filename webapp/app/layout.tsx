import type { Metadata } from 'next'
import './globals.css'
import { Roboto } from 'next/font/google'
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary'
import { SmartPrefetch } from '@/components/custom/SmartPrefetch'
import { MonitoringProvider } from '@/components/custom/MonitoringProvider'
import { AuthProvider } from '@/lib/auth/auth-context'

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'HR Command Center',
  description: 'Claude-powered HR automation platform',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HR Command',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${roboto.variable}`}>
      <body className={roboto.className}>
        <AuthProvider>
          <RootErrorBoundary>
            {/* Skip to main content link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
            >
              Skip to main content
            </a>

            {/* Smart prefetching for instant page transitions */}
            <SmartPrefetch />

            {/* Performance monitoring and error tracking */}
            <MonitoringProvider />

            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </RootErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
