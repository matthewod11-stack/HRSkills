import { google } from 'googleapis';
import { googleClient } from './client';
import { CalendarEvent } from './types';

const calendar = google.calendar({ version: 'v3', auth: googleClient.getAuth() });

export async function createEvent(params: CalendarEvent) {
  const event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime,
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: params.endTime,
      timeZone: 'America/Los_Angeles'
    },
    attendees: params.attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: { requestId: `${Date.now()}` }
    }
  };

  return await calendar.events.insert({
    calendarId: params.calendarId || 'primary',
    requestBody: event,
    conferenceDataVersion: 1
  });
}

export async function checkAvailability(
  email: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime,
      timeMax: endTime,
      items: [{ id: email }]
    }
  });

  const busy = response.data.calendars?.[email]?.busy || [];
  return busy.length === 0;
}
