import { type NextRequest, NextResponse } from 'next/server';
import { handleApiError, validateRequiredFields } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { actionExecutor } from '@/lib/workflows/actions/executor';
import { registerDocumentHandler } from '@/lib/workflows/actions/handlers/document-handler';
import type {
  ActionContext,
  ActionExecutionOptions,
  ActionType,
  BaseAction,
  BatchActionRequest,
} from '@/lib/workflows/actions/types';

// Register handlers on module load
registerDocumentHandler(actionExecutor);

/**
 * POST /api/actions
 *
 * Execute a single workflow action
 *
 * Request body:
 * {
 *   action: BaseAction,
 *   options?: ActionExecutionOptions
 * }
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const body = await request.json();
    const { action, conversationId, workflowId, options } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['action']);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${validation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Build execution context
    const context: ActionContext = {
      userId: authResult.user.userId,
      conversationId: conversationId || 'unknown',
      workflowId: workflowId || 'unknown',
      userPermissions: ['*:*'], // Single admin user has all permissions
    };

    // Execute action
    const result = await actionExecutor.execute(
      action as BaseAction,
      context,
      options as ActionExecutionOptions
    );

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      endpoint: '/api/actions',
      method: 'POST',
      userId: authResult.user.userId,
    });
  }
}

/**
 * POST /api/actions/batch
 *
 * Execute multiple actions in batch
 */
export async function PUT(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const body = await request.json();
    const { actions, conversationId, workflowId, options, sequential } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['actions']);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${validation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(actions)) {
      return NextResponse.json(
        { success: false, error: 'Actions must be an array' },
        { status: 400 }
      );
    }

    // Build execution context
    const context: ActionContext = {
      userId: authResult.user.userId,
      conversationId: conversationId || 'unknown',
      workflowId: workflowId || 'unknown',
      userPermissions: ['*:*'], // Single admin user has all permissions
    };

    // Execute batch
    const batchRequest: BatchActionRequest = {
      actions: actions as BaseAction[],
      context,
      options: options as ActionExecutionOptions,
      sequential: sequential ?? false,
    };

    const result = await actionExecutor.executeBatch(batchRequest);

    return NextResponse.json({
      success: result.failureCount === 0,
      result,
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      endpoint: '/api/actions/batch',
      method: 'PUT',
      userId: authResult.user.userId,
    });
  }
}

/**
 * GET /api/actions/history
 *
 * Get action execution history
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('actionType');
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status') as 'success' | 'failure' | null;

    // Get history with filters
    const history = actionExecutor.getHistory({
      actionType: (actionType as ActionType) || undefined,
      userId: authResult.user.userId,
      workflowId: workflowId || undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      endpoint: '/api/actions/history',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
