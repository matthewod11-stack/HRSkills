export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  thread_ts?: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
}
