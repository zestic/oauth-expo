import { renderHook, act } from '@testing-library/react-native';
import { useOAuthConfig } from '../../hooks/useOAuthConfig';
import { ExpoPKCEAdapter } from '../../adapters/ExpoPKCEAdapter';

// Mock the PKCE adapter
jest.mock('../../adapters/ExpoPKCEAdapter');

const MockedExpoPKCEAdapter = ExpoPKCEAdapter as jest.MockedClass<
  typeof ExpoPKCEAdapter
>;

describe('useOAuthConfig', () => {
  let mockPKCEAdapter: jest.Mocked<ExpoPKCEAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPKCEAdapter = {
      generateCodeChallenge: jest.fn(),
      generateState: jest.fn(),
    } as any;

    MockedExpoPKCEAdapter.mockImplementation(() => mockPKCEAdapter);
  });

  describe('basic configuration', () => {
    it('should create config with required parameters', () => {
      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read', 'write'],
        })
      );

      expect(result.current.config).toEqual({
        clientId: 'test-client-id',
        endpoints: {
          authorization: 'https://auth.example.com/authorize',
          token: 'https://auth.example.com/token',
        },
        redirectUri: 'myapp://oauth/callback',
        scopes: ['read', 'write'],
      });
    });

    it('should include optional parameters when provided', () => {
      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read', 'write'],
          scheme: 'myapp',
          path: '/oauth/callback',
          additionalParameters: {
            audience: 'https://api.example.com',
            prompt: 'consent',
          },
        })
      );

      expect(result.current.config).toEqual({
        clientId: 'test-client-id',
        endpoints: {
          authorization: 'https://auth.example.com/authorize',
          token: 'https://auth.example.com/token',
        },
        redirectUri: 'myapp://oauth/callback',
        scopes: ['read', 'write'],
        scheme: 'myapp',
        path: '/oauth/callback',
      });

      expect(result.current.additionalParameters).toEqual({
        audience: 'https://api.example.com',
        prompt: 'consent',
      });
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate authorization URL with PKCE parameters', async () => {
      const mockChallenge = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
        codeVerifier: 'test-verifier',
      };
      const mockState = 'test-state';

      mockPKCEAdapter.generateCodeChallenge.mockResolvedValue(mockChallenge);
      mockPKCEAdapter.generateState.mockResolvedValue(mockState);

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read', 'write'],
        })
      );

      let authResult: any;
      await act(async () => {
        authResult = await result.current.generateAuthUrl();
      });

      expect(mockPKCEAdapter.generateCodeChallenge).toHaveBeenCalledTimes(1);
      expect(mockPKCEAdapter.generateState).toHaveBeenCalledTimes(1);

      expect(authResult).toEqual({
        authUrl: expect.stringContaining('https://auth.example.com/authorize'),
        codeVerifier: 'test-verifier',
        state: 'test-state',
      });

      // Verify URL parameters
      const url = new URL(authResult.authUrl);
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'myapp://oauth/callback'
      );
      expect(url.searchParams.get('scope')).toBe('read write');
      expect(url.searchParams.get('state')).toBe('test-state');
      expect(url.searchParams.get('code_challenge')).toBe('test-challenge');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should include additional parameters in authorization URL', async () => {
      const mockChallenge = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
        codeVerifier: 'test-verifier',
      };
      const mockState = 'test-state';

      mockPKCEAdapter.generateCodeChallenge.mockResolvedValue(mockChallenge);
      mockPKCEAdapter.generateState.mockResolvedValue(mockState);

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read', 'write'],
          additionalParameters: {
            audience: 'https://api.example.com',
            prompt: 'consent',
            access_type: 'offline',
          },
        })
      );

      let authResult: any;
      await act(async () => {
        authResult = await result.current.generateAuthUrl();
      });

      const url = new URL(authResult.authUrl);
      expect(url.searchParams.get('audience')).toBe('https://api.example.com');
      expect(url.searchParams.get('prompt')).toBe('consent');
      expect(url.searchParams.get('access_type')).toBe('offline');
    });

    it('should handle PKCE generation errors', async () => {
      mockPKCEAdapter.generateCodeChallenge.mockRejectedValue(
        new Error('PKCE generation failed')
      );

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read'],
        })
      );

      await act(async () => {
        await expect(result.current.generateAuthUrl()).rejects.toThrow(
          'PKCE generation failed'
        );
      });
    });

    it('should handle state generation errors', async () => {
      const mockChallenge = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
        codeVerifier: 'test-verifier',
      };

      mockPKCEAdapter.generateCodeChallenge.mockResolvedValue(mockChallenge);
      mockPKCEAdapter.generateState.mockRejectedValue(
        new Error('State generation failed')
      );

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read'],
        })
      );

      await act(async () => {
        await expect(result.current.generateAuthUrl()).rejects.toThrow(
          'State generation failed'
        );
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty scopes array', () => {
      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: [],
        })
      );

      expect(result.current.config.scopes).toEqual([]);
    });

    it('should handle single scope', async () => {
      const mockChallenge = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
        codeVerifier: 'test-verifier',
      };
      const mockState = 'test-state';

      mockPKCEAdapter.generateCodeChallenge.mockResolvedValue(mockChallenge);
      mockPKCEAdapter.generateState.mockResolvedValue(mockState);

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read'],
        })
      );

      let authResult: any;
      await act(async () => {
        authResult = await result.current.generateAuthUrl();
      });

      const url = new URL(authResult.authUrl);
      expect(url.searchParams.get('scope')).toBe('read');
    });

    it('should handle special characters in parameters', async () => {
      const mockChallenge = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
        codeVerifier: 'test-verifier',
      };
      const mockState = 'test-state-with-special-chars!@#$%';

      mockPKCEAdapter.generateCodeChallenge.mockResolvedValue(mockChallenge);
      mockPKCEAdapter.generateState.mockResolvedValue(mockState);

      const { result } = renderHook(() =>
        useOAuthConfig({
          clientId: 'test-client-id',
          authorizationEndpoint: 'https://auth.example.com/authorize',
          tokenEndpoint: 'https://auth.example.com/token',
          redirectUri: 'myapp://oauth/callback',
          scopes: ['read', 'write:special-scope'],
          additionalParameters: {
            custom_param: 'value with spaces & symbols',
          },
        })
      );

      let authResult: any;
      await act(async () => {
        authResult = await result.current.generateAuthUrl();
      });

      const url = new URL(authResult.authUrl);
      expect(url.searchParams.get('state')).toBe(
        'test-state-with-special-chars!@#$%'
      );
      expect(url.searchParams.get('scope')).toBe('read write:special-scope');
      expect(url.searchParams.get('custom_param')).toBe(
        'value with spaces & symbols'
      );
    });
  });

  describe('config updates', () => {
    it('should update config when options change', () => {
      const { result, rerender } = renderHook(
        ({ clientId }) =>
          useOAuthConfig({
            clientId,
            authorizationEndpoint: 'https://auth.example.com/authorize',
            tokenEndpoint: 'https://auth.example.com/token',
            redirectUri: 'myapp://oauth/callback',
            scopes: ['read'],
          }),
        {
          initialProps: { clientId: 'client-1' },
        }
      );

      expect(result.current.config.clientId).toBe('client-1');

      rerender({ clientId: 'client-2' });

      expect(result.current.config.clientId).toBe('client-2');
    });
  });
});
