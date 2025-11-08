# Google Cloud DLP Integration - Setup Complete! 🎉

Your HR Command Center now has comprehensive PII protection powered by Google Cloud Data Loss Prevention API.

---

## ✅ What's Been Installed

### 1. Core DLP Service (`/webapp/lib/security/dlp-service.ts`)
- ✅ `scanForPii()` - Detect 15+ PII types (SSN, credit cards, emails, etc.)
- ✅ `deidentifyText()` - Replace PII with labels like `[EMAIL_ADDRESS]`
- ✅ `redactPii()` - Replace PII with asterisks
- ✅ `validateNoPii()` - Throw error if PII detected
- ✅ `isDlpAvailable()` - Check DLP API status
- ✅ 5 pre-configured info type presets (FINANCIAL, CONTACT, IDENTITY, etc.)
- ✅ Automatic risk level scoring (NONE → CRITICAL)

### 2. CSV Upload Protection (`/webapp/app/api/data/upload/route.ts`)
- ✅ Scans first 100 rows for critical PII (SSN, credit cards, medical records)
- ✅ Blocks CRITICAL risk uploads (SSN, credit cards)
- ✅ Warns about other PII types (email, phone, etc.)
- ✅ Logs all PII detection events to security audit
- ✅ Risk-level assessment for each upload

### 3. Audit Log Validation (`/webapp/lib/security/audit-logger.ts`)
- ✅ Scans every audit log entry for accidental PII
- ✅ Automatically redacts PII before logging
- ✅ Alerts security team if PII detected in logs
- ✅ Ensures compliance: logs never expose sensitive data

### 4. Chat De-identification (Optional) (`/webapp/app/api/chat/route.ts`)
- ✅ Configurable via `NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=true`
- ✅ De-identifies employee context before sending to Claude
- ✅ Reduces risk if Claude API compromised
- ✅ **Default: disabled** (for maximum accuracy)

### 5. Documentation & Testing
- ✅ Comprehensive setup guide: `/docs/guides/DLP_INTEGRATION_GUIDE.md`
- ✅ Integration test script: `/tests/dlp-integration/test-dlp-setup.ts`
- ✅ Updated `claude.md` with DLP configuration
- ✅ Environment variables documented

---

## 🚀 Next Steps: Complete Setup

### Step 1: Create Google Cloud Service Account

You've enabled the DLP API. Now create credentials:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account:**
   - Name: `dlp-service-account`
   - Role: **DLP Administrator** (or **DLP User** for read-only)

3. **Download JSON Key:**
   - Click on service account
   - Go to **Keys** tab
   - **Add Key** → **Create new key** → **JSON**
   - Save file to: `/Users/mattod/Desktop/HRSkills/google-credentials/dlp-service-account.json`

4. **Secure the file:**
   ```bash
   chmod 600 /Users/mattod/Desktop/HRSkills/google-credentials/dlp-service-account.json
   ```

### Step 2: Set Environment Variable

Add to your `.env.local`:

```bash
# Google Cloud DLP API
GOOGLE_APPLICATION_CREDENTIALS=/Users/mattod/Desktop/HRSkills/google-credentials/dlp-service-account.json

# Optional: Enable chat de-identification (default: false)
NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=false
```

### Step 3: Verify Setup

Run the integration test:

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
✅ PII detection working

...

✅ All DLP tests passed!
```

### Step 4: Test with Real Data

1. **Start your dev server:**
   ```bash
   cd webapp
   npm run dev
   ```

2. **Upload a test CSV:**
   - Create a file with test PII (use dummy SSN: 123-45-6789)
   - Go to http://localhost:3000
   - Click **Data Sources** → **Upload**
   - Upload the file

3. **Check results:**
   - Should show warning: `⚠️ SECURITY: Detected X instances of sensitive PII`
   - If CRITICAL risk (SSN, credit card): Upload will be blocked
   - Check `/logs/security/` for audit events

---

## 📖 Features in Action

### CSV Upload Scanning

**What you'll see when uploading a file with PII:**

```
⚠️ SECURITY: Detected 3 instances of sensitive PII (EMAIL_ADDRESS, PHONE_NUMBER).
Risk level: LOW. This data will be stored securely and not sent to external APIs.
```

**If file contains SSN or credit cards:**

```
❌ Upload blocked: File contains critical PII that should not be uploaded to this system

