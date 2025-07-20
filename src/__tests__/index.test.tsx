import * as OAuthExpo from '../index';

describe('oauth-expo exports', () => {
  it('should export all required components and utilities', () => {
    // Adapters
    expect(OAuthExpo.ExpoStorageAdapter).toBeDefined();
    expect(OAuthExpo.ExpoHttpAdapter).toBeDefined();
    expect(OAuthExpo.ExpoPKCEAdapter).toBeDefined();

    // Hooks
    expect(OAuthExpo.useOAuthCallback).toBeDefined();
    expect(OAuthExpo.useOAuthConfig).toBeDefined();

    // Components
    expect(OAuthExpo.OAuthCallbackScreen).toBeDefined();

    // Main adapter
    expect(OAuthExpo.ExpoOAuthAdapter).toBeDefined();
  });

  it('should export TypeScript types', () => {
    // This test ensures types are properly exported
    // TypeScript compilation will fail if types are not exported correctly
    const config: OAuthExpo.ExpoOAuthConfig = {
      clientId: 'test',
      endpoints: {
        authorization: 'https://auth.example.com/authorize',
        token: 'https://auth.example.com/token',
      },
      redirectUri: 'myapp://callback',
      scopes: ['read'],
    };

    expect(config).toBeDefined();
  });

  it('should allow instantiation of main classes', () => {
    expect(() => new OAuthExpo.ExpoStorageAdapter()).not.toThrow();
    expect(() => new OAuthExpo.ExpoHttpAdapter()).not.toThrow();
    expect(() => new OAuthExpo.ExpoPKCEAdapter()).not.toThrow();

    const config: OAuthExpo.ExpoOAuthConfig = {
      clientId: 'test',
      endpoints: {
        authorization: 'https://auth.example.com/authorize',
        token: 'https://auth.example.com/token',
      },
      redirectUri: 'myapp://callback',
      scopes: ['read'],
    };

    expect(() => new OAuthExpo.ExpoOAuthAdapter(config)).not.toThrow();
  });
});
