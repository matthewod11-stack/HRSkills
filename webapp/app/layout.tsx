import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Roboto } from 'next/font/google';
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary';
import { SmartPrefetch } from '@/components/custom/SmartPrefetch';
import { MonitoringProvider } from '@/components/custom/MonitoringProvider';
import { WebVitalsProvider } from '@/components/custom/WebVitalsProvider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { env } from '@/env.mjs';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'HR Command Center',
  description: 'Claude-powered HR automation platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HR Command',
  },
};

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#000000',
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${roboto.variable}`}>
      <body className={roboto.className}>
        <AuthProvider>
          <Providers>
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

              {/* Web Vitals monitoring (CLS, LCP, FID, INP, TTFB) */}
              <WebVitalsProvider />

              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </RootErrorBoundary>
          </Providers>
        </AuthProvider>

        {/* Vercel Analytics - Enabled in production via env variable */}
        {env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED && <Analytics />}

        {/* Vercel Speed Insights - Real User Monitoring for Web Vitals */}
        {env.NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED && <SpeedInsights />}
      </body>
    </html>
  );
}
