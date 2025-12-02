import { Resend } from 'resend';
import { env } from '@/env.mjs';

/**
 * Resend Email Service for HR Command Center
 *
 * Used for:
 * - License key delivery after purchase
 * - (Future) Password resets, notifications, etc.
 */

// Initialize Resend client (only if API key configured)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Sender configuration
const FROM_EMAIL = 'HR Command Center <noreply@foundryhr.com>';
const REPLY_TO = 'support@foundryhr.com';

export interface SendLicenseEmailParams {
  to: string;
  licenseKey: string;
  customerName?: string | null;
  productName?: string;
}

/**
 * Send license key email after successful purchase
 */
export async function sendLicenseEmail({
  to,
  licenseKey,
  customerName,
  productName = 'HR Command Center',
}: SendLicenseEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const greeting = customerName ? `Hi ${customerName},` : 'Hi,';

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject: `Your ${productName} License Key`,
      html: generateLicenseEmailHtml({
        greeting,
        licenseKey,
        productName,
      }),
      text: generateLicenseEmailText({
        greeting,
        licenseKey,
        productName,
      }),
    });

    if (error) {
      console.error('[Email] Failed to send license email:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] License email sent successfully: ${data?.id}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception sending license email:', message);
    return { success: false, error: message };
  }
}

interface EmailTemplateParams {
  greeting: string;
  licenseKey: string;
  productName: string;
}

/**
 * Generate HTML email template for license delivery
 */
function generateLicenseEmailHtml({
  greeting,
  licenseKey,
  productName,
}: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your License Key</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Thank You for Your Purchase!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for purchasing <strong>${productName}</strong>. Your license key is ready!
              </p>

              <!-- License Key Box -->
              <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: center;">
                <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your License Key
                </p>
                <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                  ${licenseKey}
                </p>
              </div>

              <!-- Instructions -->
              <h2 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">
                Getting Started
              </h2>
              <ol style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                <li>Download ${productName} from our website</li>
                <li>Run the installer and open the app</li>
                <li>Enter your license key when prompted</li>
                <li>Start managing your HR operations!</li>
              </ol>

              <!-- Download Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://foundryhr.com/download" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);">
                      Download Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Keep this email safe - you'll need your license key if you ever reinstall the app.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                Questions? Reply to this email or visit <a href="https://foundryhr.com/support" style="color: #f59e0b; text-decoration: none;">foundryhr.com/support</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Legal Footer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Foundry HR. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for license delivery (fallback)
 */
function generateLicenseEmailText({
  greeting,
  licenseKey,
  productName,
}: EmailTemplateParams): string {
  return `
${greeting}

Thank you for purchasing ${productName}!

YOUR LICENSE KEY
================
${licenseKey}

GETTING STARTED
===============
1. Download ${productName} from https://foundryhr.com/download
2. Run the installer and open the app
3. Enter your license key when prompted
4. Start managing your HR operations!

Keep this email safe - you'll need your license key if you ever reinstall the app.

Questions? Reply to this email or visit https://foundryhr.com/support

© ${new Date().getFullYear()} Foundry HR. All rights reserved.
  `.trim();
}
