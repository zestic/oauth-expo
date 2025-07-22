# @zestic/oauth-expo

[![Test](https://github.com/zestic/oauth-expo/workflows/Test/badge.svg)](https://github.com/zestic/oauth-expo/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/zestic/oauth-expo/branch/main/graph/badge.svg)](https://codecov.io/gh/zestic/oauth-expo)
[![npm version](https://badge.fury.io/js/%40zestic%2Foauth-expo.svg)](https://badge.fury.io/js/%40zestic%2Foauth-expo)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

OAuth 2.0 authentication library for Expo and React Native applications, built on top of [@zestic/oauth-core](https://github.com/zestic/oauth-core).

## Features

- 🔐 **OAuth 2.0 & PKCE Support** - Secure authentication with PKCE flow
- 📱 **Expo & React Native** - Native deep linking and secure storage
- 🎨 **Customizable UI** - Pre-built components with theming support
- 🔧 **TypeScript** - Full type safety and IntelliSense
- 🧪 **Well Tested** - Comprehensive test suite with 80%+ coverage
- 🏗️ **Clean Architecture** - Modular design with oauth-core integration

## Installation

```sh
npm install @zestic/oauth-expo @zestic/oauth-core
```

## Quick Start

```tsx
import React from 'react';
import { ExpoOAuthAdapter, OAuthCallbackScreen } from '@zestic/oauth-expo';
import type { ExpoOAuthConfig } from '@zestic/oauth-expo';

// Configure your OAuth provider
const config: ExpoOAuthConfig = {
  clientId: 'your-client-id',
  redirectUri: 'yourapp://oauth/callback',
  scopes: ['read', 'write'],
  scheme: 'yourapp',
  path: 'oauth/callback',
  endpoints: {
    authorization: 'https://provider.com/oauth/authorize',
    token: 'https://provider.com/oauth/token',
    revocation: 'https://provider.com/oauth/revoke',
  },
};

// Initialize the OAuth adapter
const oauthAdapter = new ExpoOAuthAdapter(config);

// Use in your app
export default function App() {
  const handleLogin = async () => {
    try {
      const result = await oauthAdapter.authenticate();
      console.log('Authentication successful:', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <OAuthCallbackScreen
      config={config}
      onSuccess={(tokens) => console.log('Success:', tokens)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache-2.0

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
