/**
 * Google Cloud Data Loss Prevention (DLP) Service
 *
 * Provides PII detection, de-identification, and risk analysis for HR data.
 * Used to protect sensitive employee information before processing or logging.
 *
 * @see https://cloud.google.com/dlp/docs
 */

import type { protos } from '@google-cloud/dlp';
import { DlpServiceClient } from '@google-cloud/dlp';

type IInfoType = protos.google.privacy.dlp.v2.IInfoType;
type IInspectConfig = protos.google.privacy.dlp.v2.IInspectConfig;
type IDeidentifyConfig = protos.google.privacy.dlp.v2.IDeidentifyConfig;
type IFinding = protos.google.privacy.dlp.v2.IFinding;

// Initialize DLP client (uses GOOGLE_APPLICATION_CREDENTIALS env var)
let dlpClient: DlpServiceClient | null = null;

function getDlpClient(): DlpServiceClient {
  if (!dlpClient) {
    dlpClient = new DlpServiceClient();
  }
  return dlpClient;
}

/**
 * Configuration for DLP scanning
 */
export interface DlpScanConfig {
  /** Info types to scan for (default: ALL_HR_PII) */
  infoTypes?: IInfoType[];
  /** Minimum likelihood threshold (default: LIKELY) */
  minLikelihood?: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  /** Include quote from finding (default: false for privacy) */
  includeQuote?: boolean;
}

/**
 * Result from DLP scanning
 */
