import {
  OAuthCore,
  FlowHandlerFactory,
  TokenManager,
} from '@zestic/oauth-core';
import {
  ExpoStorageAdapter,
  ExpoHttpAdapter,
  ExpoPKCEAdapter,
} from './adapters';
import type {
  ExpoOAuthConfig,
  OAuthCallbackParams,
  OAuthResult,
  PKCEParams,
  TokenData,
  OAuthAdapters,
} from './types';

/**
 * Expo-specific OAuth adapter that integrates with oauth-core
 */
export class ExpoOAuthAdapter {
  private oauthCore: OAuthCore;
  private storageAdapter: ExpoStorageAdapter;
  private httpAdapter: ExpoHttpAdapter;
  private pkceAdapter: ExpoPKCEAdapter;

  constructor(private config: ExpoOAuthConfig) {
    // Initialize adapters
    this.storageAdapter = new ExpoStorageAdapter();
    this.httpAdapter = new ExpoHttpAdapter();
    this.pkceAdapter = new ExpoPKCEAdapter();

    const adapters: OAuthAdapters = {
      storage: this.storageAdapter,
      http: this.httpAdapter,
      pkce: this.pkceAdapter,
    };

    // Initialize OAuth core with config and adapters
    this.oauthCore = new OAuthCore(config, adapters);

    // Register the authorization code flow handler
    const authCodeFlowHandler = FlowHandlerFactory.create(
      'authorization_code',
      100, // Standard priority
      // canHandle: Check for 'code' parameter (OAuth2 authorization code flow)
      (params) =>
        params.has('code') &&
        !params.has('token') &&
        !params.has('magic_link_token'),
      // handle: Process the authorization code flow
      async (params, oauthAdapters, oauthConfig) => {
        const code = params.get('code');

        if (!code) {
          return {
            success: false,
            error: 'Missing authorization code',
            errorCode: 'invalid_request',
          };
        }

        try {
          // Get the stored code verifier for PKCE
          const codeVerifier =
            await oauthAdapters.storage.getItem('pkce_code_verifier');
          if (!codeVerifier) {
            return {
              success: false,
              error: 'Missing PKCE code verifier',
              errorCode: 'invalid_request',
            };
          }

          // Use the token manager to exchange code for tokens
          const tokenManager = new TokenManager(
            oauthAdapters.http,
            oauthAdapters.storage
          );
          const result = await tokenManager.exchangeAuthorizationCode(
            code,
            codeVerifier,
            oauthConfig
          );

          return result;
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : 'Token exchange failed',
            errorCode: 'token_exchange_failed',
          };
        }
      }
    );

    this.oauthCore.registerFlow(authCodeFlowHandler);
  }

  /**
   * Handle OAuth callback parameters
   */
  async handleCallback(params: OAuthCallbackParams): Promise<OAuthResult> {
    // Convert params to URLSearchParams, filtering out null/undefined values
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlParams.set(key, String(value));
      }
    });

    return this.oauthCore.handleCallback(urlParams);
  }

  /**
   * Generate authorization URL with PKCE parameters
   * This method generates PKCE parameters internally and stores them for later use
   */
  async generateAuthorizationUrl(
    additionalParams?: Record<string, string>
  ): Promise<{ url: string; state: string }> {
    return this.oauthCore.generateAuthorizationUrl(additionalParams);
  }

  /**
   * Generate PKCE parameters for OAuth flow
   * @deprecated Use generateAuthorizationUrl instead which handles PKCE internally
   */
  async generatePKCEParams(): Promise<PKCEParams> {
    const challenge = await this.oauthCore.generatePKCEChallenge();
    const state = await this.oauthCore.generateState();

    return {
      codeChallenge: challenge.codeChallenge,
      codeChallengeMethod: challenge.codeChallengeMethod,
      codeVerifier: challenge.codeVerifier,
      state,
    };
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.oauthCore.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const isExpired = await this.oauthCore.isTokenExpired();
      return !isExpired;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current access token if valid
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.oauthCore.getAccessToken();

      if (!accessToken) {
        return null;
      }

      const isExpired = await this.oauthCore.isTokenExpired();

      if (isExpired) {
        // Clear expired tokens
        await this.logout();
        return null;
      }

      return accessToken;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current tokens
   */
  async getTokens(): Promise<TokenData> {
    return this.storageAdapter.getTokens();
  }

  /**
   * Clear all OAuth-related storage
   */
  async logout(): Promise<void> {
    await this.storageAdapter.clearOAuthStorage();
  }

  /**
   * Get the OAuth configuration
   */
  getConfig(): ExpoOAuthConfig {
    return this.config;
  }
}
