/**
 * Google Workspace Type Definitions
 *
 * Consolidated types for all Google Workspace APIs:
 * - Drive
 * - Docs
 * - Sheets
 * - Gmail
 * - Calendar
 */

// Calendar types
export interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  calendarId?: string;
}

// Gmail types
export interface EmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: boolean;
  from?: string;
}

// Drive types
export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
  createdTime?: string | null;
  modifiedTime?: string | null;
}

export interface FileUploadOptions {
  fileName: string;
  mimeType: string;
  content: string | NodeJS.ReadableStream;
  folderId?: string;
}

// Google Docs types
export interface GoogleDocRequest {
  title: string;
  content: string; // markdown content
  folderId?: string;
}

export interface GoogleDocResponse {
  documentId: string;
  title: string;
  webViewLink: string;
  editLink: string;
}

// Template types
export interface DriveTemplate {
  id: string;
  name: string;
  skillName: string;
  content?: string;
  webViewLink?: string;
}

export interface SkillTemplates {
  skillName: string;
  templates: Record<string, string>; // Map of template name to content
}
