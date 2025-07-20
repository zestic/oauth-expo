import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  OAuthCallbackScreen, 
  useOAuthConfig,
  type OAuthCallbackParams,
  type OAuthResult 
} from 'oauth-expo';

/**
 * Example OAuth callback screen using expo-router
 * This would be placed at app/(app)/auth/callback.tsx in a real Expo Router app
 */
export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Convert router params to OAuth callback params
  const oauthParams: OAuthCallbackParams = {
    code: typeof params.code === 'string' ? params.code : undefined,
    state: typeof params.state === 'string' ? params.state : undefined,
    token: typeof params.token === 'string' ? params.token : undefined,
    magic_link_token: typeof params.magic_link_token === 'string' ? params.magic_link_token : undefined,
    flow: typeof params.flow === 'string' ? params.flow : undefined,
    error: typeof params.error === 'string' ? params.error : undefined,
    error_description: typeof params.error_description === 'string' ? params.error_description : undefined,
  };

  // Use the same config as the main app
  const config = useOAuthConfig({
    clientId: 'demo-client-id',
    baseUrl: 'https://demo-oauth.example.com',
    scopes: ['read', 'write'],
    scheme: 'oauth-expo-example',
    path: 'auth/callback',
  });

  const handleSuccess = (result: OAuthResult) => {
    console.log('OAuth success:', result);
    
    // In a real app, you might:
    // 1. Update global auth state
    // 2. Navigate to the main app
    // 3. Store user information
    
    // For demo, navigate back to main screen
    setTimeout(() => {
      router.replace('/');
    }, 1500);
  };

  const handleError = (error: Error) => {
    console.error('OAuth error:', error);
    
    // In a real app, you might:
    // 1. Log the error
    // 2. Show user-friendly error message
    // 3. Navigate back to login
    
    // For demo, navigate back to main screen after delay
    setTimeout(() => {
      router.replace('/');
    }, 3000);
  };

  const handleRetry = () => {
    // Navigate back to login screen
    router.replace('/');
  };

  if (!config) {
    return (
      <OAuthCallbackScreen
        params={{ error: 'Configuration error' }}
        config={{
          clientId: '',
          endpoints: { authorization: '', token: '', revocation: '' },
          redirectUri: '',
          scopes: [],
        }}
        onError={handleError}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <OAuthCallbackScreen
      params={oauthParams}
      config={config}
      onSuccess={handleSuccess}
      onError={handleError}
      onRetry={handleRetry}
      messages={{
        processing: 'Authenticating with OAuth provider...',
        success: 'Authentication successful! Redirecting...',
        error: 'Authentication failed. Please try again.',
        retryButton: 'Back to Login',
      }}
      autoRedirect={true}
      redirectDelay={1500}
    />
  );
}

/**
 * Alternative minimal callback screen example
 */
export function MinimalCallbackExample() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const oauthParams: OAuthCallbackParams = {
    code: typeof params.code === 'string' ? params.code : undefined,
    state: typeof params.state === 'string' ? params.state : undefined,
    token: typeof params.token === 'string' ? params.token : undefined,
    magic_link_token: typeof params.magic_link_token === 'string' ? params.magic_link_token : undefined,
    flow: typeof params.flow === 'string' ? params.flow : undefined,
    error: typeof params.error === 'string' ? params.error : undefined,
    error_description: typeof params.error_description === 'string' ? params.error_description : undefined,
  };

  const config = useOAuthConfig({
    clientId: 'demo-client-id',
    baseUrl: 'https://demo-oauth.example.com',
    scopes: ['read', 'write'],
    scheme: 'oauth-expo-example',
  });

  if (!config) return null;

  return (
    <OAuthCallbackScreen
      params={oauthParams}
      config={config}
      onSuccess={() => router.replace('/')}
      onError={() => router.replace('/')}
    />
  );
}
