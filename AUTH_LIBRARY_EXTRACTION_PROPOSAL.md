# OAuth Callback Library Extraction Proposal

## Overview

This document outlines a proposal to extract the OAuth callback system from the xaddax dashboard into reusable libraries. The current implementation handles multiple OAuth flows (OAuth2 authorization code flow, magic link flows using OAuth token endpoints) and could benefit multiple projects.

## Current Implementation Analysis

### Key Components

1. **Main Callback Screen** (`app/(app)/auth/callback.tsx`)
   - Handles OAuth2 authorization code flow
   - Processes magic link authentication (login and registration)
   - Manages UI states (processing, success, error)
   - Integrates with Expo Router navigation

2. **Core Services**
   - `AuthService`: PKCE generation, token exchange, GraphQL mutations
   - `GraphQLClient`: GraphQL requests with authentication headers
   - `StorageService`: Cross-platform storage abstraction
   - `UserService`: User data management

3. **Configuration** (`config/auth.ts`)
   - Environment-based OAuth configuration
   - Expo-specific redirect URI generation
   - Storage key management

### Authentication Flows Handled

```typescript
// Current callback detection logic
if (params.flow === 'registration' && (params.token || params.magic_link_token)) {
  await handleRegistrationCallback();
} else if (params.flow === 'login' && (params.token || params.magic_link_token)) {
  await handleMagicLinkCallback();
} else if (params.magic_link_token || params.token) {
  await handleMagicLinkCallback(); // Fallback
} else {
  await handleOAuthCallback(); // OAuth2 authorization code flow
}
```

## Proposed Library Structure

### Core Package: `@zestic/oauth-core`

**Purpose**: Framework-agnostic OAuth authentication logic

```
@zestic/oauth-core/
├── src/
│   ├── core/
│   │   ├── OAuthCore.ts          # Main OAuth orchestrator
│   │   ├── FlowRegistry.ts       # Flow handler registry
│   │   ├── PKCEManager.ts        # PKCE generation/validation
│   │   ├── TokenManager.ts       # Token exchange and storage
│   │   └── StateValidator.ts     # CSRF state validation
│   ├── flows/
│   │   ├── FlowHandler.ts        # Base flow handler interface
│   │   ├── AuthorizationCodeFlowHandler.ts  # OAuth2 authorization code flow
│   │   ├── MagicLinkFlowHandler.ts          # Magic link flows
│   │   └── index.ts              # Flow exports
│   ├── types/
│   │   ├── OAuthTypes.ts         # Common OAuth interfaces
│   │   ├── ConfigTypes.ts        # Configuration interfaces
│   │   └── FlowTypes.ts          # Flow handler types
│   ├── utils/
│   │   ├── UrlParser.ts          # URL parameter parsing
│   │   └── ErrorHandler.ts       # Standardized error handling
│   └── index.ts                  # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

#### Example Core API

```typescript
// OAuthCore.ts - Simplified example showing the flow handler approach
export class OAuthCore {
  private flowRegistry = new FlowRegistry();

  constructor(
    private config: OAuthConfig,
    private adapters: OAuthAdapters,
    flowConfig?: FlowConfiguration
  ) {
    this.initializeFlows(flowConfig);
  }

  async handleCallback(params: URLSearchParams, explicitFlow?: string): Promise<OAuthResult> {
    let handler: FlowHandler | undefined;

    // Try explicit flow first if specified
    if (explicitFlow) {
      handler = this.flowRegistry.getHandler(explicitFlow);
      if (!handler) {
        throw new OAuthError(`Unknown flow: ${explicitFlow}`, 'UNKNOWN_FLOW');
      }
    } else {
      // Auto-detect flow using registered handlers
      handler = this.flowRegistry.detectFlow(params, this.config);
    }

    if (!handler) {
      throw new OAuthError('No suitable flow handler found', 'NO_FLOW_HANDLER');
    }

    // Delegate to the appropriate flow handler
    return handler.handle(params, this.adapters, this.config);
  }

