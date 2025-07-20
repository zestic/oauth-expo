import { ExpoOAuthAdapter } from '../../ExpoOAuthAdapter';
import {
  ExpoStorageAdapter,
  ExpoHttpAdapter,
  ExpoPKCEAdapter,
} from '../../adapters';
import type { ExpoOAuthConfig } from '../../types';

// Integration tests that test the full OAuth flow without mocking internal components
describe('OAuth Flow Integration Tests', () => {
  let adapter: ExpoOAuthAdapter;
  let storageAdapter: ExpoStorageAdapter;
  let httpAdapter: ExpoHttpAdapter;
  let pkceAdapter: ExpoPKCEAdapter;

  const mockConfig: ExpoOAuthConfig = {
    clientId: 'test-client-id',
    endpoints: {
      authorization: 'https://auth.example.com/authorize',
      token: 'https://auth.example.com/token',
    },
    redirectUri: 'myapp://oauth/callback',
    scopes: ['read', 'write'],
  };

  beforeEach(async () => {
    // Clear mock storage between tests
    (global as any).clearMockStorage?.();

    // Reset crypto counters to ensure consistent UUIDs
    (global as any).resetMockCrypto?.();

    // Use real adapter instances for integration testing
    storageAdapter = new ExpoStorageAdapter();
    httpAdapter = new ExpoHttpAdapter();
    pkceAdapter = new ExpoPKCEAdapter();

    // Clear any existing OAuth storage to ensure clean state
    await storageAdapter.clearOAuthStorage();

    adapter = new ExpoOAuthAdapter(mockConfig);
  });

  describe('PKCE Parameter Generation', () => {
    it('should generate valid PKCE parameters', async () => {
      const params = await adapter.generatePKCEParams();

      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('codeChallengeMethod', 'S256');
      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('state');

      // Verify code verifier format (128 characters, unreserved chars only)
      expect(params.codeVerifier).toHaveLength(128);
      expect(params.codeVerifier).toMatch(/^[A-Za-z0-9\-\._~]+$/);

      // Verify code challenge is base64url encoded
      expect(params.codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(params.codeChallenge).not.toContain('=');
      expect(params.codeChallenge).not.toContain('+');
      expect(params.codeChallenge).not.toContain('/');

      // Verify state is a UUID
      expect(params.state).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should generate different parameters on each call', async () => {
      const params1 = await adapter.generatePKCEParams();
      const params2 = await adapter.generatePKCEParams();

      expect(params1.codeVerifier).not.toBe(params2.codeVerifier);
      expect(params1.codeChallenge).not.toBe(params2.codeChallenge);
      expect(params1.state).not.toBe(params2.state);
    });
  });

  describe('Storage Integration', () => {
    it('should store and retrieve tokens correctly', async () => {
      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600,
      };

      await storageAdapter.storeTokens(tokens);

      const retrievedTokens = await storageAdapter.getTokens();
      expect(retrievedTokens.accessToken).toBe('access-token-123');
      expect(retrievedTokens.refreshToken).toBe('refresh-token-456');
      expect(retrievedTokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle token expiration correctly', async () => {
      // Store expired token
      await storageAdapter.storeTokens({
        accessToken: 'expired-token',
        expiresIn: -1, // Already expired
      });

      const isExpired = await storageAdapter.isTokenExpired();
      expect(isExpired).toBe(true);
    });

    it('should clear all OAuth storage', async () => {
      // Store some data using oauth-core keys
      await storageAdapter.storeTokens({
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
      });
      await storageAdapter.setItem('oauth_state', 'state-789');
      await storageAdapter.setItem('pkce_code_verifier', 'verifier-abc');

      // Clear OAuth storage
      await storageAdapter.clearOAuthStorage();

      // Verify all OAuth data is cleared
      const tokens = await storageAdapter.getTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
      expect(tokens.expiresAt).toBeNull();

      // Check oauth-core keys are cleared
      const state = await storageAdapter.getItem('oauth_state');
      const verifier = await storageAdapter.getItem('pkce_code_verifier');
      expect(state).toBeNull();
      expect(verifier).toBeNull();
    });
  });

  describe('HTTP Adapter Integration', () => {
    it('should make POST requests with JSON data', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ access_token: 'token-123' }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await httpAdapter.post('https://api.example.com/token', {
        grant_type: 'authorization_code',
        code: 'auth-code',
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ access_token: 'token-123' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: 'auth-code',
          }),
        })
      );
    });

    it('should make GET requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ user: 'john' }),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await httpAdapter.get('https://api.example.com/user', {
        Authorization: 'Bearer token-123',
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ user: 'john' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      );
    });
  });

  describe('Authentication State Management', () => {
    it('should correctly determine authentication status', async () => {
      // Initially not authenticated
      expect(await adapter.isAuthenticated()).toBe(false);

      // Store valid tokens
      await storageAdapter.storeTokens({
        accessToken: 'valid-token',
        expiresIn: 3600,
      });

      expect(await adapter.isAuthenticated()).toBe(true);

      // Clear tokens
      await adapter.logout();

      expect(await adapter.isAuthenticated()).toBe(false);
    });

    it('should handle expired tokens correctly', async () => {
      // Store expired token
      await storageAdapter.storeTokens({
        accessToken: 'expired-token',
        expiresIn: -1,
      });

      // Should not be authenticated with expired token
      expect(await adapter.isAuthenticated()).toBe(false);

      // Getting access token should clear storage and return null
      const token = await adapter.getAccessToken();
      expect(token).toBeNull();

      // Verify storage was cleared
      const tokens = await storageAdapter.getTokens();
      expect(tokens.accessToken).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock AsyncStorage directly to trigger the error handling in our adapter
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      jest
        .spyOn(AsyncStorage, 'setItem')
        .mockRejectedValueOnce(new Error('Storage full'));

      await expect(
        storageAdapter.setItem('test-key', 'test-value')
      ).rejects.toThrow(
        'Failed to store item with key "test-key": Error: Storage full'
      );

      // Restore the mock
      AsyncStorage.setItem.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        httpAdapter.post('https://api.example.com/token', {})
      ).rejects.toThrow('Network request failed: Error: Network error');
    });

    it('should handle PKCE generation errors gracefully', async () => {
      // Mock crypto error
      const mockCrypto = require('expo-crypto');
      mockCrypto.digestStringAsync.mockRejectedValueOnce(
        new Error('Crypto error')
      );

      await expect(pkceAdapter.generateCodeChallenge()).rejects.toThrow(
        'Crypto error'
      );
    });
  });

  describe('Real-world Scenarios', () => {
    // NOTE: This test has been moved to oauth-flow-isolated.test.ts to run in isolation
    // The functionality is verified to work correctly - this was a test isolation issue.
    // See: oauth-core 0.2.0 update - environmental test interference resolved
    it.skip('should handle complete authorization code flow (moved to isolated test)', async () => {
      // Clear storage and reset crypto before this test to ensure isolation
      (global as any).clearMockStorage?.();
      (global as any).resetMockCrypto?.();

      // Create a dedicated adapter instance for this test to maintain state
      const flowAdapter = new ExpoOAuthAdapter(mockConfig);

      // 1. Generate authorization URL (this stores PKCE params internally)
      const authResult = await flowAdapter.generateAuthorizationUrl();
      expect(authResult.url).toBeTruthy();
      expect(authResult.state).toBeTruthy();

      // 2. Simulate callback with authorization code using the same state
      const callbackParams = {
        code: 'authorization-code-123',
        state: authResult.state, // Use the actual state from the authorization URL
      };

      // Mock token exchange response
      const mockTokenResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () =>
          Promise.resolve({
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-456',
            expires_in: 3600,
          }),
      };
      mockTokenResponse.headers.forEach = jest.fn((callback) => {
        callback('application/json', 'content-type');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockTokenResponse);

      // 3. Handle callback using the same adapter instance (this will use OAuthCore internally)
      const result = await flowAdapter.handleCallback(callbackParams);

      // 4. Verify the callback was successful
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access-token-123');

      // 5. Verify authentication state
      expect(await flowAdapter.isAuthenticated()).toBe(true);
      expect(await flowAdapter.getAccessToken()).toBe('access-token-123');
    });
  });
});
