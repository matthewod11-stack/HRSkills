export interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
}

export interface SchedulingLink {
  booking_url: string;
  owner: string;
  owner_type: string;
}
