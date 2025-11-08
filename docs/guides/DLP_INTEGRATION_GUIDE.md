# Google Cloud DLP Integration Guide

> **Protect sensitive HR data with automated PII detection and de-identification**

## Overview

This HR Command Center platform now includes Google Cloud Data Loss Prevention (DLP) API integration to automatically detect, redact, and protect personally identifiable information (PII) in:

- **CSV file uploads** - Scan for SSN, credit cards, medical records before import
- **Audit logs** - Ensure logs never contain sensitive employee data
- **Chat context** (optional) - De-identify PII before sending to Claude API

---

## Benefits

### Security & Compliance
- ✅ Automatic detection of 15+ PII types (SSN, credit cards, phone numbers, etc.)
- ✅ GDPR compliance (identify and protect EU employee data)
- ✅ CCPA compliance (California privacy requirements)
- ✅ SOC 2 audit trail (document PII handling)
- ✅ Block critical PII uploads (SSN, credit cards, medical records)

### Risk Management
- ✅ Risk-level scoring (NONE, LOW, MEDIUM, HIGH, CRITICAL)
- ✅ Automatic alerts when critical PII detected
- ✅ Audit logging of all PII detection events
- ✅ Configurable de-identification for external APIs

### Cost-Effective
- ✅ **FREE tier**: First GB/month included
- ✅ ~$0.03/month estimated cost for typical HR platform usage
- ✅ No additional infrastructure required

---

## Setup Instructions

