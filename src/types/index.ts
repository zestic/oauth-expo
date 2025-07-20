// Import core types from oauth-core
export type {
  OAuthConfig,
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
  OAuthErrorCode
} from '@zestic/oauth-core';

/**
 * OAuth configuration for Expo applications
 * Extends the core OAuthConfig with Expo-specific properties
 */
export interface ExpoOAuthConfig extends OAuthConfig {
  scheme: string;
  path: string;
  // Override endpoints to make revocation optional for Expo
  endpoints: {
    authorization: string;
    token: string;
    revocation?: string;
  };
}

/**
 * OAuth callback parameters that can be received from various flows
 */
export interface OAuthCallbackParams {
  // OAuth2 Authorization Code Flow
  code?: string;
  state?: string;
  
  // Magic Link Flow
  token?: string;
  magic_link_token?: string;
  flow?: 'login' | 'registration' | 'magic_link';
  
  // Error parameters
  error?: string;
  error_description?: string;
  error_uri?: string;
  
  // Additional parameters
  [key: string]: string | null | undefined;
}

// OAuthResult is now imported from oauth-core above

/**
 * Token data structure
 */
export interface TokenData {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  tokenType?: string;
  scope?: string;
}

/**
 * PKCE parameters
 */
export interface PKCEParams {
  codeChallenge: string;
  codeChallengeMethod: string;
  codeVerifier: string;
  state: string;
}

// FlowConfiguration is now imported from oauth-core above

/**
 * OAuth callback hook status
 */
export type OAuthCallbackStatus = 'processing' | 'success' | 'error';

/**
 * OAuth status (alias for backward compatibility)
 */
export type OAuthStatus = OAuthCallbackStatus;

/**
 * OAuth callback hook result
 */
export interface OAuthCallbackHookResult {
  status: OAuthCallbackStatus;
  message: string;
  handleCallback: (params?: OAuthCallbackParams) => Promise<void>;
  retry: () => void;
}

/**
 * Use OAuth callback result (alias for backward compatibility)
 */
export type UseOAuthCallbackResult = OAuthCallbackHookResult;

// StorageAdapter, HttpAdapter, PKCEAdapter, and OAuthAdapters are now imported from oauth-core above

// OAuthError and OAUTH_ERROR_CODES are now imported from oauth-core above

/**
 * Theme variants for OAuth components
 */
export type OAuthTheme = 'light' | 'dark' | 'auto';

/**
 * Component variants for OAuth components
 */
export type OAuthVariant = 'minimal' | 'card' | 'fullscreen' | 'modal';

/**
 * Unistyles-compatible theme interface
 */
export interface OAuthThemeConfig {
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    success: string;
    error: string;
    warning: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string };
    h2: { fontSize: number; fontWeight: string };
    h3: { fontSize: number; fontWeight: string };
    body: { fontSize: number; fontWeight: string };
    caption: { fontSize: number; fontWeight: string };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}

/**
 * Custom component overrides for OAuth components
 */
export interface OAuthComponentOverrides {
  LoadingIndicator?: React.ComponentType<any>;
  SuccessIcon?: React.ComponentType<any>;
  ErrorIcon?: React.ComponentType<any>;
  Container?: React.ComponentType<any>;
  Title?: React.ComponentType<any>;
  Message?: React.ComponentType<any>;
  Button?: React.ComponentType<any>;
}