Detected US_SOCIAL_SECURITY_NUMBER, CREDIT_CARD_NUMBER.
Please remove sensitive data before uploading.
```

### Audit Log Protection

**If PII accidentally gets into a log:**

```
🚨 [SECURITY] PII detected in audit log entry!
EventType: data.create
Error: PII detected: Found 1 instances of sensitive data (EMAIL_ADDRESS). Risk level: LOW
```

Log entry is automatically redacted to:
```json
{
  "message": "[REDACTED - PII detected]",
  "metadata": { "error": "PII detected in original log entry" }
}
```

### Chat De-identification (Optional)

**When enabled (`NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=true`):**

Original context:
```
Employee: John Doe, john@example.com, (555) 123-4567
Department: Engineering
```

De-identified context sent to Claude:
```
Employee: [PERSON_NAME], [EMAIL_ADDRESS], [PHONE_NUMBER]
Department: Engineering
```

---

## 💰 Cost Estimate

**DLP API Pricing:**
- FREE tier: 0-1 GB/month
- Your usage: ~0.037 GB/month

**Breakdown:**
- master-employees.json scans: ~0.002 GB/month
- CSV uploads (10/month): ~0.02 GB/month
- Chat context (1000 chats/month): ~0.01 GB/month
- Audit logs (5000/month): ~0.005 GB/month

**Monthly cost: $0.00** (FREE tier)

You'll stay free unless you process:
- 50+ GB of data/month
- 100k+ employees
- 1000+ CSV uploads/month

---

## 🔒 Security Benefits

### Compliance Ready
- ✅ **GDPR**: Identify and protect EU employee PII
- ✅ **CCPA**: Track and delete CA resident data
- ✅ **SOC 2**: Audit trail of PII handling
- ✅ **HIPAA**: (If needed) Block medical records from uploads

### Risk Mitigation
- ✅ Prevent accidental SSN/credit card uploads
- ✅ Ensure logs never expose sensitive data
- ✅ Reduce risk of Claude API exposure (optional de-identification)
- ✅ Automatic risk scoring and alerting

### Audit & Visibility
- ✅ All PII detections logged to security audit
- ✅ Risk levels documented (NONE → CRITICAL)
- ✅ Detailed findings (what PII, where, likelihood)
- ✅ Compliance-ready reporting

---

## 📚 Documentation

**Main guide:**
- `/docs/guides/DLP_INTEGRATION_GUIDE.md` - Complete setup & usage guide

**Code reference:**
- `/webapp/lib/security/dlp-service.ts` - Core DLP utilities
- `/webapp/app/api/data/upload/route.ts:133-189` - CSV scanning implementation
- `/webapp/lib/security/audit-logger.ts:98-131` - Audit log validation
- `/webapp/app/api/chat/route.ts:389-402` - Chat de-identification

**Testing:**
- `/tests/dlp-integration/test-dlp-setup.ts` - Integration test script

---

## ⚙️ Configuration Options

### DLP Info Type Presets

```typescript
import { DLP_INFO_TYPE_PRESETS } from '@/lib/security/dlp-service'

// Financial PII (SSN, credit cards, bank accounts)
DLP_INFO_TYPE_PRESETS.FINANCIAL

// Contact info (email, phone, address)
DLP_INFO_TYPE_PRESETS.CONTACT

// Identity documents (SSN, driver's license, passport)
DLP_INFO_TYPE_PRESETS.IDENTITY

// Protected class (ethnicity, gender, DOB)
DLP_INFO_TYPE_PRESETS.PROTECTED_CLASS

// All HR-relevant PII (default)
DLP_INFO_TYPE_PRESETS.ALL_HR_PII
```

### Risk Levels

Automatic scoring based on PII types:

- **NONE** - No PII detected
- **LOW** - Basic contact info (email, phone)
- **MEDIUM** - Multiple PII or high-confidence findings
- **HIGH** - Financial info, government IDs
- **CRITICAL** - SSN, credit cards, medical records

### Environment Variables

```bash
# Required: Service account credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Optional: Chat de-identification (default: false)
NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=false
```

---

## 🐛 Troubleshooting

### "DLP is not available"

**Check:**
1. `GOOGLE_APPLICATION_CREDENTIALS` set correctly
2. Service account JSON file exists
3. DLP API enabled in Google Cloud
4. Service account has DLP permissions

**Fix:**
```bash
# Verify file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Test setup
npx tsx tests/dlp-integration/test-dlp-setup.ts
```

### "Permission denied"

Service account needs **DLP Administrator** role.

**Fix:** Add role in Google Cloud Console → IAM

### DLP not detecting PII

Try more sensitive settings:

```typescript
const result = await scanForPii(content, {
  minLikelihood: 'POSSIBLE', // Lower threshold
  infoTypes: DLP_INFO_TYPE_PRESETS.ALL_HR_PII,
})
```

---

## 🎓 Best Practices

1. **Progressive Rollout**
   - Week 1: Monitor only (log detections)
   - Week 2: Show warnings to users
   - Week 3: Block critical PII
   - Week 4: Adjust based on feedback

2. **User Communication**
   - Provide helpful error messages
   - Explain why uploads are blocked
   - Suggest alternatives (use employee IDs instead of SSNs)

3. **Regular Reviews**
   - Monthly: Review detection logs for false positives
   - Quarterly: Update info type presets
   - Annually: Review compliance requirements

4. **Performance Optimization**
   - Only scan first 100-500 rows of large files
   - Use specific info types (not ALL_HR_PII)
   - Cache results for 5 minutes

---

## 🆘 Support

**Questions?**
- Check: `/docs/guides/DLP_INTEGRATION_GUIDE.md`
- Google DLP Docs: https://cloud.google.com/dlp/docs
- File GitHub issue for bugs

**Compliance Questions?**
- Review: Google DLP Best Practices
- Consult: Your legal/compliance team
- Document: All PII handling in privacy policy

---

**Status:** ✅ Integration Complete - Awaiting Service Account Setup

**Next:** Create service account → Set `GOOGLE_APPLICATION_CREDENTIALS` → Run test script

**Questions?** See `/docs/guides/DLP_INTEGRATION_GUIDE.md` for complete documentation.
