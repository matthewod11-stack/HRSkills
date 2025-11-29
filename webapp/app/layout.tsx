import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Roboto } from 'next/font/google';
import { MonitoringProvider } from '@/components/custom/MonitoringProvider';
import { SmartPrefetch } from '@/components/custom/SmartPrefetch';
import { WebVitalsProvider } from '@/components/custom/WebVitalsProvider';
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary';
import { env } from '@/env.mjs';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Providers } from './providers';

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
    <html lang="en" className={`dark ${roboto.variable} h-full`}>
      <body className={`${roboto.className} h-full`}>
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

              <main id="main-content" tabIndex={-1} className="h-full">
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
