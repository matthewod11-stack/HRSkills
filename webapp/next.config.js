/** @type {import('next').NextConfig} */

// Sentry configuration (wraps Next.js config)
const { withSentryConfig } = require('@sentry/nextjs');

// Bundle analyzer (run with ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// PWA configuration (disabled in development for faster builds)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // API calls - Network-first strategy with fallback
      urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Static assets - Cache-first strategy
      urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif|ico|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Pages - Network-first strategy
      urlPattern: /^https?:\/\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

const nextConfig = {
  // Enable React strict mode for development best practices
  reactStrictMode: true,

  // ============================================
  // SECURITY: API Keys Configuration
  // ============================================
  // ❌ DO NOT expose API keys in client-side bundle
  // ✅ API keys should ONLY be accessed in API routes (server-side)
  //
  // REMOVED INSECURE CONFIGURATION:
  // env: {
  //   ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,  // ❌ Security risk!
  //   RIPPLING_API_KEY: process.env.RIPPLING_API_KEY,    // ❌ Security risk!
  //   NOTION_TOKEN: process.env.NOTION_TOKEN,            // ❌ Security risk!
  // }
  //
  // Access these variables in API routes using process.env.VARIABLE_NAME

  // ============================================
  // Production Optimization
  // ============================================
  // Enable standalone output for Docker deployments
  // This creates a minimal production server with only required dependencies
  output: 'standalone',

  // Compress pages for faster loading
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  // ============================================
  // Performance Optimization
  // ============================================
  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats with fallback
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    domains: [], // Add external image domains here when needed
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NODE_ENV === 'development', // Skip optimization in dev for faster builds
  },

  // ============================================
  // SECURITY HEADERS
  // ============================================
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
          "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.anthropic.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // CORS configuration for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },
    ];
  },

  // ============================================
  // Environment-specific Configuration
  // ============================================
  // Public environment variables (safe for client-side)
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'HR Command Center',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
  },

  // ============================================
  // Development Configuration
  // ============================================
  // Enable hot reload for better DX
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: true,
  }),

  // ============================================
  // Experimental Features
  // ============================================
  experimental: {
    // Enable Server Actions (Next.js 14+)
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    // Optimize package imports
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

// Sentry configuration options (merged with wizard settings)
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Organization and project from Sentry wizard
  org: process.env.SENTRY_ORG || "foundryhr",
  project: process.env.SENTRY_PROJECT || "hrcommandcenter",

  // Only upload source maps if auth token is provided
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppresses source map uploading logs during build (unless in CI)
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,

  // Disable plugins if no auth token (source maps won't upload without token)
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
};

// Export with Sentry wrapper (only wraps if DSN is configured)
const config = withBundleAnalyzer(withPWA(nextConfig));

// Only wrap with Sentry if DSN is configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  module.exports = withSentryConfig(config, sentryWebpackPluginOptions);
} else {
  module.exports = config;
}
