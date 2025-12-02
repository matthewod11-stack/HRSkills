import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { licenses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidLicenseKeyFormat, normalizeLicenseKey } from '@/lib/licensing/generate-key';

/**
 * License Validation API for Desktop App
 *
 * POST /api/license/validate
 * - Validates license key format
 * - Checks license exists and is active
 * - Handles device activation (single-device licensing)
 * - Returns license status and expiration
 */

const validateRequestSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  machineId: z.string().optional(), // Hardware fingerprint from desktop app
  activate: z.boolean().default(false), // Whether to activate on this device
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, machineId, activate } = validateRequestSchema.parse(body);

    // Normalize the license key
    const normalizedKey = normalizeLicenseKey(licenseKey);

    // Validate format first (fast check)
    if (!isValidLicenseKeyFormat(normalizedKey)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid license key format',
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // Look up license in database
    const license = await db.query.licenses.findFirst({
      where: (licenses, { eq }) => eq(licenses.licenseKey, normalizedKey),
    });

    // License not found
    if (!license) {
      return NextResponse.json(
        {
          valid: false,
          error: 'License key not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check license status
    if (license.status === 'revoked') {
      return NextResponse.json(
        {
          valid: false,
          error: 'License has been revoked',
          code: 'REVOKED',
        },
        { status: 403 }
      );
    }

    if (license.status === 'refunded') {
      return NextResponse.json(
        {
          valid: false,
          error: 'License has been refunded',
          code: 'REFUNDED',
        },
        { status: 403 }
      );
    }

    // Check expiration (for subscriptions)
    if (license.expiresAt) {
      const expiresAt = new Date(license.expiresAt);
      if (expiresAt < new Date()) {
        // Update status to expired
        await db
          .update(licenses)
          .set({ status: 'expired', updatedAt: new Date().toISOString() })
          .where(eq(licenses.id, license.id));

        return NextResponse.json(
          {
            valid: false,
            error: 'License has expired',
            code: 'EXPIRED',
            expiresAt: license.expiresAt,
          },
          { status: 403 }
        );
      }
    }

    // Handle device activation
    if (activate && machineId) {
      // Check if already activated on a different device
      if (license.machineId && license.machineId !== machineId) {
        return NextResponse.json(
          {
            valid: false,
            error: 'License is already activated on another device',
            code: 'ALREADY_ACTIVATED',
            hint: 'Contact support to transfer your license to a new device',
          },
          { status: 403 }
        );
      }

      // Activate on this device
      if (!license.machineId) {
        await db
          .update(licenses)
          .set({
            machineId,
            activationStatus: 'activated',
            activatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(licenses.id, license.id));

        console.log(`[License] Activated ${normalizedKey} on device ${machineId}`);
      }
    }

    // If machine ID provided but not activating, verify it matches
    if (machineId && license.machineId && license.machineId !== machineId) {
      return NextResponse.json(
        {
          valid: false,
          error: 'License is activated on a different device',
          code: 'WRONG_DEVICE',
          hint: 'Contact support to transfer your license',
        },
        { status: 403 }
      );
    }

    // License is valid
    return NextResponse.json({
      valid: true,
      license: {
        type: license.licenseType,
        status: license.status,
        activationStatus: license.activationStatus,
        expiresAt: license.expiresAt,
        activatedAt: license.activatedAt,
        customerEmail: license.customerEmail,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid request',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.error('[License] Validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
