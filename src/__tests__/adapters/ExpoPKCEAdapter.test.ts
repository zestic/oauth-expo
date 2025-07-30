import * as Crypto from 'expo-crypto';
import { ExpoPKCEAdapter } from '../../adapters/ExpoPKCEAdapter';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64: 'BASE64',
  },
}));

const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;

describe('ExpoPKCEAdapter', () => {
  let adapter: ExpoPKCEAdapter;

  beforeEach(() => {
    adapter = new ExpoPKCEAdapter();
    jest.clearAllMocks();
  });

  describe('generateCodeChallenge', () => {
    it('should generate PKCE challenge with S256 method', async () => {
      // Mock the SHA256 hash result (base64)
      mockCrypto.digestStringAsync.mockResolvedValue(
        'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk='
      );

      const result = await adapter.generateCodeChallenge();

      expect(result).toEqual({
        codeChallenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        codeChallengeMethod: 'S256',
        codeVerifier: expect.any(String),
      });

      expect(result.codeVerifier).toHaveLength(128);
      expect(result.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('should generate different code verifiers on each call', async () => {
      mockCrypto.digestStringAsync
        .mockResolvedValueOnce('hash1=')
        .mockResolvedValueOnce('hash2=');

      const result1 = await adapter.generateCodeChallenge();
      const result2 = await adapter.generateCodeChallenge();

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
    });

    it('should convert base64 to base64url format', async () => {
      // Mock base64 with padding and special characters
      mockCrypto.digestStringAsync.mockResolvedValue(
        'dBjftJeZ4CVP+mB92K27uhbUJU1p1r/wW1gFWFOEjXk='
      );

      const result = await adapter.generateCodeChallenge();

      // Should convert + to -, / to _, and remove =
      expect(result.codeChallenge).toBe(
        'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
      );
    });

    it('should call digestStringAsync with correct parameters', async () => {
      mockCrypto.digestStringAsync.mockResolvedValue('test-hash=');

      await adapter.generateCodeChallenge();

      expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
        'SHA256',
        expect.any(String), // the code verifier
        { encoding: 'BASE64' }
      );
    });

    it('should handle crypto errors', async () => {
      mockCrypto.digestStringAsync.mockRejectedValue(new Error('Crypto error'));

      await expect(adapter.generateCodeChallenge()).rejects.toThrow(
        'Crypto error'
      );
    });
  });

  describe('generateState', () => {
    it('should generate a random UUID state', async () => {
      mockCrypto.randomUUID.mockReturnValue(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      const result = await adapter.generateState();

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockCrypto.randomUUID).toHaveBeenCalledTimes(1);
    });

    it('should generate different states on each call', async () => {
      mockCrypto.randomUUID
        .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
        .mockReturnValueOnce('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

      const state1 = await adapter.generateState();
      const state2 = await adapter.generateState();

      expect(state1).not.toBe(state2);
      expect(state1).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(state2).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });

    it('should return a promise', async () => {
      mockCrypto.randomUUID.mockReturnValue('test-uuid');

      const result = adapter.generateState();

      expect(result).toBeInstanceOf(Promise);
      expect(await result).toBe('test-uuid');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', async () => {
      mockCrypto.digestStringAsync.mockResolvedValue('test-hash=');

      const result = await adapter.generateCodeChallenge();

      // The code verifier should be 128 characters
      expect(result.codeVerifier).toHaveLength(128);
    });

    it('should only contain valid characters', async () => {
      mockCrypto.digestStringAsync.mockResolvedValue('test-hash=');

      const result = await adapter.generateCodeChallenge();

      // Should only contain unreserved characters as per RFC 7636
      expect(result.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });
  });

  describe('sha256', () => {
    it('should handle various input strings', async () => {
      const testCases = [
        {
          input: 'test',
          output: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
        },
        {
          input: 'hello world',
          output: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
        },
        { input: '', output: '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' },
      ];

      for (const testCase of testCases) {
        mockCrypto.digestStringAsync.mockResolvedValue(testCase.output);

        await adapter.generateCodeChallenge();

        expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
          'SHA256',
          expect.any(String),
          { encoding: 'BASE64' }
        );
      }
    });
  });

  describe('integration test', () => {
    it('should generate valid PKCE parameters', async () => {
      mockCrypto.randomUUID.mockReturnValue('test-state-uuid');
      mockCrypto.digestStringAsync.mockResolvedValue(
        'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk='
      );

      const challenge = await adapter.generateCodeChallenge();
      const state = await adapter.generateState();

      expect(challenge).toEqual({
        codeChallenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        codeChallengeMethod: 'S256',
        codeVerifier: expect.any(String),
      });

      expect(state).toBe('test-state-uuid');

      // Verify the code verifier is used to generate the challenge
      expect(mockCrypto.digestStringAsync).toHaveBeenCalledWith(
        'SHA256',
        challenge.codeVerifier,
        { encoding: 'BASE64' }
      );
    });
  });
});
