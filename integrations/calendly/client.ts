import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export class CalendlyClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.calendly.com',
      headers: {
        'Authorization': `Bearer ${process.env.CALENDLY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async request<T>(config: any): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

// Singleton instance
export const calendly = new CalendlyClient();
