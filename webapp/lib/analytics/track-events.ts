/**
 * Vercel Analytics Custom Event Tracking
 *
 * Tracks HR-specific user interactions for product insights
 * Events are sent to Vercel Analytics dashboard when enabled
 *
 * @see https://vercel.com/docs/analytics/custom-events
 */

import { track } from '@vercel/analytics';
import { env } from '@/env.mjs';

/**
 * Check if analytics is enabled
 */
function isAnalyticsEnabled(): boolean {
  return env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED;
}

/**
 * Custom event types for HR Command Center
 */
export type CustomEventName =
  // Chat Events
  | 'chat_message_sent'
  | 'skill_triggered'
  | 'context_panel_opened'
  | 'chat_error'

  // Analytics Events
  | 'analytics_query_run'
  | 'analytics_export'
  | 'dashboard_loaded'

  // Employee Management Events
  | 'employee_searched'
  | 'employee_viewed'
  | 'employee_created'
  | 'employee_updated'

  // Document Events
  | 'document_uploaded'
  | 'document_downloaded'
  | 'template_generated'

  // Authentication Events
  | 'user_login'
  | 'user_logout'
  | 'api_rate_limited';

/**
 * Event properties for detailed tracking
 */
export interface EventProperties {
  // Skill information
  skillName?: string;
  skillCategory?: string;

  // Context panel information
  panelType?: string;
  detectionConfidence?: number;

  // Analytics information
  queryType?: string;
  exportFormat?: string;
  resultCount?: number;

  // Employee information
  searchQuery?: string;
  employeeId?: string;
  department?: string;

  // Document information
  fileType?: string;
  fileSize?: number;
  templateType?: string;

  // Error information
  errorType?: string;
  errorMessage?: string;

  // Performance information
  duration?: number;
  apiProvider?: 'anthropic' | 'openai' | 'google';

  // General metadata
  [key: string]: string | number | boolean | undefined;
}

/**
 * Filter out undefined values from properties
 */
function cleanProperties(
  properties?: EventProperties
): Record<string, string | number | boolean> | undefined {
  if (!properties) return undefined;

  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/**
 * Track a custom event
 *
 * @example
 * ```ts
 * trackEvent('skill_triggered', { skillName: 'employee-search', skillCategory: 'data' });
 * trackEvent('analytics_query_run', { queryType: 'headcount', duration: 45 });
 * trackEvent('context_panel_opened', { panelType: 'employee-profile', detectionConfidence: 0.85 });
 * ```
 */
export function trackEvent(eventName: CustomEventName, properties?: EventProperties): void {
  if (!isAnalyticsEnabled()) {
    // Silent no-op in development or when analytics disabled
    return;
  }

  try {
    const cleanedProperties = cleanProperties(properties);
    track(eventName, cleanedProperties);
  } catch (error) {
    // Don't throw errors for analytics failures
    console.error('[Analytics] Failed to track event:', eventName, error);
  }
}

/**
 * Track chat message submission
 */
export function trackChatMessage(skillName?: string, aiProvider?: string): void {
  trackEvent('chat_message_sent', {
    skillName,
    apiProvider: aiProvider as 'anthropic' | 'openai' | 'google',
  });
}

/**
 * Track skill trigger
 */
export function trackSkillTrigger(skillName: string, category?: string): void {
  trackEvent('skill_triggered', {
    skillName,
    skillCategory: category,
  });
}

/**
 * Track context panel open
 */
export function trackContextPanel(panelType: string, confidence: number): void {
  trackEvent('context_panel_opened', {
    panelType,
    detectionConfidence: confidence,
  });
}

/**
 * Track analytics query execution
 */
export function trackAnalyticsQuery(
  queryType: string,
  resultCount: number,
  duration: number
): void {
  trackEvent('analytics_query_run', {
    queryType,
    resultCount,
    duration,
  });
}

/**
 * Track employee search
 */
export function trackEmployeeSearch(query: string, resultCount: number): void {
  trackEvent('employee_searched', {
    searchQuery: query,
    resultCount,
  });
}

/**
 * Track document operations
 */
export function trackDocumentUpload(fileType: string, fileSize: number): void {
  trackEvent('document_uploaded', {
    fileType,
    fileSize,
  });
}

export function trackDocumentDownload(fileType: string): void {
  trackEvent('document_downloaded', {
    fileType,
  });
}

export function trackTemplateGeneration(templateType: string, duration: number): void {
  trackEvent('template_generated', {
    templateType,
    duration,
  });
}

/**
 * Track errors
 */
export function trackChatError(errorType: string, errorMessage: string): void {
  trackEvent('chat_error', {
    errorType,
    errorMessage,
  });
}

/**
 * Track rate limiting
 */
export function trackRateLimit(endpoint: string): void {
  trackEvent('api_rate_limited', {
    errorType: 'rate_limit',
    errorMessage: `Rate limit exceeded for ${endpoint}`,
  });
}

/**
 * Track authentication events
 */
export function trackLogin(method: 'jwt' | 'google' | 'demo'): void {
  trackEvent('user_login', {
    skillCategory: method, // Reuse skillCategory for auth method
  });
}

export function trackLogout(): void {
  trackEvent('user_logout');
}