  private initializeFlows(flowConfig?: FlowConfiguration): void {
    // Register built-in flows (detailed implementation shown in Flow Handler Architecture section)
    this.flowRegistry.register(new AuthorizationCodeFlowHandler());
    this.flowRegistry.register(new MagicLinkFlowHandler());

    // Register custom flows if provided
    if (flowConfig?.customFlows) {
      flowConfig.customFlows.forEach(flow => this.flowRegistry.register(flow));
    }
  }
}

// Types
export interface OAuthConfig {
  clientId: string;
  endpoints: {
    authorization: string;
    token: string;
    revocation: string;
  };
  redirectUri: string;
  scopes: string[];
  flows?: FlowConfiguration;         // Optional flow configuration
}

export interface OAuthAdapters {
  storage: StorageAdapter;
  http: HttpAdapter;
  pkce: PKCEAdapter;
}

export interface OAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}
```

### Expo Adapter: `@zestic/oauth-expo`

**Purpose**: Expo/React Native specific OAuth implementation

```
@zestic/oauth-expo/
├── src/
│   ├── ExpoOAuthAdapter.ts       # Expo-specific implementations
│   ├── components/
│   │   └── OAuthCallbackScreen.tsx # Reusable callback screen
│   ├── hooks/
│   │   ├── useOAuthCallback.ts   # React hook for callback logic
│   │   └── useOAuthConfig.ts     # Configuration hook
│   ├── adapters/
│   │   ├── ExpoStorageAdapter.ts # AsyncStorage implementation
│   │   ├── ExpoHttpAdapter.ts    # Fetch implementation
│   │   └── ExpoPKCEAdapter.ts    # expo-auth-session PKCE
│   └── index.ts
├── package.json
└── README.md
```

#### Example Expo Implementation

```typescript
// ExpoOAuthAdapter.ts
import { OAuthCore, OAuthConfig, OAuthAdapters } from '@zestic/oauth-core';
import * as AuthSession from 'expo-auth-session';

export class ExpoOAuthAdapter {
  private oauthCore: OAuthCore;

  constructor(config: OAuthConfig) {
    const adapters: OAuthAdapters = {
      storage: new ExpoStorageAdapter(),
      http: new ExpoHttpAdapter(),
      pkce: new ExpoPKCEAdapter(),
    };

    // OAuthCore uses the flow handler architecture (see Flow Handler Architecture section)
    this.oauthCore = new OAuthCore(config, adapters);
  }

  async handleCallback(params: Record<string, any>): Promise<OAuthResult> {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) urlParams.set(key, String(value));
    });

    return this.oauthCore.handleCallback(urlParams);
  }
}

