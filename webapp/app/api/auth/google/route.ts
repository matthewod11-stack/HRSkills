import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../../integrations/google/oauth-client';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google
 *
 * Initiate OAuth flow - redirects user to Google consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = googleOAuthClient.getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication', details: error.message },
      { status: 500 }
    );
  }
}
