import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { licenses } from '@/db/schema';
import { generateLicenseKey } from '@/lib/licensing/generate-key';
import { sendLicenseEmail } from '@/lib/email/resend';
import { env } from '@/env.mjs';

/**
 * Stripe Webhook Handler for Desktop App License Generation
 *
 * Handles: checkout.session.completed
 * - Generates license key
 * - Stores in database
 * - (Optional) Sends email with license key
 */

// Disable body parsing - Stripe needs raw body for signature verification
export const dynamic = 'force-dynamic';

// Initialize Stripe (only if configured)
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' })
  : null;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] Stripe not configured');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await handleCheckoutCompleted(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Stripe Webhook] Failed to handle checkout:', message);
      // Return 200 to acknowledge receipt (Stripe will retry on 5xx)
      // Log error but don't fail the webhook
    }
  }

  // Acknowledge receipt
  return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout - generate and store license key
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Processing checkout session: ${session.id}`);

  // Check if we already processed this session (idempotency)
  const existing = await db.query.licenses.findFirst({
    where: (licenses, { eq }) => eq(licenses.stripeSessionId, session.id),
  });

  if (existing) {
    console.log(`[Stripe Webhook] Session ${session.id} already processed, skipping`);
    return;
  }

  // Extract customer info
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName = session.customer_details?.name;

  if (!customerEmail) {
    throw new Error('No customer email in checkout session');
  }

  // Generate unique license key
  const licenseKey = generateLicenseKey();

  // Get line items to determine product
  let productId = env.STRIPE_PRODUCT_ID || 'unknown';
  let priceId: string | null = null;

  if (stripe && session.id) {
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      if (lineItems.data.length > 0) {
        const item = lineItems.data[0];
        priceId = item.price?.id || null;
        productId = item.price?.product as string || productId;
      }
    } catch (err) {
      console.warn('[Stripe Webhook] Could not fetch line items:', err);
    }
  }

  // Determine license type (perpetual vs subscription)
  const licenseType = session.mode === 'subscription' ? 'subscription' : 'perpetual';

  // Calculate expiration for subscriptions
  let expiresAt: string | null = null;
  if (licenseType === 'subscription' && session.subscription) {
    try {
      const subscription = await stripe?.subscriptions.retrieve(session.subscription as string);
      if (subscription?.current_period_end) {
        expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
      }
    } catch (err) {
      console.warn('[Stripe Webhook] Could not fetch subscription:', err);
    }
  }

  // Store license in database
  const licenseId = `lic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.insert(licenses).values({
    id: licenseId,
    licenseKey,
    customerEmail,
    customerName: customerName || null,
    stripeSessionId: session.id,
    stripeCustomerId: session.customer as string || null,
    stripePaymentIntentId: session.payment_intent as string || null,
    productId,
    priceId,
    licenseType,
    status: 'active',
    activationStatus: 'not_activated',
    expiresAt,
    metadataJson: JSON.stringify({
      checkoutMode: session.mode,
      currency: session.currency,
      amountTotal: session.amount_total,
    }),
  });

  console.log(`[Stripe Webhook] License created: ${licenseKey} for ${customerEmail}`);

  // Send email with license key
  const emailResult = await sendLicenseEmail({
    to: customerEmail,
    licenseKey,
    customerName,
    productName: 'HR Command Center',
  });

  if (emailResult.success) {
    console.log(`[Stripe Webhook] License email sent to ${customerEmail}`);
  } else {
    // Log but don't fail - license is still created and visible on success page
    console.warn(`[Stripe Webhook] Email delivery failed: ${emailResult.error}`);
  }
}
