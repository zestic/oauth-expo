# OAuth Expo Example App

This example app demonstrates how to use the `oauth-expo` library for OAuth authentication in Expo/React Native applications.

## Features Demonstrated

- **OAuth Configuration**: Setting up OAuth config with endpoints and redirect URIs
- **Authentication State**: Managing authentication state with `ExpoOAuthAdapter`
- **OAuth Flows**: Handling both authorization code and magic link flows
- **Callback Handling**: Using `OAuthCallbackScreen` component for callback processing
- **React Hooks**: Using `useOAuthConfig` and `useOAuthCallback` hooks

## Running the Example

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

3. Open the app in Expo Go or a simulator

## Code Structure

### `src/App.tsx`
Main app component showing:
- OAuth configuration setup
- Authentication state management
- Login/logout functionality
- Integration with `ExpoOAuthAdapter`

### `src/CallbackScreen.tsx`
OAuth callback screen examples showing:
- How to handle OAuth callbacks with `OAuthCallbackScreen`
- Integration with Expo Router (if using)
- Success/error handling
- Custom messaging and styling

## OAuth Configuration

The example uses a demo OAuth configuration:

```typescript
const config: ExpoOAuthConfig = {
  clientId: 'demo-client-id',
  endpoints: {
    authorization: 'https://demo-oauth.example.com/oauth/authorize',
    token: 'https://demo-oauth.example.com/oauth/token',
    revocation: 'https://demo-oauth.example.com/oauth/revoke',
  },
  redirectUri: 'oauth-expo-example://auth/callback',
  scopes: ['read', 'write'],
  scheme: 'oauth-expo-example',
  path: 'auth/callback',
};
```

## Real-World Usage

To use this in a real app:

1. **Replace demo configuration** with your actual OAuth provider details
2. **Set up deep linking** in your `app.json` or `expo.json`:
   ```json
   {
     "expo": {
       "scheme": "your-app-scheme"
     }
   }
   ```
3. **Configure OAuth provider** to allow your redirect URI
4. **Handle authentication state** in your app's state management system
5. **Add proper error handling** and user feedback

## Environment Variables

For production apps, use environment variables:

```typescript
const config = useOAuthConfigFromEnv({
  scheme: 'your-app-scheme',
  scopes: ['read', 'write'],
});
```

With these environment variables:
- `EXPO_PUBLIC_AUTH_CLIENT_ID`
- `EXPO_PUBLIC_AUTH_OAUTH_BASE_URL`

## Integration with Expo Router

If using Expo Router, place the callback screen at:
```
app/(app)/auth/callback.tsx
```

And use the provided `CallbackScreen` component as shown in the example.

## Testing OAuth Flows

Since this is a demo app with fake OAuth endpoints, the actual OAuth flow won't complete. In a real app:

1. The login button would open the OAuth provider's authorization page
2. User would authenticate with the provider
3. Provider would redirect back to your app with authorization code
4. The callback screen would exchange the code for tokens
5. User would be authenticated and redirected to the main app

## Next Steps

- Replace demo configuration with real OAuth provider
- Integrate with your app's authentication system
- Add proper error handling and user feedback
- Test with real OAuth flows
- Add token refresh handling
- Implement logout functionality
