// Main OAuth adapter
export { ExpoOAuthAdapter } from './ExpoOAuthAdapter';

// Adapters
export {
  ExpoStorageAdapter,
  ExpoHttpAdapter,
  ExpoPKCEAdapter,
} from './adapters';

// Components
export { OAuthCallbackScreen } from './components';

// Hooks
export { useOAuthCallback, useOAuthConfig } from './hooks';

// Types - Import core types from oauth-core and Expo-specific types from local types
export type {
  // Core types from oauth-core
  OAuthAdapters,
  OAuthResult,
  StorageAdapter,
  HttpAdapter,
  PKCEAdapter,
  HttpResponse,
  FlowConfiguration,
  PKCEChallenge,
  TokenExchangeRequest,
  TokenResponse,
  OAuthError,
  OAuthErrorCode,
  // Expo-specific types
  ExpoOAuthConfig,
  OAuthCallbackParams,
  TokenData,
  PKCEParams,
  OAuthCallbackStatus,
  OAuthCallbackHookResult,
  OAuthTheme,
  OAuthVariant,
  OAuthThemeConfig,
  OAuthComponentOverrides,
} from './types';

// Re-export everything as default for convenience
import { ExpoOAuthAdapter } from './ExpoOAuthAdapter';
import { OAuthCallbackScreen } from './components';
import { useOAuthCallback, useOAuthConfig } from './hooks';

import { OAUTH_ERROR_CODES } from '@zestic/oauth-core';

export default {
  ExpoOAuthAdapter,
  OAuthCallbackScreen,
  useOAuthCallback,
  useOAuthConfig,
  OAUTH_ERROR_CODES,
};
