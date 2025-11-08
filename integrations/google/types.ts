export interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  calendarId?: string;
}

export interface EmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: boolean;
  from?: string;
}

export interface GoogleUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  orgUnitPath?: string;
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
