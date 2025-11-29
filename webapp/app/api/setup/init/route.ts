/**
 * Initialization API Endpoint
 *
 * Handles first-run initialization and status checks.
 * Automatically seeds demo data if the database is empty.
 *
 * GET  /api/setup/init - Check initialization status
 * POST /api/setup/init - Trigger initialization
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { handleApiError } from '@/lib/api-helpers';
import { checkFirstRun, getInitializationProgress } from '@/lib/first-run';

const execAsync = promisify(exec);

/**
 * GET - Check initialization status
 */
export async function GET(_request: NextRequest) {
  try {
    const status = await checkFirstRun();
    const progress = await getInitializationProgress();

    return NextResponse.json({
      success: true,
      ...status,
      progress,
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/setup/init',
      method: 'GET',
    });
  }
}

/**
 * POST - Trigger initialization (seed demo data)
 */
export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json().catch(() => ({}));

    console.log('[Setup] Starting initialization...');

    // Check current status
    const status = await checkFirstRun();

    if (!status.needsInitialization && !force) {
      return NextResponse.json({
        success: true,
        message: 'Already initialized',
        skipped: true,
        ...status,
      });
    }

    console.log('[Setup] Running demo data seeding script...');

    // Run the seeding script
    const seedCommand = force ? 'npm run seed:demo -- --force' : 'npm run seed:demo';

    try {
      const { stdout, stderr } = await execAsync(seedCommand, {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });

      console.log('[Setup] Seeding output:', stdout);
      if (stderr) console.error('[Setup] Seeding errors:', stderr);

      // Verify initialization
      const newStatus = await checkFirstRun();
      const progress = await getInitializationProgress();

      return NextResponse.json({
        success: true,
        message: 'Initialization complete',
        initialized: true,
        ...newStatus,
        progress,
        output: stdout,
      });
    } catch (execError: unknown) {
      console.error('[Setup] Failed to run seeding script:', execError);

      // Return error but with helpful message
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to seed demo data',
          details: execError instanceof Error ? execError.message : 'Unknown error',
          hint: 'You can manually run: npm run seed:demo',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/setup/init',
      method: 'POST',
    });
  }
}

/**
 * DELETE - Reset initialization (for testing)
 * WARNING: This will clear all employee and conversation data!
 */
export async function DELETE(_request: NextRequest) {
  // Only allow in development
  if (env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Reset not allowed in production',
      },
      { status: 403 }
    );
  }

  try {
    console.log('[Setup] Resetting initialization...');

    // Run seeding with force flag to clear data
    const { stdout, stderr } = await execAsync('npm run seed:demo -- --force', {
      cwd: process.cwd(),
      timeout: 60000,
    });

    console.log('[Setup] Reset output:', stdout);
    if (stderr) console.error('[Setup] Reset errors:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Initialization reset complete',
      output: stdout,
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/setup/init',
      method: 'DELETE',
    });
  }
}
