import { ExpoOAuthAdapter } from '../../ExpoOAuthAdapter';
import type { ExpoOAuthConfig } from '../../types';

// Isolated integration test for complete OAuth flow
// This test runs in isolation to avoid storage state pollution from other tests
describe('OAuth Flow - Isolated Integration Test', () => {
  const mockConfig: ExpoOAuthConfig = {
    clientId: 'test-client-id',
    endpoints: {
      authorization: 'https://auth.example.com/authorize',
      token: 'https://auth.example.com/token',
      revocation: 'https://auth.example.com/revoke',
    },
    redirectUri: 'myapp://oauth/callback',
    scopes: ['read', 'write'],
    scheme: 'myapp',
    path: 'oauth/callback',
  };

  // This test runs in isolation to avoid storage state pollution
  describe('Complete OAuth Flow', () => {
    beforeAll(() => {
      // Ensure complete isolation by resetting all mock state
      (global as any).clearMockStorage?.();
      (global as any).resetMockCrypto?.();
    });

    it('should handle complete authorization code flow', async () => {
      // Create a dedicated adapter instance for this test
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
        callback('application/json', 'content-type', mockTokenResponse.headers);
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockTokenResponse);

      // 3. Handle callback using the same adapter instance
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
