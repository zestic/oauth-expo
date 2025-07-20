import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  ExpoOAuthAdapter,
  useOAuthConfig,
  OAuthCallbackScreen,
  type ExpoOAuthConfig
} from 'oauth-expo';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthAdapter, setOAuthAdapter] = useState<ExpoOAuthAdapter | null>(null);

  // Example OAuth configuration
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

  useEffect(() => {
    const adapter = new ExpoOAuthAdapter(config);
    setOAuthAdapter(adapter);

    // Check if user is already authenticated
    adapter.isAuthenticated().then(authenticated => {
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    if (!oauthAdapter) return;

    try {
      const authResult = await oauthAdapter.generateAuthorizationUrl();

      // In a real app, you would open the auth URL in a browser
      // For demo purposes, we'll just show an alert
      Alert.alert(
        'OAuth Demo',
        `In a real app, this would open:\n${authResult.authUrl.substring(0, 100)}...`,
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleLogout = async () => {
    if (!oauthAdapter) return;

    try {
      await oauthAdapter.logout();
      setIsAuthenticated(false);
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth Expo Example</Text>

      <Text style={styles.status}>
        Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Text>

      {!isAuthenticated ? (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login with OAuth</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        This is a demo app showing oauth-expo library integration.
        {'\n\n'}
        Features demonstrated:
        {'\n'}• OAuth configuration
        {'\n'}• Authentication state management
        {'\n'}• Login/logout flows
        {'\n'}• ExpoOAuthAdapter usage
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
