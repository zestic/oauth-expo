import type { HttpAdapter, HttpResponse } from '@zestic/oauth-core';

/**
 * Expo/React Native HTTP adapter using fetch
 * Implements the oauth-core HttpAdapter interface
 */
export class ExpoHttpAdapter implements HttpAdapter {
  async post(url: string, data: Record<string, unknown>, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.makeRequest('POST', url, data, headers);
  }

  async get(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    return this.makeRequest('GET', url, undefined, headers);
  }

  private async makeRequest(
    method: 'GET' | 'POST',
    url: string,
    data?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<HttpResponse> {
    try {
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const requestHeaders = {
        ...defaultHeaders,
        ...headers,
      };

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (data && method === 'POST') {
        if (requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded') {
          // Convert data to URLSearchParams for form encoding
          const formData = new URLSearchParams();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          requestOptions.body = formData.toString();
        } else {
          requestOptions.body = JSON.stringify(data);
        }
      }

      const response = await fetch(url, requestOptions);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseData: unknown;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        data: responseData,
        headers: responseHeaders,
      };
    } catch (error) {
      throw new Error(`Network request failed: ${error}`);
    }
  }

}