// useOAuthCallback.ts - React Hook
export function useOAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');
  const params = useLocalSearchParams();
  const router = useRouter();

  const handleCallback = useCallback(async () => {
    try {
      const adapter = new ExpoOAuthAdapter(oauthConfig);
      const result = await adapter.handleCallback(params);

      if (result.success) {
        setStatus('success');
        setMessage('OAuth authentication successful!');
        // Handle successful OAuth (store tokens, update state, navigate)
        setTimeout(() => router.replace('/'), 1500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }, [params, router]);

  return { status, message, handleCallback };
}

// OAuthCallbackScreen.tsx - Reusable Component
export function OAuthCallbackScreen() {
  const { status, message, handleCallback } = useOAuthCallback();

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <View style={styles.container}>
      {status === 'processing' && <ActivityIndicator size="large" />}
      <Text>{message}</Text>
      {status === 'error' && (
        <Button title="Retry" onPress={() => router.replace('/login')} />
      )}
    </View>
  );
}
```

## Migration Strategy

### Phase 1: Extract Core Logic
1. Create `@zestic/oauth-core` package
2. Move PKCE, token exchange, and state validation logic
3. Create abstract interfaces for storage and HTTP clients
4. Design optimal API without legacy constraints

### Phase 2: Create Expo Adapter
1. Create `@zestic/oauth-expo` package
2. Implement Expo-specific storage and HTTP adapters
3. Create reusable React hooks and components
4. Migrate current app to use the library

### Phase 3: Enhance and Extend
1. Add support for other frameworks (Next.js, vanilla React)
2. Add more authentication methods
3. Improve error handling and logging
4. Comprehensive documentation and examples

## Benefits

1. **Consistency**: Same OAuth logic across all zestic applications
2. **Maintainability**: Fix OAuth bugs once, benefit everywhere
3. **Developer Experience**: Easier onboarding with standardized OAuth patterns
4. **Testing**: Comprehensive test coverage for critical OAuth flows
5. **Documentation**: Centralized OAuth documentation
6. **Flexibility**: Support for multiple frameworks and platforms

## Implementation Considerations

### Configuration Flexibility
```typescript
// Environment-based OAuth configuration
const oauthConfig: OAuthConfig = {
  clientId: process.env.EXPO_PUBLIC_AUTH_CLIENT_ID!,
  endpoints: {
    authorization: `${process.env.EXPO_PUBLIC_AUTH_OAUTH_BASE_URL}/oauth/authorize`,
    token: `${process.env.EXPO_PUBLIC_AUTH_OAUTH_BASE_URL}/oauth/token`,
    revocation: `${process.env.EXPO_PUBLIC_AUTH_OAUTH_BASE_URL}/oauth/revoke`,
  },
  redirectUri: AuthSession.makeRedirectUri({ scheme: 'zestic', path: 'auth/callback' }),
  scopes: ['read', 'write'],
};
```

### Storage Abstraction
```typescript
export interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  removeItems(keys: string[]): Promise<void>;
}

// Expo implementation
export class ExpoStorageAdapter implements StorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
  // ... other methods
}
```

### Error Handling
```typescript
export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export const OAUTH_ERROR_CODES = {
  INVALID_STATE: 'invalid_state',
  TOKEN_EXCHANGE_FAILED: 'token_exchange_failed',
  MISSING_PKCE: 'missing_pkce_parameters',
  NETWORK_ERROR: 'network_error',
  INVALID_GRANT: 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
} as const;
```

## Flow Handler Architecture

### 1. Core Flow Handler Interface

```typescript
// FlowHandler interface that all flows must implement
export interface FlowHandler {
  readonly name: string;
  readonly priority: number; // Lower numbers = higher priority
  
  // Determine if this handler can process the given parameters
  canHandle(params: URLSearchParams, config: OAuthConfig): boolean;
  
  // Process the OAuth flow
  handle(
    params: URLSearchParams, 
    adapters: OAuthAdapters, 
    config: OAuthConfig
  ): Promise<OAuthResult>;
  
  // Optional validation step
  validate?(params: URLSearchParams, config: OAuthConfig): Promise<boolean>;
}
```

### 2. Flow Registry System

```typescript
// FlowRegistry.ts
export class FlowRegistry {
  private handlers = new Map<string, FlowHandler>();
  
  register(handler: FlowHandler): void {
    this.handlers.set(handler.name, handler);
  }
  
  unregister(name: string): void {
    this.handlers.delete(name);
  }
  
  getHandler(name: string): FlowHandler | undefined {
    return this.handlers.get(name);
  }
  
  // Auto-detect which flow to use based on parameters
  detectFlow(params: URLSearchParams, config: OAuthConfig): FlowHandler | undefined {
    const sortedHandlers = Array.from(this.handlers.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const handler of sortedHandlers) {
      if (handler.canHandle(params, config)) {
        return handler;
      }
    }
    
    return undefined;
  }
  
  getAllHandlers(): FlowHandler[] {
    return Array.from(this.handlers.values());
  }
}
```

### 3. Built-in Flow Handlers

```typescript
// AuthorizationCodeFlowHandler.ts
export class AuthorizationCodeFlowHandler implements FlowHandler {
  readonly name = 'authorization_code';
  readonly priority = 100; // Standard OAuth flow, lower priority
  
