/**
 * DEPRECATED: /api/analytics/attrition
 *
 * This endpoint is deprecated as of Phase 2.
 * Use the unified analytics endpoint instead:
 *   GET /api/analytics?metric=attrition
 *
 * This redirect will be removed in 6 months (May 2025).
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Extract query parameters from original request
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period');
  const department = searchParams.get('department');

  // Build redirect URL
  const redirectParams = new URLSearchParams({ metric: 'attrition' });
  if (period) redirectParams.set('dateRange', period); // Note: period -> dateRange
  if (department) redirectParams.set('department', department);

  const redirectUrl = `/api/analytics?${redirectParams.toString()}`;

  // Return 308 Permanent Redirect to new endpoint
  return NextResponse.redirect(new URL(redirectUrl, request.url), 308);
}
