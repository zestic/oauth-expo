import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoStorageAdapter } from '../../adapters/ExpoStorageAdapter';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('ExpoStorageAdapter', () => {
  let adapter: ExpoStorageAdapter;

  beforeEach(() => {
    adapter = new ExpoStorageAdapter();
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store item successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await adapter.setItem('test-key', 'test-value');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should throw error when storage fails', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.setItem.mockRejectedValue(error);

      await expect(adapter.setItem('test-key', 'test-value')).rejects.toThrow(
        'Failed to store item with key "test-key": Error: Storage error'
      );
    });
  });

  describe('getItem', () => {
    it('should retrieve item successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-value');

      const result = await adapter.getItem('test-key');

      expect(result).toBe('test-value');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null when item does not exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await adapter.getItem('non-existent-key');

      expect(result).toBeNull();
    });

    it('should throw error when retrieval fails', async () => {
      const error = new Error('Retrieval error');
      mockAsyncStorage.getItem.mockRejectedValue(error);

      await expect(adapter.getItem('test-key')).rejects.toThrow(
        'Failed to retrieve item with key "test-key": Error: Retrieval error'
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await adapter.removeItem('test-key');

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should throw error when removal fails', async () => {
      const error = new Error('Removal error');
      mockAsyncStorage.removeItem.mockRejectedValue(error);

      await expect(adapter.removeItem('test-key')).rejects.toThrow(
        'Failed to remove item with key "test-key": Error: Removal error'
      );
    });
  });

  describe('removeItems', () => {
    it('should remove multiple items successfully', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();

      await adapter.removeItems(['key1', 'key2', 'key3']);

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should throw error when multi-removal fails', async () => {
      const error = new Error('Multi-removal error');
      mockAsyncStorage.multiRemove.mockRejectedValue(error);

      await expect(adapter.removeItems(['key1', 'key2'])).rejects.toThrow(
        'Failed to remove items with keys "key1, key2": Error: Multi-removal error'
      );
    });
  });

  describe('clearOAuthStorage', () => {
    it('should clear all OAuth-related storage', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();

      await adapter.clearOAuthStorage();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'access_token',
        'refresh_token',
        'token_expiry',
        'token_type',
        'oauth_state',
        'oauth_state_expiry',
        'pkce_code_verifier',
        'pkce_code_challenge',
        'pkce_code_challenge_method',
      ]);
    });
  });

  describe('storeTokens', () => {
    it('should store access token only', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await adapter.storeTokens({
        accessToken: 'access-token-123',
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token-123');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token_type', 'Bearer');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should store access and refresh tokens', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await adapter.storeTokens({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token-123');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token-456');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token_type', 'Bearer');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should store tokens with expiration', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      const mockDate = new Date('2024-01-01T00:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      await adapter.storeTokens({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600, // 1 hour
      });

      const expectedExpiresAt = mockDate.getTime() + (3600 * 1000);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token-123');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token-456');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token_expiry', expectedExpiresAt.toString());
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token_type', 'Bearer');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(4);
    });
  });

  describe('getTokens', () => {
    it('should retrieve all tokens', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456')
        .mockResolvedValueOnce('1704067200000') // 2024-01-01T00:00:00Z
        .mockResolvedValueOnce('Bearer');

      const result = await adapter.getTokens();

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: 1704067200000,
        tokenType: 'Bearer',
      });
    });

    it('should handle missing tokens', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await adapter.getTokens();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        tokenType: undefined,
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no expiration time is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await adapter.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when token is expired', async () => {
      const pastTime = Date.now() - 1000; // 1 second ago
      mockAsyncStorage.getItem.mockResolvedValue(pastTime.toString());

      const result = await adapter.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false when token is not expired', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      mockAsyncStorage.getItem.mockResolvedValue(futureTime.toString());

      const result = await adapter.isTokenExpired();

      expect(result).toBe(false);
    });
  });
});