  canHandle(params: URLSearchParams): boolean {
    return params.has('code') && !params.has('token') && !params.has('magic_link_token');
  }
  
  async handle(params: URLSearchParams, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    const code = params.get('code');
    const state = params.get('state');
    
    // Validate state for CSRF protection
    if (state && !(await this.validateState(state, adapters))) {
      throw new OAuthError('Invalid state parameter', 'INVALID_STATE');
    }
    
    // Exchange authorization code for tokens
    return this.exchangeCodeForTokens(code!, adapters, config);
  }
  
  private async validateState(state: string, adapters: OAuthAdapters): Promise<boolean> {
    const storedState = await adapters.storage.getItem('oauth_state');
    return storedState === state;
  }
  
  private async exchangeCodeForTokens(code: string, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    // Implementation for code exchange
  }
}

// MagicLinkFlowHandler.ts
export class MagicLinkFlowHandler implements FlowHandler {
  readonly name = 'magic_link';
  readonly priority = 50; // Higher priority than standard OAuth
  
  canHandle(params: URLSearchParams): boolean {
    return params.has('token') || params.has('magic_link_token');
  }
  
  async handle(params: URLSearchParams, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    const token = params.get('token') || params.get('magic_link_token');
    const flow = params.get('flow'); // 'login' or 'registration'
    
    // Handle magic link token exchange
    return this.exchangeMagicLinkToken(token!, flow, adapters, config);
  }
  
  private async exchangeMagicLinkToken(token: string, flow: string | null, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    // Implementation for magic link token exchange
  }
}
```

### 4. Enhanced OAuthCore with Flow Support

```typescript
// OAuthCore.ts
export class OAuthCore {
  private flowRegistry = new FlowRegistry();
  
  constructor(
    private config: OAuthConfig, 
    private adapters: OAuthAdapters,
    flowConfig?: FlowConfiguration
  ) {
    this.initializeFlows(flowConfig);
  }
  
  private initializeFlows(flowConfig?: FlowConfiguration): void {
    // Register built-in flows
    this.flowRegistry.register(new AuthorizationCodeFlowHandler());
    this.flowRegistry.register(new MagicLinkFlowHandler());
    
    // Register custom flows if provided
    if (flowConfig?.customFlows) {
      flowConfig.customFlows.forEach(flow => {
        this.flowRegistry.register(flow);
      });
    }
    
    // Disable flows if specified
    if (flowConfig?.disabledFlows) {
      flowConfig.disabledFlows.forEach(flowName => {
        this.flowRegistry.unregister(flowName);
      });
    }
  }
  
  async handleCallback(params: URLSearchParams, explicitFlow?: string): Promise<OAuthResult> {
    let handler: FlowHandler | undefined;
    
    // Try explicit flow first if specified
    if (explicitFlow) {
      handler = this.flowRegistry.getHandler(explicitFlow);
      if (!handler) {
        throw new OAuthError(`Unknown flow: ${explicitFlow}`, 'UNKNOWN_FLOW');
      }
    } else {
      // Auto-detect flow
      handler = this.flowRegistry.detectFlow(params, this.config);
    }
    
    if (!handler) {
      throw new OAuthError('No suitable flow handler found', 'NO_FLOW_HANDLER');
    }
    
    // Validate if handler supports validation
    if (handler.validate && !(await handler.validate(params, this.config))) {
      throw new OAuthError('Flow validation failed', 'FLOW_VALIDATION_FAILED');
    }
    
    // Handle the flow
    return handler.handle(params, this.adapters, this.config);
  }
  
  // Allow runtime flow registration
  registerFlow(handler: FlowHandler): void {
    this.flowRegistry.register(handler);
  }
  
