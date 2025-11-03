import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

export interface BaseClientConfig {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class BaseClient {
  protected client: AxiosInstance;

  constructor(config: BaseClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error(`API Error: ${error.response.status}`, error.response.data);
          throw new Error(`API request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          // Request made but no response
          console.error('No response received from API', error.request);
          throw new Error('No response received from API');
        } else {
          // Error setting up request
          console.error('Error setting up request', error.message);
          throw error;
        }
      }
    );
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}
