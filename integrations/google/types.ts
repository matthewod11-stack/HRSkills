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
