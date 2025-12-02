import crypto from 'crypto';

/**
 * License Key Generation for HR Command Center Desktop App
 *
 * Format: HRCC-XXXX-XXXX-XXXX-XXXX
 * - HRCC prefix identifies the product
 * - 16 alphanumeric characters in 4 groups
 * - Uses cryptographically secure random bytes
 * - Excludes ambiguous characters (0, O, 1, I, L)
 */

// Character set excluding ambiguous characters for readability
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a cryptographically secure license key
 * @returns License key in format HRCC-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments: string[] = [];

  for (let s = 0; s < 4; s++) {
    let segment = '';
    const randomBytes = crypto.randomBytes(4);

    for (let i = 0; i < 4; i++) {
      const index = randomBytes[i] % CHARSET.length;
      segment += CHARSET[index];
    }

    segments.push(segment);
  }

  return `HRCC-${segments.join('-')}`;
}

/**
 * Validate license key format (not activation status)
 * @param key License key to validate
 * @returns true if format is valid
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Expected format: HRCC-XXXX-XXXX-XXXX-XXXX
  const pattern = /^HRCC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(key.toUpperCase());
}

/**
 * Normalize license key input (uppercase, trim whitespace)
 * @param key Raw license key input
 * @returns Normalized key
 */
export function normalizeLicenseKey(key: string): string {
  return key.trim().toUpperCase();
}
