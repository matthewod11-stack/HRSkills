import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Purchase Cancelled Page
 *
 * Displayed when a user cancels the Stripe Checkout flow.
 * Provides options to try again or get help.
 */

export default function PurchaseCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Cancelled
          </h1>
          <p className="text-gray-600">
            Your order was not completed. No charges have been made.
          </p>
        </div>

        {/* Reasons & Help */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Need Help?
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Having trouble with payment? Try a different card.</li>
            <li>• Questions about the product? Check our FAQ.</li>
            <li>• Need assistance? Contact our support team.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/api/checkout/create-session"
            className="flex items-center justify-center gap-2 w-full bg-amber-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>

        {/* Support Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions?{' '}
          <a
            href="mailto:support@foundryhr.com"
            className="text-amber-600 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