  unregisterFlow(name: string): void {
    this.flowRegistry.unregister(name);
  }
}
```

### 5. Flow Configuration Interface

```typescript
// Configuration types
export interface FlowConfiguration {
  enabledFlows?: string[];           // Only enable specific flows
  disabledFlows?: string[];          // Disable specific flows
  customFlows?: FlowHandler[];       // Register custom flow handlers
  defaultFlow?: string;              // Default flow if detection fails
  detectionStrategy?: 'auto' | 'priority' | 'explicit';
}

export interface OAuthConfig {
  clientId: string;
  endpoints: {
    authorization: string;
    token: string;
    revocation: string;
  };
  redirectUri: string;
  scopes: string[];
  flows?: FlowConfiguration;         // Flow configuration
}
```

## Usage Examples for Different Apps

### Simple OAuth App
```typescript
const config: OAuthConfig = {
  clientId: 'app1',
  // ... other config
  flows: {
    enabledFlows: ['authorization_code'], // Only standard OAuth
  }
};
```

### Magic Link App (Current Dashboard)
```typescript
const config: OAuthConfig = {
  clientId: 'dashboard',
  // ... other config
  flows: {
    enabledFlows: ['authorization_code', 'magic_link'],
  }
};
```

### Enterprise App with Custom SAML Flow
```typescript
class SAMLAssertionFlowHandler implements FlowHandler {
  readonly name = 'saml_assertion';
  readonly priority = 10; // High priority
  
  canHandle(params: URLSearchParams): boolean {
    return params.has('saml_response');
  }
  
  async handle(params: URLSearchParams, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    const samlResponse = params.get('saml_response');
    // Custom SAML processing logic
    return this.processSAMLAssertion(samlResponse!, adapters, config);
  }
  
  private async processSAMLAssertion(samlResponse: string, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    // Implementation for SAML assertion processing
  }
}

const config: OAuthConfig = {
  clientId: 'enterprise-app',
  // ... other config
  flows: {
    enabledFlows: ['authorization_code', 'saml_assertion'],
    customFlows: [new SAMLAssertionFlowHandler()],
  }
};
```

### Mobile App with Device Code Flow
```typescript
class DeviceCodeFlowHandler implements FlowHandler {
  readonly name = 'device_code';
  readonly priority = 20;
  
  canHandle(params: URLSearchParams): boolean {
    return params.has('device_code');
  }
  
  async handle(params: URLSearchParams, adapters: OAuthAdapters, config: OAuthConfig): Promise<OAuthResult> {
    // Device code flow implementation
  }
}

const config: OAuthConfig = {
  clientId: 'mobile-app',
  // ... other config
  flows: {
    customFlows: [new DeviceCodeFlowHandler()],
    enabledFlows: ['device_code', 'authorization_code'],
  }
};
```

## Benefits of This Approach

1. **Extensibility**: Apps can add custom flows without modifying core
2. **Flexibility**: Each app configures only the flows it needs
3. **Maintainability**: Flow logic is isolated and testable
4. **Performance**: Only enabled flows are registered and checked
5. **Future-proof**: New OAuth flows can be added as plugins
6. **Backward compatibility**: Existing flows continue to work

This architecture ensures that `oauth-core` can handle any OAuth flow while remaining lightweight and focused for each specific app's needs.


## Next Steps

1. **Create core package structure** with TypeScript configuration
2. **Extract and refactor** existing AuthService methods
3. **Implement adapter interfaces** for storage and HTTP clients
4. **Create Expo adapter** with React hooks and components
5. **Migrate current implementation** to use the new library
6. **Add comprehensive tests** for core authentication logic
7. **Create documentation** and usage examples



## Conclusion

This OAuth library extraction would provide significant value for zestic's multi-app ecosystem, ensuring consistent, maintainable, and well-tested OAuth flows across all applications while maintaining flexibility for different frameworks and platforms. The focus on OAuth specifically makes the library more targeted and easier to understand than a generic "auth" library.
