import { NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../../../integrations/google/oauth-client';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google/status
 *
 * Check if user is authenticated with Google
 */
export async function GET() {
  try {
    const isAuthenticated = googleOAuthClient.isAuthenticated();

    return NextResponse.json({
      authenticated: isAuthenticated,
      message: isAuthenticated
        ? 'Google Docs integration is connected'
        : 'Please connect Google Docs to export documents'
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
