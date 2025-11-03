import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export class NotionClientWrapper {
  private client: Client;

  constructor() {
    this.client = new Client({
      auth: process.env.NOTION_TOKEN,
      notionVersion: process.env.NOTION_VERSION || '2022-06-28'
    });
  }

  getClient(): Client {
    return this.client;
  }
}

// Singleton instance
export const notionClient = new NotionClientWrapper();
