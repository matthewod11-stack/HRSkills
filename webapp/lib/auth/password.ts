import { createHash, timingSafeEqual } from 'crypto';

/**
 * Password verification utility for single-user authentication
 * Uses Node.js built-in crypto module (no external dependencies)
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Hex-encoded hash string
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a stored hash using timing-safe comparison
 * @param password - Plain text password to verify
 * @param hash - Stored hash to compare against
 * @returns true if password matches hash, false otherwise
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const inputHash = hashPassword(password);
    
    // Use timing-safe comparison to prevent timing attacks
    // Both hashes are hex strings (64 chars), so we can compare directly
    if (inputHash.length !== hash.length) {
      return false;
    }
    
    // Convert hex strings to buffers for timing-safe comparison
    const inputBuffer = Buffer.from(inputHash, 'hex');
    const storedBuffer = Buffer.from(hash, 'hex');

    // If lengths don't match after conversion, return false
    if (inputBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(new Uint8Array(inputBuffer), new Uint8Array(storedBuffer));
  } catch (error) {
    // If any error occurs during comparison, return false
    return false;
  }
}

