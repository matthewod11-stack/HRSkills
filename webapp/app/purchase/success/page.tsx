import { db } from '@/lib/db';
import { licenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CheckCircle2, Download, Mail } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { RefreshButton } from './RefreshButton';

/**
 * Purchase Success Page
 *
 * Displays the license key after a successful Stripe Checkout.
 * The license is created by the webhook at /api/webhooks/stripe
 * when Stripe sends the checkout.session.completed event.
 */

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

async function getLicenseBySessionId(sessionId: string) {
  try {
    const license = await db.query.licenses.findFirst({
      where: eq(licenses.stripeSessionId, sessionId),
    });
    return license;
  } catch (error) {
    console.error('[Purchase Success] Failed to fetch license:', error);
    return null;
  }
}

export default async function PurchaseSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  // No session ID provided
  if (!session_id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing Session</h1>
          <p className="text-gray-600 mb-6">
            No checkout session found. If you completed a purchase, please check your email for the license key.
          </p>
          <a
            href="/"
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Look up license by session ID
  const license = await getLicenseBySessionId(session_id);

  // License not found (webhook may not have processed yet)
  if (!license) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Order</h1>
          <p className="text-gray-600 mb-6">
            Your payment was successful! We&apos;re generating your license key. This usually takes a few seconds.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If this page doesn&apos;t update automatically, please refresh in a moment or check your email.
          </p>
          <RefreshButton />
        </div>
      </div>
    );
  }

  // Success - show license key
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">
            Your purchase of HR Command Center is complete.
          </p>
        </div>

        {/* License Key Display */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your License Key
          </label>
          <div className="relative">
            <div className="bg-white border-2 border-amber-200 rounded-lg p-4 font-mono text-lg text-center tracking-wider text-gray-900 select-all">
              {license.licenseKey}
            </div>
            <CopyButton licenseKey={license.licenseKey} />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Save this key! You&apos;ll need it to activate the desktop app.
          </p>
        </div>

        {/* Customer Info */}
        <div className="border-t border-gray-100 pt-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Mail className="w-4 h-4" />
            <span>Confirmation sent to: <strong>{license.customerEmail}</strong></span>
          </div>
          <p className="text-sm text-gray-500">
            A copy of your license key has been sent to your email.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-amber-50 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Next Steps</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-medium">1</span>
              <span>Download HR Command Center for your platform</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-medium">2</span>
              <span>Open the app and enter your license key when prompted</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-medium">3</span>
              <span>Start automating your HR workflows!</span>
            </li>
          </ol>
        </div>

        {/* Download Button */}
        <a
          href="/download"
          className="flex items-center justify-center gap-2 w-full bg-amber-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download HR Command Center
        </a>

        {/* Support Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <a href="mailto:support@foundryhr.com" className="text-amber-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

