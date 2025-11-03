import { calendly } from './client';
import { SchedulingLink } from './types';

export async function createSchedulingLink(eventTypeUri: string): Promise<SchedulingLink> {
  return await calendly.request({
    method: 'POST',
    url: '/scheduling_links',
    data: {
      max_event_count: 1,
      owner: process.env.CALENDLY_DEFAULT_USER_URI,
      owner_type: 'EventType'
    }
  });
}

export async function getScheduledEvents(userUri: string) {
  return await calendly.request({
    method: 'GET',
    url: '/scheduled_events',
    params: {
      user: userUri,
      status: 'active'
    }
  });
}
