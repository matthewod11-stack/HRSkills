/**
 * Audit Logging System
 *
 * Tracks security-sensitive operations for compliance and forensics
 * Logs authentication attempts, data access, modifications, and security events
 */

import { NextRequest } from 'next/server';
import { AuthUser } from '@/lib/auth/types';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import path from 'path';

export type AuditEventType =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.token.refresh'
  | 'auth.unauthorized'
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'upload.file'
  | 'upload.rejected'
  | 'security.rate_limit'
  | 'security.input_validation_failed'
  | 'security.permission_denied'
  | 'api.error'
  | 'api.request';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  message?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

const AUDIT_LOG_DIR = path.join(process.cwd(), '..', 'logs', 'audit');
const SECURITY_LOG_DIR = path.join(process.cwd(), '..', 'logs', 'security');

/**
 * Ensure log directories exist
 */
async function ensureLogDirectories(): Promise<void> {
  try {
    await mkdir(AUDIT_LOG_DIR, { recursive: true });
    await mkdir(SECURITY_LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create log directories:', error);
  }
}

/**
 * Get log file path based on date
 */
function getLogFilePath(type: 'audit' | 'security'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dir = type === 'audit' ? AUDIT_LOG_DIR : SECURITY_LOG_DIR;
  return path.join(dir, `${type}-${date}.log`);
}

/**
 * Format log entry as JSON string
 */
function formatLogEntry(entry: AuditLogEntry): string {
  return JSON.stringify(entry) + '\n';
}

/**
 * Write audit log entry
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  try {
    await ensureLogDirectories();

    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    const logLine = formatLogEntry(fullEntry);

    // Write to audit log
    const auditLogPath = getLogFilePath('audit');
    await appendFile(auditLogPath, logLine, 'utf-8');

    // Also write security-critical events to security log
    const criticalEvents: AuditEventType[] = [
      'auth.login.failure',
      'auth.unauthorized',
      'security.rate_limit',
      'security.permission_denied',
      'data.delete',
      'upload.rejected'
    ];

    if (criticalEvents.includes(entry.eventType) || entry.severity === 'critical' || entry.severity === 'error') {
      const securityLogPath = getLogFilePath('security');
      await appendFile(securityLogPath, logLine, 'utf-8');
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = entry.success ? '✅' : '❌';
      console.log(`${emoji} [AUDIT] ${entry.eventType}:`, entry.message || '', entry.metadata || '');
    }
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Extract request metadata for logging
 */
export function getRequestMetadata(request: NextRequest): {
  ip?: string;
  userAgent?: string;
  method: string;
  endpoint: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  return {
    ip,
    userAgent,
    method: request.method,
    endpoint: request.nextUrl.pathname
  };
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  type: Extract<AuditEventType, `auth.${string}`>,
  request: NextRequest,
  user?: AuthUser,
  success: boolean = true,
  message?: string
): Promise<void> {
  const requestMeta = getRequestMetadata(request);

  await logAuditEvent({
    eventType: type,
    severity: success ? 'info' : 'warning',
    userId: user?.userId,
    userEmail: user?.email,
    userRoles: user?.roles.map(r => r.name),
    sessionId: user?.sessionId,
    success,
    message,
    ...requestMeta
  });
}

/**
 * Log data access event
 */
export async function logDataAccess(
  action: 'read' | 'create' | 'update' | 'delete' | 'export',
  request: NextRequest,
  user: AuthUser,
  resource: string,
  success: boolean = true,
  metadata?: Record<string, any>
): Promise<void> {
  const requestMeta = getRequestMetadata(request);
  const eventType = `data.${action}` as AuditEventType;

  await logAuditEvent({
    eventType,
    severity: action === 'delete' ? 'warning' : 'info',
    userId: user.userId,
    userEmail: user.email,
    userRoles: user.roles.map(r => r.name),
    sessionId: user.sessionId,
    resource,
    action,
    success,
    metadata,
    ...requestMeta
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  type: Extract<AuditEventType, `security.${string}`>,
  request: NextRequest,
  message: string,
  user?: AuthUser,
  metadata?: Record<string, any>
): Promise<void> {
  const requestMeta = getRequestMetadata(request);

  await logAuditEvent({
    eventType: type,
    severity: 'warning',
    userId: user?.userId,
    userEmail: user?.email,
    userRoles: user?.roles.map(r => r.name),
    sessionId: user?.sessionId,
    success: false,
    message,
    metadata,
    ...requestMeta
  });
}

/**
 * Log API request (for general monitoring)
 */
export async function logApiRequest(
  request: NextRequest,
  statusCode: number,
  user?: AuthUser,
  metadata?: Record<string, any>
): Promise<void> {
  const requestMeta = getRequestMetadata(request);

  await logAuditEvent({
    eventType: 'api.request',
    severity: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info',
    userId: user?.userId,
    userEmail: user?.email,
    userRoles: user?.roles.map(r => r.name),
    sessionId: user?.sessionId,
    statusCode,
    success: statusCode < 400,
    metadata,
    ...requestMeta
  });
}

/**
 * Log file upload event
 */
export async function logFileUpload(
  request: NextRequest,
  user: AuthUser,
  fileName: string,
  fileSize: number,
  fileType: string,
  success: boolean = true,
  message?: string
): Promise<void> {
  const requestMeta = getRequestMetadata(request);

  await logAuditEvent({
    eventType: success ? 'upload.file' : 'upload.rejected',
    severity: success ? 'info' : 'warning',
    userId: user.userId,
    userEmail: user.email,
    userRoles: user.roles.map(r => r.name),
    sessionId: user.sessionId,
    success,
    message,
    metadata: {
      fileName,
      fileSize,
      fileType
    },
    ...requestMeta
  });
}

/**
 * Query audit logs (for admin dashboard)
 * In production, this should query a database or log aggregation service
 */
export async function queryAuditLogs(filters: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  // This is a placeholder. In production, implement proper log querying
  // Consider using a log aggregation service like ELK, Splunk, or CloudWatch
  return [];
}
