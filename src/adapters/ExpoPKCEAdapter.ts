import * as Crypto from 'expo-crypto';
import type { PKCEAdapter, PKCEChallenge } from '@zestic/oauth-core';

/**
 * Expo PKCE adapter using expo-crypto
 * Provides PKCE code challenge generation and state management
 */
export class ExpoPKCEAdapter implements PKCEAdapter {
  /**
   * Generate PKCE code challenge, method, and verifier
   */
  async generateCodeChallenge(): Promise<PKCEChallenge> {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.sha256(codeVerifier);

    return {
      codeChallenge,
      codeChallengeMethod: 'S256',
      codeVerifier,
    };
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  async generateState(): Promise<string> {
    return Crypto.randomUUID();
  }

  /**
   * Generate a random string for code verifier
   */
  private generateRandomString(length: number): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Generate SHA256 hash for code challenge
   */
  private async sha256(plain: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      plain,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    // Convert base64 to base64url
    return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
  }
}
