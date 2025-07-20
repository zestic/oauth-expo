import { useState, useCallback, useEffect } from 'react';
import { ExpoOAuthAdapter } from '../ExpoOAuthAdapter';
import type {
  OAuthCallbackParams,
  OAuthStatus,
  UseOAuthCallbackResult,
  ExpoOAuthConfig,
  OAuthResult,
} from '../types';

/**
 * React hook for handling OAuth callback processing
 * Manages the OAuth callback flow state and provides handlers
 */
export function useOAuthCallback(
  params: OAuthCallbackParams,
  config: ExpoOAuthConfig,
  options?: {
    onSuccess?: (result: OAuthResult) => void;
    onError?: (error: Error) => void;
    autoStart?: boolean;
  }
): UseOAuthCallbackResult {
  const [status, setStatus] = useState<OAuthStatus>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  const handleCallback = useCallback(async (): Promise<void> => {
    try {
      setStatus('processing');
      setMessage('Processing OAuth callback...');

      // Create ExpoOAuthAdapter instance
      const adapter = new ExpoOAuthAdapter(config);

      // Use adapter to handle the callback
      const result = await adapter.handleCallback(params);

      if (result.success) {
        setStatus('success');
        setMessage('Authentication successful');
        options?.onSuccess?.(result);
      } else {
        throw new Error(result.error || 'OAuth authentication failed');
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [params, config, options]);

  const retry = useCallback(() => {
    handleCallback();
  }, [handleCallback]);

  // Auto-start if enabled (default: true)
  useEffect(() => {
    if (options?.autoStart !== false) {
      handleCallback();
    }
  }, [handleCallback, options?.autoStart]);

  return {
    status,
    message,
    handleCallback,
    retry,
  };
}


