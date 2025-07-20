import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '../types';

/**
 * Expo/React Native storage adapter using AsyncStorage
 * Provides cross-platform storage for OAuth tokens and state
 */
export class ExpoStorageAdapter implements StorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      throw new Error(`Failed to store item with key "${key}": ${error}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      throw new Error(`Failed to retrieve item with key "${key}": ${error}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new Error(`Failed to remove item with key "${key}": ${error}`);
    }
  }

  async removeItems(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      throw new Error(`Failed to remove items with keys "${keys.join(', ')}": ${error}`);
    }
  }

  /**
   * Clear all OAuth-related storage items
   * Useful for logout functionality
   */
  async clearOAuthStorage(): Promise<void> {
    // Use the same keys as oauth-core
    const oauthKeys = [
      'access_token',
      'refresh_token',
      'token_expiry',
      'token_type',
      'oauth_state',
      'oauth_state_expiry',
      'pkce_code_verifier',
      'pkce_code_challenge',
      'pkce_code_challenge_method',
    ];

    await this.removeItems(oauthKeys);
  }

  /**
   * Store OAuth tokens with expiration
   */
  async storeTokens(tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }): Promise<void> {
    // Use the same keys as oauth-core TokenManager
    await this.setItem('access_token', tokens.accessToken);

    if (tokens.refreshToken) {
      await this.setItem('refresh_token', tokens.refreshToken);
    }

    if (tokens.expiresIn) {
      const expiresAt = Date.now() + (tokens.expiresIn * 1000);
      await this.setItem('token_expiry', expiresAt.toString());
    }

    // Set default token type
    await this.setItem('token_type', 'Bearer');
  }

  /**
   * Retrieve stored OAuth tokens
   */
  async getTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    tokenType?: string;
  }> {
    // Use the same keys as oauth-core TokenManager
    const [accessToken, refreshToken, expiresAtStr, tokenType] = await Promise.all([
      this.getItem('access_token'),
      this.getItem('refresh_token'),
      this.getItem('token_expiry'),
      this.getItem('token_type'),
    ]);

    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: tokenType || undefined,
    };
  }

  /**
   * Check if the stored access token is expired
   */
  async isTokenExpired(expiresAt?: number | null): Promise<boolean> {
    // If expiresAt is provided, use it directly
    if (expiresAt !== undefined && expiresAt !== null) {
      return Date.now() >= expiresAt;
    }

    // Otherwise, read from storage using oauth-core key
    const expiresAtStr = await this.getItem('token_expiry');
    if (!expiresAtStr) {
      return true; // No expiration time means we should consider it expired
    }

    const storedExpiresAt = parseInt(expiresAtStr, 10);
    return Date.now() >= storedExpiresAt;
  }
}
