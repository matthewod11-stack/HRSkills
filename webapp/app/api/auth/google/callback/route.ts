import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../../../integrations/google/oauth-client';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google/callback
 *
 * OAuth callback - receives authorization code from Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      return NextResponse.redirect(new URL(`/?auth=cancelled&error=${error}`, request.url));
    }

    // Validate code
    if (!code) {
      return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
    }

    // Exchange code for tokens
    await googleOAuthClient.getTokenFromCode(code);

    // Redirect back to app with success message
    return NextResponse.redirect(
      new URL('/?auth=success&message=Google+Docs+connected', request.url)
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
