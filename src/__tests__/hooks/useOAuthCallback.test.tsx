import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOAuthCallback } from '../../hooks/useOAuthCallback';
import { ExpoOAuthAdapter } from '../../ExpoOAuthAdapter';
import type { ExpoOAuthConfig, OAuthCallbackParams } from '../../types';

// Mock ExpoOAuthAdapter
jest.mock('../../ExpoOAuthAdapter', () => ({
  ExpoOAuthAdapter: jest.fn(),
}));

const MockedExpoOAuthAdapter = ExpoOAuthAdapter as jest.MockedClass<
  typeof ExpoOAuthAdapter
>;

describe('useOAuthCallback', () => {
  let mockAdapter: jest.Mocked<ExpoOAuthAdapter>;

  const mockConfig: ExpoOAuthConfig = {
    clientId: 'test-client-id',
    endpoints: {
      authorization: 'https://auth.example.com/authorize',
      token: 'https://auth.example.com/token',
    },
    redirectUri: 'myapp://oauth/callback',
    scopes: ['read', 'write'],
    scheme: 'myapp',
    path: '/oauth/callback',
  };

  const mockParams: OAuthCallbackParams = {
    code: 'test-code',
    state: 'test-state',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdapter = {
      handleCallback: jest.fn(),
    } as any;

    MockedExpoOAuthAdapter.mockImplementation(() => mockAdapter);
  });

  describe('initial state', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() =>
        useOAuthCallback(mockParams, mockConfig, { autoStart: false })
      );

      expect(result.current.status).toBe('processing');
      expect(result.current.message).toBe('Processing OAuth callback...');
      expect(typeof result.current.handleCallback).toBe('function');
      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('handleCallback', () => {
    it('should handle successful authorization code callback', async () => {
      const mockResult = {
        success: true,
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(mockParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.message).toBe('Authentication successful');
        expect(mockAdapter.handleCallback).toHaveBeenCalledWith(mockParams);
      });
    });

    it('should handle magic link callback', async () => {
      const magicLinkParams = {
        token: 'magic-token-123',
        flow: 'login' as const,
      };

      const mockResult = {
        success: true,
        accessToken: 'token-456',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(magicLinkParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.message).toBe('Authentication successful');
      });
    });

    it('should handle OAuth errors', async () => {
      const errorParams = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      const mockResult = {
        success: false,
        error: 'access_denied',
        message: 'User denied access',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(errorParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.message).toBe('access_denied');
      });
    });

    it('should handle network errors', async () => {
      mockAdapter.handleCallback.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useOAuthCallback(mockParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.message).toBe('Network error');
      });
    });

    it('should handle unknown errors', async () => {
      mockAdapter.handleCallback.mockRejectedValue(
        new Error('An unknown error occurred')
      );

      const { result } = renderHook(() =>
        useOAuthCallback(mockParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.message).toBe('An unknown error occurred');
      });
    });

    it('should handle empty URL parameters', async () => {
      const emptyParams = {};

      const mockResult = {
        success: false,
        error: 'invalid_request',
        message: 'No valid parameters found',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(emptyParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.message).toBe('invalid_request');
      });
    });
  });

  describe('retry', () => {
    it('should reset status to processing and allow retry', async () => {
      // First attempt fails
      mockAdapter.handleCallback.mockRejectedValueOnce(
        new Error('Network error')
      );

      // Second attempt succeeds
      const mockResult = {
        success: true,
        accessToken: 'token-123',
      };
      mockAdapter.handleCallback.mockResolvedValueOnce(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(mockParams, mockConfig)
      );

      // Wait for first attempt to fail
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // Retry
      act(() => {
        result.current.retry();
      });

      // The retry should trigger handleCallback again, which will succeed
      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(result.current.message).toBe('Authentication successful');
      });
    });
  });

  describe('URL parsing', () => {
    it('should correctly parse URL parameters', async () => {
      const complexParams = {
        code: 'test-code',
        state: 'test-state',
        custom_param: 'value',
      };

      const mockResult = {
        success: true,
        accessToken: 'token-123',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(complexParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
        expect(mockAdapter.handleCallback).toHaveBeenCalledWith(complexParams);
      });
    });

    it('should handle URL encoded parameters', async () => {
      const encodedParams = {
        error_description: 'User denied access',
        state: 'test+state',
      };

      const mockResult = {
        success: false,
        error: 'access_denied',
      };

      mockAdapter.handleCallback.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() =>
        useOAuthCallback(encodedParams, mockConfig)
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(mockAdapter.handleCallback).toHaveBeenCalledWith(encodedParams);
      });
    });
  });
});