export interface DlpScanResult {
  /** Whether PII was detected */
  hasPii: boolean;
  /** Number of findings */
  findingCount: number;
  /** Detailed findings (if any) */
  findings: Array<{
    infoType: string;
    likelihood: string;
    location?: { byteRange?: { start?: number; end?: number } };
    quote?: string;
  }>;
  /** Risk analysis */
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Standard HR PII info types to scan for
 */
const HR_PII_INFO_TYPES: IInfoType[] = [
  { name: 'EMAIL_ADDRESS' },
  { name: 'PHONE_NUMBER' },
  { name: 'US_SOCIAL_SECURITY_NUMBER' },
  { name: 'DATE_OF_BIRTH' },
  { name: 'CREDIT_CARD_NUMBER' },
  { name: 'US_BANK_ROUTING_MICR' },
  { name: 'IBAN_CODE' },
  { name: 'PERSON_NAME' },
  { name: 'STREET_ADDRESS' },
  { name: 'US_DRIVERS_LICENSE_NUMBER' },
  { name: 'US_PASSPORT' },
  { name: 'ETHNIC_GROUP' },
  { name: 'GENDER' },
  { name: 'MEDICAL_RECORD_NUMBER' },
  { name: 'US_HEALTHCARE_NPI' },
];

/**
 * Scan text content for PII
 *
 * @param content - Text to scan
 * @param config - Scanning configuration
 * @returns Scan results with PII findings
 *
 * @example
 * ```typescript
 * const result = await scanForPii(csvContent)
 * if (result.hasPii && result.riskLevel === 'HIGH') {
 *   console.warn('High-risk PII detected:', result.findings)
 * }
 * ```
 */
export async function scanForPii(
  content: string,
  config: DlpScanConfig = {}
): Promise<DlpScanResult> {
  const client = getDlpClient();

  // Build inspect config
  const inspectConfig: IInspectConfig = {
    infoTypes: config.infoTypes || HR_PII_INFO_TYPES,
    minLikelihood: config.minLikelihood || 'LIKELY',
    includeQuote: config.includeQuote || false,
    limits: {
      maxFindingsPerRequest: 100,
    },
  };

  try {
    const projectId = await client.getProjectId();

    const [response] = await client.inspectContent({
      parent: `projects/${projectId}`,
      inspectConfig,
      item: { value: content },
    });

    const findings = response.result?.findings || [];

    // Map findings to simplified format
    const simplifiedFindings = findings.map((finding: IFinding) => ({
      infoType: finding.infoType?.name || 'UNKNOWN',
      likelihood: String(finding.likelihood || 'UNKNOWN'),
      location: finding.location?.byteRange
        ? {
            byteRange: {
              start:
                finding.location.byteRange.start !== null &&
                finding.location.byteRange.start !== undefined
                  ? Number(finding.location.byteRange.start)
                  : undefined,
              end:
                finding.location.byteRange.end !== null &&
                finding.location.byteRange.end !== undefined
                  ? Number(finding.location.byteRange.end)
                  : undefined,
            },
          }
        : undefined,
      quote: config.includeQuote && finding.quote ? String(finding.quote) : undefined,
    }));

    // Calculate risk level based on findings
    const riskLevel = calculateRiskLevel(simplifiedFindings);

    return {
      hasPii: findings.length > 0,
      findingCount: findings.length,
      findings: simplifiedFindings,
      riskLevel,
    };
  } catch (error) {
    console.error('[DLP] Scan failed:', error);
    // Fail open: don't block operations if DLP is unavailable
    return {
      hasPii: false,
      findingCount: 0,
      findings: [],
      riskLevel: 'NONE',
    };
  }
}

/**
 * De-identify PII in text by replacing with info type labels
 *
 * @param content - Text to de-identify
 * @param infoTypes - Specific info types to redact (default: ALL_HR_PII)
 * @returns De-identified text
 *
 * @example
 * ```typescript
 * const sanitized = await deidentifyText(
 *   "Contact John Doe at john@example.com or 555-1234"
 * )
 * // Result: "Contact [PERSON_NAME] at [EMAIL_ADDRESS] or [PHONE_NUMBER]"
 * ```
 */
export async function deidentifyText(
  content: string,
  infoTypes: IInfoType[] = HR_PII_INFO_TYPES
): Promise<string> {
  const client = getDlpClient();

  const deidentifyConfig: IDeidentifyConfig = {
    infoTypeTransformations: {
      transformations: [
        {
          primitiveTransformation: {
            replaceWithInfoTypeConfig: {},
          },
        },
      ],
    },
  };

  try {
    const projectId = await client.getProjectId();

    const [response] = await client.deidentifyContent({
      parent: `projects/${projectId}`,
      deidentifyConfig,
      inspectConfig: {
        infoTypes,
      },
      item: { value: content },
    });

    return response.item?.value || content;
  } catch (error) {
    console.error('[DLP] De-identification failed:', error);
    // Fail open: return original content if DLP unavailable
    return content;
  }
}

/**
 * Redact PII by replacing with asterisks
 *
 * @param content - Text to redact
 * @param infoTypes - Specific info types to redact (default: ALL_HR_PII)
 * @returns Redacted text
 *
 * @example
 * ```typescript
 * const redacted = await redactPii(
 *   "SSN: 123-45-6789, Email: john@example.com"
 * )
 * // Result: "SSN: ***********, Email: *****************"
 * ```
 */
export async function redactPii(
  content: string,
  infoTypes: IInfoType[] = HR_PII_INFO_TYPES
): Promise<string> {
  const client = getDlpClient();

  const deidentifyConfig: IDeidentifyConfig = {
    infoTypeTransformations: {
      transformations: [
        {
          primitiveTransformation: {
            characterMaskConfig: {
              maskingCharacter: '*',
            },
          },
        },
      ],
    },
  };

  try {
    const projectId = await client.getProjectId();

    const [response] = await client.deidentifyContent({
      parent: `projects/${projectId}`,
      deidentifyConfig,
      inspectConfig: {
        infoTypes,
      },
      item: { value: content },
    });

    return response.item?.value || content;
  } catch (error) {
    console.error('[DLP] Redaction failed:', error);
    return content;
  }
}

/**
 * Scan and validate that content does NOT contain PII
 * Throws error if PII is found (use for audit logs, analytics, etc.)
 *
 * @param content - Content that should be PII-free
 * @param context - Context for error message
 * @throws Error if PII is detected
 *
 * @example
 * ```typescript
 * await validateNoPii(auditLogEntry, 'audit log')
 * // Throws if PII found, otherwise continues
 * ```
 */
export async function validateNoPii(content: string, context: string = 'content'): Promise<void> {
  const result = await scanForPii(content, {
    minLikelihood: 'POSSIBLE', // More sensitive for validation
    includeQuote: false, // Don't expose PII in error
  });

  if (result.hasPii) {
    throw new Error(
      `PII detected in ${context}: Found ${result.findingCount} instances of sensitive data (${result.findings.map((f) => f.infoType).join(', ')}). Risk level: ${result.riskLevel}`
    );
  }
}

/**
 * Calculate risk level based on findings
 */
function calculateRiskLevel(
  findings: Array<{ infoType: string; likelihood: string }>
): DlpScanResult['riskLevel'] {
  if (findings.length === 0) return 'NONE';

  // Critical: SSN, Credit Card, Medical records
  const criticalTypes = [
    'US_SOCIAL_SECURITY_NUMBER',
    'CREDIT_CARD_NUMBER',
    'MEDICAL_RECORD_NUMBER',
  ];
  const hasCritical = findings.some((f) => criticalTypes.includes(f.infoType));
  if (hasCritical) return 'CRITICAL';

  // High: Financial info, passport, driver's license
  const highTypes = [
    'US_BANK_ROUTING_MICR',
    'IBAN_CODE',
    'US_PASSPORT',
    'US_DRIVERS_LICENSE_NUMBER',
  ];
  const hasHigh = findings.some((f) => highTypes.includes(f.infoType));
  if (hasHigh) return 'HIGH';

  // Medium: Multiple findings or very likely findings
  const veryLikelyFindings = findings.filter((f) => f.likelihood === 'VERY_LIKELY');
  if (findings.length > 5 || veryLikelyFindings.length > 2) return 'MEDIUM';

  // Low: Few findings
  return 'LOW';
}

/**
 * Check if DLP is available and configured
 */
export async function isDlpAvailable(): Promise<boolean> {
  try {
    const client = getDlpClient();
    await client.getProjectId();
    return true;
  } catch (error) {
    console.warn('[DLP] Not available:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Get DLP-specific info types for certain contexts
 */
export const DLP_INFO_TYPE_PRESETS = {
  /** Critical financial PII only */
  FINANCIAL: [
    { name: 'US_SOCIAL_SECURITY_NUMBER' },
    { name: 'CREDIT_CARD_NUMBER' },
    { name: 'US_BANK_ROUTING_MICR' },
    { name: 'IBAN_CODE' },
  ] as IInfoType[],

  /** Contact information only */
  CONTACT: [
    { name: 'EMAIL_ADDRESS' },
    { name: 'PHONE_NUMBER' },
    { name: 'STREET_ADDRESS' },
  ] as IInfoType[],

  /** Identity documents */
  IDENTITY: [
    { name: 'US_SOCIAL_SECURITY_NUMBER' },
    { name: 'US_DRIVERS_LICENSE_NUMBER' },
    { name: 'US_PASSPORT' },
  ] as IInfoType[],

  /** Protected class information (EEOC) */
  PROTECTED_CLASS: [
    { name: 'ETHNIC_GROUP' },
    { name: 'GENDER' },
    { name: 'DATE_OF_BIRTH' },
  ] as IInfoType[],

  /** All HR-relevant PII */
  ALL_HR_PII: HR_PII_INFO_TYPES,
};