### 1. Enable DLP API in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one): `HRCommandCenter`
3. Navigate to **APIs & Services** > **Library**
4. Search for "**Data Loss Prevention**"
5. Click **Enable** (you've already done this!)

### 2. Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `dlp-service-account`
4. Description: "DLP API access for HR Command Center"
5. Click **Create and Continue**

### 3. Grant DLP Permissions

1. Add role: **DLP Administrator** (or **DLP User** for read-only scanning)
2. Click **Continue** > **Done**

### 4. Download Service Account Key

1. Click on your new service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create** (downloads JSON file)
6. **Save this file securely** (never commit to git!)

### 5. Configure Environment Variables

```bash
# Add to your .env.local file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Optional: Enable chat de-identification (see notes below)
NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=false
```

**Important:** Add the service account JSON file to `.gitignore`:

```bash
# .gitignore
*.json
!package.json
!tsconfig.json
```

### 6. Verify Setup

Run the DLP integration test:

```bash
cd /Users/mattod/Desktop/HRSkills
npx tsx tests/dlp-integration/test-dlp-setup.ts
```

**Expected output:**
```
🧪 Testing Google Cloud DLP Integration

Test 1: Checking DLP availability...
✅ DLP API is available

Test 2: Scanning sample text for PII...
   Found 5 PII instances
   Risk Level: CRITICAL
   Detected types:
   - PERSON_NAME: John Doe (VERY_LIKELY)
   - EMAIL_ADDRESS: john.doe@example.com (VERY_LIKELY)
   - PHONE_NUMBER: (555) 123-4567 (LIKELY)
   - US_SOCIAL_SECURITY_NUMBER: 123-45-6789 (VERY_LIKELY)
   - DATE_OF_BIRTH: 01/15/1985 (LIKELY)
✅ PII detection working

...

✅ All DLP tests passed!
```

---

## How It Works

### 1. CSV Upload Scanning

**Location:** `/webapp/app/api/data/upload/route.ts:133-189`

When a CSV file is uploaded:

1. **Sample scan**: First 100 rows scanned for critical PII (SSN, credit cards)
2. **Risk assessment**: Assigned NONE/LOW/MEDIUM/HIGH/CRITICAL
3. **Audit logging**: PII detection events logged to security audit
4. **Blocking**: CRITICAL risk uploads are rejected with error message
5. **Warning**: Other PII types shown as warnings (but allowed)

**Blocked PII types (CRITICAL):**
- US Social Security Numbers
- Credit card numbers
- Medical record numbers

**Warned PII types (allowed but flagged):**
- Email addresses
- Phone numbers
- Dates of birth
- Person names
- Street addresses
- Driver's license numbers

**Example warning:**
```
⚠️ SECURITY: Detected 3 instances of sensitive PII (EMAIL_ADDRESS, PHONE_NUMBER).
Risk level: LOW. This data will be stored securely and not sent to external APIs.
```

### 2. Audit Log Validation

**Location:** `/webapp/lib/security/audit-logger.ts:98-131`

Before writing to audit logs:

1. **PII scan**: Every log entry scanned for accidental PII
2. **Redaction**: If PII detected, entry is redacted before logging
3. **Alert**: Security alert logged to console for investigation
4. **Compliance**: Ensures logs never expose sensitive employee data

**Example alert:**
```
🚨 [SECURITY] PII detected in audit log entry!
EventType: data.create
Error: PII detected in audit log entry: Found 1 instances of sensitive data (EMAIL_ADDRESS)
```

### 3. Chat De-identification (Optional)

**Location:** `/webapp/app/api/chat/route.ts:389-402`

Optionally de-identify employee context before sending to Claude:

**When enabled** (`NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=true`):
- Employee data transformed: "john@example.com" → "[EMAIL_ADDRESS]"
- Reduces risk if Claude API compromised
- May reduce Claude's accuracy for specific employee questions

**When disabled** (default):
- Full employee context sent to Claude
- Maximum accuracy for HR questions
- Standard Anthropic security applies

**Recommendation:** Keep disabled unless:
- Handling extremely sensitive data (medical records, financial info)
- Required by compliance policies (HIPAA, FINRA)
- Operating in highly regulated industry

---

## Configuration Options

### DLP Info Type Presets

Pre-configured PII detection profiles:

```typescript
import { DLP_INFO_TYPE_PRESETS } from '@/lib/security/dlp-service'

// Financial PII only (SSN, credit cards, bank accounts)
DLP_INFO_TYPE_PRESETS.FINANCIAL

// Contact information (email, phone, address)
DLP_INFO_TYPE_PRESETS.CONTACT

// Identity documents (SSN, driver's license, passport)
DLP_INFO_TYPE_PRESETS.IDENTITY

// Protected class info (ethnicity, gender, DOB)
DLP_INFO_TYPE_PRESETS.PROTECTED_CLASS

// All HR-relevant PII (default)
DLP_INFO_TYPE_PRESETS.ALL_HR_PII
```

### Scan Configuration

```typescript
import { scanForPii } from '@/lib/security/dlp-service'

const result = await scanForPii(content, {
  infoTypes: DLP_INFO_TYPE_PRESETS.FINANCIAL,
  minLikelihood: 'LIKELY', // VERY_UNLIKELY | UNLIKELY | POSSIBLE | LIKELY | VERY_LIKELY
  includeQuote: false, // Don't expose PII in results
})
```

### Risk Levels

Automatic risk scoring based on PII types found:

- **NONE** - No PII detected
- **LOW** - Few basic PII (email, phone)
- **MEDIUM** - Multiple PII or very likely findings
- **HIGH** - Financial info (bank routing, IBAN), documents (passport, DL)
- **CRITICAL** - SSN, credit cards, medical records

---

## API Reference

### `scanForPii(content, config?)`

Scan text for PII.

```typescript
const result = await scanForPii(csvContent)

if (result.hasPii && result.riskLevel === 'CRITICAL') {
  console.error('Critical PII detected!', result.findings)
}
```

### `deidentifyText(content, infoTypes?)`

Replace PII with info type labels.

```typescript
const sanitized = await deidentifyText(
  "Contact John at john@example.com"
)
// Result: "Contact [PERSON_NAME] at [EMAIL_ADDRESS]"
```

### `redactPii(content, infoTypes?)`

Replace PII with asterisks.

```typescript
const redacted = await redactPii(
  "SSN: 123-45-6789"
)
// Result: "SSN: ***********"
```

### `validateNoPii(content, context)`

Throw error if PII detected (for validation).

```typescript
await validateNoPii(auditLogEntry, 'audit log')
// Throws if PII found
```

### `isDlpAvailable()`

Check if DLP API is configured.

```typescript
if (await isDlpAvailable()) {
  console.log('DLP enabled')
}
```

---

## Cost Analysis

### DLP API Pricing

- **FREE tier:** 0 - 1 GB/month = $0.00
- **Tier 1:** 1+ GB/month = $3.00/GB

### Estimated Usage

**Your HR platform:**
- master-employees.json: ~2MB = 0.002 GB
- CSV uploads: ~10 uploads/month × 2MB = 0.02 GB
- Chat context scans: ~1000 chats/month × 10KB = 0.01 GB
- Audit log validation: ~5000 logs/month × 1KB = 0.005 GB

**Total: ~0.037 GB/month = FREE**

You'll stay well within the free tier unless processing massive volumes (100k+ employees or 1000+ uploads/month).

---

## Troubleshooting

### "DLP is not available"

**Check:**
1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable set
2. Service account JSON file exists at specified path
3. DLP API enabled in Google Cloud Console
4. Service account has DLP permissions

**Test:**
```bash
# Verify credentials file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Test DLP availability
npx tsx tests/dlp-integration/test-dlp-setup.ts
```

### "Permission denied"

Service account needs **DLP Administrator** or **DLP User** role.

**Fix:**
1. Go to Google Cloud Console > IAM
2. Find your service account
3. Click **Edit**
4. Add role: **DLP Administrator**

### "Quota exceeded"

You've exceeded the free tier (1GB/month).

**Fix:**
1. Monitor usage in Google Cloud Console
2. Reduce scan frequency (only scan first 100 rows of large files)
3. Disable chat de-identification if enabled
4. Enable billing if needed (still very cheap)

### DLP not detecting PII

**Check:**
1. `minLikelihood` threshold (try `POSSIBLE` instead of `LIKELY`)
2. Info types specified (try `ALL_HR_PII` preset)
3. Content format (DLP works best with plain text)

**Example:**
```typescript
// More sensitive detection
const result = await scanForPii(content, {
  infoTypes: DLP_INFO_TYPE_PRESETS.ALL_HR_PII,
  minLikelihood: 'POSSIBLE', // Lower threshold
  includeQuote: true, // See what was detected
})
```

---

## Best Practices

### 1. Progressive Rollout

Start with strict scanning, then adjust:

1. **Week 1:** Monitor only (log PII detections, don't block)
2. **Week 2:** Warn users about PII (show warnings)
3. **Week 3:** Block critical PII uploads (SSN, credit cards)
4. **Week 4:** Expand to all PII types as needed

### 2. User Communication

When blocking uploads, provide helpful error messages:

```
Upload blocked: File contains Social Security Numbers.

Please remove SSNs before uploading. Acceptable alternatives:
- Use employee IDs instead of SSNs
- Remove SSN column entirely
- Upload file without SSN data
```

### 3. Audit Logging

Log all DLP events for compliance:

```typescript
await logAudit({
  action: 'data_upload_pii_detected',
  userId: user.userId,
  resourceType: 'csv_upload',
  details: {
    fileName: 'employees.csv',
    riskLevel: 'HIGH',
    piiTypes: 'SSN, PHONE_NUMBER',
  },
})
```

### 4. Regular Reviews

- **Monthly:** Review DLP detection logs for false positives
- **Quarterly:** Update info type presets based on findings
- **Annually:** Review compliance requirements and adjust scanning

### 5. Performance Optimization

For large files (1000+ rows):

- Only scan first 100-500 rows (sample)
- Use specific info types (not ALL_HR_PII)
- Cache scan results for 5 minutes
- Run scans asynchronously

---

## Compliance Scenarios

### GDPR Compliance

**Requirements:**
- Identify all PII in employee data
- Document PII handling in privacy policy
- Support data export and deletion requests

**DLP Solution:**
```typescript
// Scan for EU-specific PII
const euScan = await scanForPii(employeeData, {
  infoTypes: [
    { name: 'EMAIL_ADDRESS' },
    { name: 'PHONE_NUMBER' },
    { name: 'STREET_ADDRESS' },
    { name: 'IBAN_CODE' },
  ],
})
```

### CCPA Compliance

**Requirements:**
- Disclose PII categories collected
- Allow CA residents to request deletion

**DLP Solution:**
```typescript
// Generate PII report for CCPA disclosure
const piiCategories = scanResult.findings.map(f => f.infoType)
console.log('PII categories:', [...new Set(piiCategories)])
```

### SOC 2 Audit

**Requirements:**
- Demonstrate PII handling controls
- Audit trail of sensitive data access

**DLP Solution:**
- All PII detections logged to audit trail
- Risk levels documented automatically
- Blocked uploads prevent unauthorized data ingestion

---

## Next Steps

1. ✅ **Verify setup:** Run `npx tsx tests/dlp-integration/test-dlp-setup.ts`
2. **Test CSV upload:** Upload a file with test PII (use dummy SSN like 123-45-6789)
3. **Review audit logs:** Check `/logs/security/` for PII detection events
4. **Configure risk thresholds:** Adjust what PII types to block vs. warn
5. **Document for compliance:** Add DLP to security documentation

---

## Support & Resources

**Documentation:**
- [Google DLP API Docs](https://cloud.google.com/dlp/docs)
- [Info Types Reference](https://cloud.google.com/dlp/docs/infotypes-reference)
- [DLP Best Practices](https://cloud.google.com/dlp/docs/best-practices)

**Code Examples:**
- `/webapp/lib/security/dlp-service.ts` - Core DLP utilities
- `/webapp/app/api/data/upload/route.ts:133-189` - CSV scanning
- `/webapp/lib/security/audit-logger.ts:98-131` - Log validation
- `/tests/dlp-integration/test-dlp-setup.ts` - Integration tests

**Support:**
- File issues in GitHub repository
- Contact security team for compliance questions
- Review Google Cloud DLP quotas and pricing

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0
