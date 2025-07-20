import { OAuthCore } from '@zestic/oauth-core';
import { ExpoOAuthAdapter } from '../ExpoOAuthAdapter';
import {
  ExpoStorageAdapter,
  ExpoHttpAdapter,
  ExpoPKCEAdapter,
} from '../adapters';
import type { ExpoOAuthConfig, OAuthCallbackParams } from '../types';

// Mock the adapters
jest.mock('../adapters/ExpoStorageAdapter');
jest.mock('../adapters/ExpoHttpAdapter');
jest.mock('../adapters/ExpoPKCEAdapter');

// Mock OAuthCore
jest.mock('@zestic/oauth-core', () => ({
  OAuthCore: jest.fn(),
}));

const MockedOAuthCore = OAuthCore as jest.MockedClass<typeof OAuthCore>;
const MockedExpoStorageAdapter = ExpoStorageAdapter as jest.MockedClass<
  typeof ExpoStorageAdapter
>;
const MockedExpoHttpAdapter = ExpoHttpAdapter as jest.MockedClass<
  typeof ExpoHttpAdapter
>;
const MockedExpoPKCEAdapter = ExpoPKCEAdapter as jest.MockedClass<
  typeof ExpoPKCEAdapter
>;

describe('ExpoOAuthAdapter', () => {
  let adapter: ExpoOAuthAdapter;
  let mockOAuthCore: jest.Mocked<OAuthCore>;
  let mockStorageAdapter: jest.Mocked<ExpoStorageAdapter>;
  let mockHttpAdapter: jest.Mocked<ExpoHttpAdapter>;
  let mockPKCEAdapter: jest.Mocked<ExpoPKCEAdapter>;

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

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockOAuthCore = {
      handleCallback: jest.fn(),
      generateAuthorizationUrl: jest.fn(),
      generatePKCEChallenge: jest.fn(),
      generateState: jest.fn(),
      getAccessToken: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    mockStorageAdapter = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      removeItems: jest.fn(),
      clearOAuthStorage: jest.fn(),
      storeTokens: jest.fn(),
      getTokens: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    mockHttpAdapter = {
      post: jest.fn(),
      get: jest.fn(),
    } as any;

    mockPKCEAdapter = {
      generateCodeChallenge: jest.fn(),
      generateState: jest.fn(),
    } as any;

    // Setup constructor mocks
    MockedOAuthCore.mockImplementation(() => mockOAuthCore);
    MockedExpoStorageAdapter.mockImplementation(() => mockStorageAdapter);
    MockedExpoHttpAdapter.mockImplementation(() => mockHttpAdapter);
    MockedExpoPKCEAdapter.mockImplementation(() => mockPKCEAdapter);

    adapter = new ExpoOAuthAdapter(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct adapters', () => {
      expect(MockedExpoStorageAdapter).toHaveBeenCalledTimes(1);
      expect(MockedExpoHttpAdapter).toHaveBeenCalledTimes(1);
      expect(MockedExpoPKCEAdapter).toHaveBeenCalledTimes(1);
    });

    it('should initialize OAuthCore with config and adapters', () => {
      expect(MockedOAuthCore).toHaveBeenCalledWith(
        mockConfig,
        {
          storage: mockStorageAdapter,
          http: mockHttpAdapter,
          pkce: mockPKCEAdapter,
        },
        undefined
      );
    });
  });

  describe('handleCallback', () => {
    it('should convert params to URLSearchParams and call OAuthCore', async () => {
      const callbackParams: OAuthCallbackParams = {
        code: 'auth-code-123',
        state: 'state-456',
      };

      const expectedResult = {
        success: true,
        tokens: { accessToken: 'token-123' },
      };

      mockOAuthCore.handleCallback.mockResolvedValue(expectedResult as any);

      const result = await adapter.handleCallback(callbackParams);

      expect(mockOAuthCore.handleCallback).toHaveBeenCalledWith(
        expect.any(URLSearchParams)
      );

      const urlParams = mockOAuthCore.handleCallback.mock
        .calls[0]?.[0] as URLSearchParams;
      expect(urlParams.get('code')).toBe('auth-code-123');
      expect(urlParams.get('state')).toBe('state-456');

      expect(result).toBe(expectedResult);
    });

    it('should handle magic link callback params', async () => {
      const callbackParams: OAuthCallbackParams = {
        token: 'magic-link-token',
        magic_link_token: 'magic-token-123',
        flow: 'magic_link',
      };

      const expectedResult = {
        success: true,
        tokens: { accessToken: 'token-456' },
      };

      mockOAuthCore.handleCallback.mockResolvedValue(expectedResult as any);

      const result = await adapter.handleCallback(callbackParams);

      const urlParams = mockOAuthCore.handleCallback.mock
        .calls[0]?.[0] as URLSearchParams;
      expect(urlParams.get('token')).toBe('magic-link-token');
      expect(urlParams.get('magic_link_token')).toBe('magic-token-123');
      expect(urlParams.get('flow')).toBe('magic_link');

      expect(result).toBe(expectedResult);
    });

    it('should handle error callback params', async () => {
      const callbackParams: OAuthCallbackParams = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      const expectedResult = {
        success: false,
        error: 'access_denied',
        message: 'User denied access',
      };

      mockOAuthCore.handleCallback.mockResolvedValue(expectedResult as any);

      const result = await adapter.handleCallback(callbackParams);

      const urlParams = mockOAuthCore.handleCallback.mock
        .calls[0]?.[0] as URLSearchParams;
      expect(urlParams.get('error')).toBe('access_denied');
      expect(urlParams.get('error_description')).toBe('User denied access');

      expect(result).toBe(expectedResult);
    });

    it('should filter out null and undefined values', async () => {
      const callbackParams: OAuthCallbackParams = {
        code: 'auth-code-123',
        state: null,
        error: undefined,
      };

      mockOAuthCore.handleCallback.mockResolvedValue({ success: true } as any);

      await adapter.handleCallback(callbackParams);

      const urlParams = mockOAuthCore.handleCallback.mock
        .calls[0][0] as URLSearchParams;
      expect(urlParams.get('code')).toBe('auth-code-123');
      expect(urlParams.has('state')).toBe(false);
      expect(urlParams.has('error')).toBe(false);
    });
  });

  describe('generatePKCEParams', () => {
    it('should delegate to OAuthCore for PKCE generation', async () => {
      const mockChallenge = {
        codeChallenge: 'challenge-123',
        codeChallengeMethod: 'S256',
        codeVerifier: 'verifier-456',
      };
      const mockState = 'state-789';

      mockOAuthCore.generatePKCEChallenge.mockResolvedValue(mockChallenge);
      mockOAuthCore.generateState.mockResolvedValue(mockState);

      const result = await adapter.generatePKCEParams();

      expect(mockOAuthCore.generatePKCEChallenge).toHaveBeenCalledTimes(1);
      expect(mockOAuthCore.generateState).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        codeChallenge: 'challenge-123',
        codeChallengeMethod: 'S256',
        codeVerifier: 'verifier-456',
        state: 'state-789',
      });
    });

    it('should handle PKCE generation errors from OAuthCore', async () => {
      mockOAuthCore.generatePKCEChallenge.mockRejectedValue(
        new Error('PKCE generation failed')
      );

      await expect(adapter.generatePKCEParams()).rejects.toThrow(
        'PKCE generation failed'
      );
    });

    it('should handle state generation errors from OAuthCore', async () => {
      const mockChallenge = {
        codeChallenge: 'challenge-123',
        codeChallengeMethod: 'S256',
        codeVerifier: 'verifier-456',
      };

      mockOAuthCore.generatePKCEChallenge.mockResolvedValue(mockChallenge);
      mockOAuthCore.generateState.mockRejectedValue(
        new Error('State generation failed')
      );

      await expect(adapter.generatePKCEParams()).rejects.toThrow(
        'State generation failed'
      );
    });
  });

  describe('generateAuthorizationUrl', () => {
    it('should delegate to OAuthCore and return authorization URL', async () => {
      const mockResult = {
        url: 'https://auth.example.com/oauth/authorize?client_id=test-client&response_type=code&state=test-state',
        state: 'test-state-789',
      };

      mockOAuthCore.generateAuthorizationUrl.mockResolvedValue(mockResult);

      const result = await adapter.generateAuthorizationUrl();

      expect(mockOAuthCore.generateAuthorizationUrl).toHaveBeenCalledWith(
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass additional parameters to OAuthCore', async () => {
      const additionalParams = {
        audience: 'https://api.example.com',
        prompt: 'consent',
      };

      const mockResult = {
        url: 'https://auth.example.com/oauth/authorize?client_id=test-client&audience=https://api.example.com',
        state: 'test-state-789',
      };

      mockOAuthCore.generateAuthorizationUrl.mockResolvedValue(mockResult);

      const result = await adapter.generateAuthorizationUrl(additionalParams);

      expect(mockOAuthCore.generateAuthorizationUrl).toHaveBeenCalledWith(
        additionalParams
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle OAuthCore errors', async () => {
      mockOAuthCore.generateAuthorizationUrl.mockRejectedValue(
        new Error('URL generation failed')
      );

      await expect(adapter.generateAuthorizationUrl()).rejects.toThrow(
        'URL generation failed'
      );
    });

    it('should handle empty additional parameters', async () => {
      const mockResult = {
        url: 'https://auth.example.com/oauth/authorize?client_id=test-client',
        state: 'test-state-789',
      };

      mockOAuthCore.generateAuthorizationUrl.mockResolvedValue(mockResult);

      const result = await adapter.generateAuthorizationUrl({});

      expect(mockOAuthCore.generateAuthorizationUrl).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when tokens exist and are not expired', async () => {
      mockOAuthCore.getAccessToken.mockResolvedValue('token-123');
      mockOAuthCore.isTokenExpired.mockResolvedValue(false);

      const result = await adapter.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no access token exists', async () => {
      mockOAuthCore.getAccessToken.mockResolvedValue(null);

      const result = await adapter.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', async () => {
      mockOAuthCore.getAccessToken.mockResolvedValue('token-123');
      mockOAuthCore.isTokenExpired.mockResolvedValue(true);

      const result = await adapter.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when valid', async () => {
      mockOAuthCore.getAccessToken.mockResolvedValue('token-123');
      mockOAuthCore.isTokenExpired.mockResolvedValue(false);

      const result = await adapter.getAccessToken();

      expect(result).toBe('token-123');
    });

    it('should logout and return null when token is expired', async () => {
      mockOAuthCore.getAccessToken.mockResolvedValue('token-123');
      mockOAuthCore.isTokenExpired.mockResolvedValue(true);
      mockStorageAdapter.clearOAuthStorage.mockResolvedValue();

      const result = await adapter.getAccessToken();

      expect(mockStorageAdapter.clearOAuthStorage).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear OAuth storage', async () => {
      mockStorageAdapter.clearOAuthStorage.mockResolvedValue();

      await adapter.logout();

      expect(mockStorageAdapter.clearOAuthStorage).toHaveBeenCalledTimes(1);
    });

    it('should handle storage errors during logout', async () => {
      mockStorageAdapter.clearOAuthStorage.mockRejectedValue(
        new Error('Clear storage failed')
      );

      await expect(adapter.logout()).rejects.toThrow('Clear storage failed');
    });
  });
});
