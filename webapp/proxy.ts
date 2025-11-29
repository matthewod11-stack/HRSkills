import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Next.js Proxy (renamed from Middleware in Next.js 16)
 * Handles CORS preflight requests and adds security headers for API routes
 */
export function proxy(request: NextRequest) {
  // DEVELOPMENT: Bypass auth for all API routes
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    response.headers.set('x-dev-mode', 'true');
    return response;
  }

  // Security headers
  const securityHeaders = {
    // CORS headers
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '86400',

    // Security headers
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: securityHeaders,
    });
  }

  // Add security headers to all API responses
  const response = NextResponse.next();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: '/api/:path*',
};
