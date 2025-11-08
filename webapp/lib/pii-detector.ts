/**
 * PII Detection Service
 *
 * Scans text for sensitive personally identifiable information (PII)
 * before sending to external APIs.
 *
 * Focus: High-risk PII (SSN, DOB, banking info)
 */

export interface PIIDetectionResult {
  detected: boolean;
  types: string[];
  message: string;
}

export function detectSensitivePII(text: string): PIIDetectionResult {
  const detected: string[] = [];

  // SSN patterns (various formats)
  const ssnPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g,           // 123-45-6789
    /\b\d{3}\s\d{2}\s\d{4}\b/g,         // 123 45 6789
    /\b\d{9}\b/g,                        // 123456789 (9 consecutive digits)
  ];

  for (const pattern of ssnPatterns) {
    if (pattern.test(text)) {
      detected.push('SSN');
      break;
    }
  }

  // Date of Birth patterns (common formats)
  const dobPatterns = [
    /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,  // MM/DD/YYYY or MM-DD-YYYY
    /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g,  // YYYY/MM/DD or YYYY-MM-DD
  ];

  // Only flag if looks like DOB context (birth, born, dob)
  const dobContext = /\b(birth|born|dob|date of birth)\b/i.test(text);
  if (dobContext) {
    for (const pattern of dobPatterns) {
      if (pattern.test(text)) {
        detected.push('Date of Birth');
        break;
      }
    }
  }

  // Bank account numbers (8-17 digits, often with spaces or dashes)
  const bankAccountPatterns = [
    /\b\d{8,17}\b/g,                    // 8-17 consecutive digits
    /\b\d{4}[\s\-]\d{4}[\s\-]\d{4,9}\b/g,  // 1234-5678-90123456 format
  ];

  // Only flag if looks like bank context
  const bankContext = /\b(account|routing|bank|ach|wire|transfer)\b/i.test(text);
  if (bankContext) {
    for (const pattern of bankAccountPatterns) {
      if (pattern.test(text)) {
        detected.push('Bank Account Number');
        break;
      }
    }
  }

  // Credit card numbers (16 digits, optionally with spaces/dashes)
  const creditCardPatterns = [
    /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,  // 1234-5678-9012-3456
  ];

  const cardContext = /\b(card|credit|visa|mastercard|amex|discover)\b/i.test(text);
  if (cardContext) {
    for (const pattern of creditCardPatterns) {
      if (pattern.test(text)) {
        detected.push('Credit Card Number');
        break;
      }
    }
  }

  // Build result
  if (detected.length > 0) {
    const uniqueTypes = [...new Set(detected)];
    return {
      detected: true,
      types: uniqueTypes,
      message: `Detected potential ${uniqueTypes.join(', ')}. Consider removing or using placeholders like [SSN], [DOB], [Account #].`
    };
  }

  return {
    detected: false,
    types: [],
    message: ''
  };
}

/**
 * Mask detected PII in text (optional - for display purposes)
 */
export function maskPII(text: string): string {
  let masked = text;

  // Mask SSN
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX');
  masked = masked.replace(/\b\d{3}\s\d{2}\s\d{4}\b/g, 'XXX XX XXXX');

  // Mask bank accounts (last 4 digits only)
  masked = masked.replace(/\b\d{4}[\s\-]\d{4}[\s\-]\d{4,9}\b/g, (match) => {
    const last4 = match.slice(-4);
    return '****-****-' + last4;
  });

  // Mask credit cards (last 4 digits only)
  masked = masked.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?(\d{4})\b/g, (match, last4) => {
    return '****-****-****-' + last4;
  });

  return masked;
}
