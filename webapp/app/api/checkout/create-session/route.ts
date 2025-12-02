import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/env.mjs';

/**
 * Create Stripe Checkout Session for Desktop App Purchase
 *
 * POST /api/checkout/create-session
 *
 * Creates a Stripe Checkout session and returns the URL to redirect the customer.
 * The webhook at /api/webhooks/stripe handles the post-purchase license generation.
 */

// Initialize Stripe (only if configured)
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' })
  : null;

// Cache for price lookup (avoids repeated API calls)
let cachedPriceId: string | null = null;

/**
 * Get the price ID for checkout
 * Uses STRIPE_PRICE_ID if configured, otherwise looks up from product
 */
async function getPriceId(): Promise<string | null> {
  // Use configured price ID if available
  if (env.STRIPE_PRICE_ID) {
    return env.STRIPE_PRICE_ID;
  }

  // Return cached price if available
  if (cachedPriceId) {
    return cachedPriceId;
  }

  // Look up price from product
  if (!stripe || !env.STRIPE_PRODUCT_ID) {
    return null;
  }

  try {
    const prices = await stripe.prices.list({
      product: env.STRIPE_PRODUCT_ID,
      active: true,
      limit: 1,
    });

    if (prices.data.length > 0) {
      cachedPriceId = prices.data[0].id;
      return cachedPriceId;
    }
  } catch (error) {
    console.error('[Checkout] Failed to look up price:', error);
  }

  return null;
}

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' },
      { status: 500 }
    );
  }

  // Get price ID
  const priceId = await getPriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: 'No price configured. Please set STRIPE_PRICE_ID or create a price for the product.' },
      { status: 500 }
    );
  }

  // Parse request body (optional customer email)
  let customerEmail: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    customerEmail = body.email;
  } catch {
    // No body provided, that's fine
  }

  // Get the origin for success/cancel URLs
  // Use host header to support both localhost and production
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = request.headers.get('origin') || `${protocol}://${host}`;

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment for perpetual license
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pre-fill customer email if provided
      ...(customerEmail && { customer_email: customerEmail }),
      // Success URL includes session_id for license lookup
      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/purchase/cancelled`,
      // Collect billing address for receipts
      billing_address_collection: 'auto',
      // Metadata for tracking
      metadata: {
        product: 'HR Command Center Desktop',
        source: 'website',
      },
    });

    // Return the checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Checkout] Failed to create session:', message);

    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}

// Also support GET for simple redirects (e.g., from a buy button link)
export async function GET(request: NextRequest) {
  const response = await POST(request);
  const data = await response.json();

  if (data.url) {
    // Redirect to Stripe Checkout
    return NextResponse.redirect(data.url);
  }

  // Return error as JSON
  return NextResponse.json(data, { status: response.status });
}
