import { BaseClient } from '../core/base-client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export class RipplingClient extends BaseClient {
  constructor() {
    super({
      baseURL: process.env.RIPPLING_BASE_URL || 'https://api.rippling.com',
      apiKey: process.env.RIPPLING_API_KEY,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Singleton instance
export const rippling = new RipplingClient();
