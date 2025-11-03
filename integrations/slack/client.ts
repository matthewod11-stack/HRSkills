import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export class SlackClientWrapper {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  getClient(): WebClient {
    return this.client;
  }
}

// Singleton instance
export const slackClient = new SlackClientWrapper();
