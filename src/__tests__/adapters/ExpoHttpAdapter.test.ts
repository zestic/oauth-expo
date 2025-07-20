import { ExpoHttpAdapter } from '../../adapters/ExpoHttpAdapter';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ExpoHttpAdapter', () => {
  let adapter: ExpoHttpAdapter;

  beforeEach(() => {
    adapter = new ExpoHttpAdapter();
    jest.clearAllMocks();
  });

  describe('post', () => {
    it('should make POST request with JSON data', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await adapter.post('https://api.example.com/token', {
        grant_type: 'authorization_code',
        code: 'test-code',
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: 'test-code',
        }),
      });

      expect(result).toEqual({
        status: 200,
        data: { success: true },
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should make POST request with form data', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ access_token: 'token123' }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await adapter.post(
        'https://api.example.com/token',
        {
          grant_type: 'authorization_code',
          code: 'test-code',
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: 'grant_type=authorization_code&code=test-code',
      });

      expect(result).toEqual({
        status: 200,
        data: { access_token: 'token123' },
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should handle text response', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: jest.fn().mockResolvedValue('Success'),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('text/plain', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await adapter.post('https://api.example.com/webhook', {
        message: 'test',
      });

      expect(result).toEqual({
        status: 200,
        data: 'Success',
        headers: { 'content-type': 'text/plain' },
      });
    });

    it('should handle custom headers', async () => {
      const mockResponse = {
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 123 }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      await adapter.post(
        'https://api.example.com/data',
        { name: 'test' },
        {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        }
      );

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
        body: JSON.stringify({ name: 'test' }),
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        adapter.post('https://api.example.com/token', { test: 'data' })
      ).rejects.toThrow('Network request failed: Error: Network error');
    });

    it('should handle null and undefined values in form data', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      await adapter.post(
        'https://api.example.com/token',
        {
          grant_type: 'authorization_code',
          code: 'test-code',
          state: null,
          redirect_uri: undefined,
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: 'grant_type=authorization_code&code=test-code',
      });
    });
  });

  describe('get', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await adapter.get('https://api.example.com/user');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      expect(result).toEqual({
        status: 200,
        data: { data: 'test' },
        headers: { 'content-type': 'application/json' },
      });
    });

    it('should make GET request with custom headers', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ user: 'john' }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type', mockResponse.headers);
      });
      mockFetch.mockResolvedValue(mockResponse as any);

      await adapter.get('https://api.example.com/user', {
        Authorization: 'Bearer token123',
        Accept: 'application/vnd.api+json',
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.api+json',
          'Authorization': 'Bearer token123',
        },
      });
    });

    it('should handle GET request errors', async () => {
      mockFetch.mockRejectedValue(new Error('Request failed'));

      await expect(adapter.get('https://api.example.com/user')).rejects.toThrow(
        'Network request failed: Error: Request failed'
      );
    });
  });
});
