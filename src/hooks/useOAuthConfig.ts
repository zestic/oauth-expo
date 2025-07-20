import { useMemo } from 'react';
import * as AuthSession from 'expo-auth-session';
import type { ExpoOAuthConfig } from '../types';

/**
 * Configuration options for useOAuthConfig hook
 */
export interface UseOAuthConfigOptions {
  /** OAuth client ID */
  clientId: string;
  /** Authorization endpoint URL */
  authorizationEndpoint: string;
  /** Token endpoint URL */
  tokenEndpoint: string;
  /** Redirect URI */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes?: string[];
  /** Custom redirect URI scheme */
  scheme?: string;
  /** Custom redirect URI path */
  path?: string;
  /** Additional OAuth endpoints */
  revocationEndpoint?: string;
  /** Additional parameters to include in authorization URL */
  additionalParameters?: Record<string, string>;
}

/**
 * Result of useOAuthConfig hook
 */
export interface UseOAuthConfigResult {
  config: ExpoOAuthConfig;
  additionalParameters?: Record<string, string>;
  generateAuthUrl: () => Promise<{
    authUrl: string;
    codeVerifier: string;
    state: string;
  }>;
}

/**
 * React hook for creating OAuth configuration
 * Generates Expo-compatible OAuth configuration with proper redirect URIs
 */
export function useOAuthConfig(options: UseOAuthConfigOptions): UseOAuthConfigResult {
  const config = useMemo((): ExpoOAuthConfig => {
    return {
      clientId: options.clientId,
      endpoints: {
        authorization: options.authorizationEndpoint,
        token: options.tokenEndpoint,
        revocation: options.revocationEndpoint,
      },
      redirectUri: options.redirectUri,
      scopes: options.scopes || ['read', 'write'],
      scheme: options.scheme,
      path: options.path,
    };
  }, [
    options.clientId,
    options.authorizationEndpoint,
    options.tokenEndpoint,
    options.redirectUri,
    options.scopes,
    options.scheme,
    options.path,
    options.revocationEndpoint,
  ]);

  const generateAuthUrl = useMemo(() => {
    return async () => {
      const { ExpoPKCEAdapter } = await import('../adapters');
      const pkceAdapter = new ExpoPKCEAdapter();

      // Generate PKCE parameters
      const pkceChallenge = await pkceAdapter.generateCodeChallenge();
      const state = await pkceAdapter.generateState();

      // Build authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scopes.join(' '),
        state,
        code_challenge: pkceChallenge.codeChallenge,
        code_challenge_method: pkceChallenge.codeChallengeMethod,
        ...options.additionalParameters,
      });

      const authUrl = `${config.endpoints.authorization}?${params.toString()}`;

      return {
        authUrl,
        codeVerifier: pkceChallenge.codeVerifier,
        state,
      };
    };
  }, [config]);

  return {
    config,
    additionalParameters: options.additionalParameters,
    generateAuthUrl,
  };
}

/**
 * Hook for creating OAuth configuration from environment variables
 * Useful for apps that store OAuth config in environment variables
 */
export function useOAuthConfigFromEnv(options?: {
  scheme?: string;
  path?: string;
  scopes?: string[];
}): ExpoOAuthConfig | null {
  const config = useMemo((): ExpoOAuthConfig | null => {
    // Check for required environment variables
    const clientId = process.env.EXPO_PUBLIC_AUTH_CLIENT_ID;
    const baseUrl = process.env.EXPO_PUBLIC_AUTH_OAUTH_BASE_URL;

    if (!clientId || !baseUrl) {
      console.warn(
        'Missing required environment variables: EXPO_PUBLIC_AUTH_CLIENT_ID and/or EXPO_PUBLIC_AUTH_OAUTH_BASE_URL'
      );
      return null;
    }

    // Generate redirect URI
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: options?.scheme,
      path: options?.path || 'auth/callback',
    });

    // Build endpoints
    const endpoints = {
      authorization: `${baseUrl}/oauth/authorize`,
      token: `${baseUrl}/oauth/token`,
      revocation: `${baseUrl}/oauth/revoke`,
    };

    return {
      clientId,
      endpoints,
      redirectUri,
      scopes: options?.scopes || ['read', 'write'],
      scheme: options?.scheme,
      path: options?.path || 'auth/callback',
    };
  }, [options?.scheme, options?.path, options?.scopes]);

  return config;
}

/**
 * Hook for generating OAuth authorization URL
 * Returns the URL and PKCE parameters needed for OAuth flow
 */
export function useOAuthAuthorizationUrl(
  config: ExpoOAuthConfig | null,
  additionalParameters?: Record<string, string>
) {
  return useMemo(() => {
    if (!config) {
      return null;
    }

    return {
      /**
       * Generate authorization URL with PKCE parameters
       */
      generateAuthUrl: async () => {
        const { ExpoPKCEAdapter } = await import('../adapters');
        const pkceAdapter = new ExpoPKCEAdapter();

        // Generate PKCE parameters
        const pkceChallenge = await pkceAdapter.generateCodeChallenge();
        const state = await pkceAdapter.generateState();

        // Build authorization URL manually
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scopes.join(' '),
          state,
          code_challenge: pkceChallenge.codeChallenge,
          code_challenge_method: pkceChallenge.codeChallengeMethod,
          ...additionalParameters,
        });

        const authUrl = `${config.endpoints.authorization}?${params.toString()}`;

        return {
          authUrl,
          codeVerifier: pkceChallenge.codeVerifier,
          state,
        };
      },
    };
  }, [config, additionalParameters]);
}
