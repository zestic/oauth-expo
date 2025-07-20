import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OAuthCallbackScreen } from '../../components/OAuthCallbackScreen';
import { useOAuthCallback } from '../../hooks/useOAuthCallback';
import type { ExpoOAuthConfig } from '../../types';

// Mock the hook
jest.mock('../../hooks/useOAuthCallback');

const mockUseOAuthCallback = useOAuthCallback as jest.MockedFunction<
  typeof useOAuthCallback
>;

describe('OAuthCallbackScreen', () => {
  const mockConfig: ExpoOAuthConfig = {
    clientId: 'test-client-id',
    endpoints: {
      authorization: 'https://auth.example.com/authorize',
      token: 'https://auth.example.com/token',
    },
    redirectUri: 'myapp://oauth/callback',
    scopes: ['read', 'write'],
  };

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processing state', () => {
    it('should render processing state correctly', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'processing',
        message: 'Processing OAuth callback...',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText, getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByTestId('oauth-callback-processing')).toBeTruthy();
      expect(getByText('Processing OAuth callback...')).toBeTruthy();
    });

    it('should initialize with processing state and auto-start callback', async () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'processing',
        message: 'Processing OAuth callback...',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Verify the hook was called with correct parameters including autoStart: true
      expect(mockUseOAuthCallback).toHaveBeenCalledWith(
        {}, // default empty params
        mockConfig,
        {
          onSuccess: mockOnSuccess,
          onError: mockOnError,
          autoStart: true,
        }
      );

      // Verify the component shows processing state
      expect(getByText('Authenticating...')).toBeTruthy();
      expect(getByText('Processing OAuth callback...')).toBeTruthy();
    });

    it('should render custom processing message', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'processing',
        message: 'Custom processing message',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByText('Custom processing message')).toBeTruthy();
    });
  });

  describe('success state', () => {
    it('should render success state correctly', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'success',
        message: 'Authentication successful!',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText, getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByTestId('oauth-callback-success')).toBeTruthy();
      expect(getByText('Authentication successful!')).toBeTruthy();
    });

    it('should pass onSuccess callback to hook and render success state', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'success',
        message: 'Authentication successful!',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText, getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Verify the hook was called with the onSuccess callback
      expect(mockUseOAuthCallback).toHaveBeenCalledWith(
        {}, // default empty params
        mockConfig,
        {
          onSuccess: mockOnSuccess,
          onError: mockOnError,
          autoStart: true,
        }
      );

      // Verify the component renders success state correctly
      expect(getByTestId('oauth-callback-success')).toBeTruthy();
      expect(getByText('Success!')).toBeTruthy();
      expect(getByText('Authentication successful!')).toBeTruthy();
    });

    it('should render custom success message', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'success',
        message: 'Login completed successfully!',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByText('Login completed successfully!')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should render error state correctly', () => {
      const mockRetry = jest.fn();
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Authentication failed',
        handleCallback: jest.fn(),
        retry: mockRetry,
      });

      const { getByText, getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByTestId('oauth-callback-error')).toBeTruthy();
      expect(getByText('Authentication failed')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should pass onError callback to hook and render error state', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Authentication failed',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText, getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Verify the hook was called with the onError callback
      expect(mockUseOAuthCallback).toHaveBeenCalledWith(
        {}, // default empty params
        mockConfig,
        {
          onSuccess: mockOnSuccess,
          onError: mockOnError,
          autoStart: true,
        }
      );

      // Verify the component renders error state correctly
      expect(getByTestId('oauth-callback-error')).toBeTruthy();
      expect(getByText('Authentication Failed')).toBeTruthy();
      expect(getByText('Authentication failed')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should call retry when Try Again button is pressed', () => {
      const mockRetry = jest.fn();
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Network error',
        handleCallback: jest.fn(),
        retry: mockRetry,
      });

      const { getByText } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should render custom error message', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'User denied access',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(getByText('User denied access')).toBeTruthy();
    });
  });

  describe('custom styling', () => {
    it('should apply custom container style', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'processing',
        message: 'Processing...',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const customStyle = { backgroundColor: 'red' };

      const { getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          style={customStyle}
        />
      );

      const container = getByTestId('oauth-callback-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });

    it('should apply custom text style', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'processing',
        message: 'Processing...',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const customTextStyle = { color: 'blue', fontSize: 20 };

      const { getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          textStyle={customTextStyle}
        />
      );

      const text = getByTestId('oauth-callback-text');
      expect(text.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customTextStyle)])
      );
    });

    it('should apply custom button style', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Error occurred',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const customButtonStyle = { backgroundColor: 'green' };

      const { getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          buttonStyle={customButtonStyle}
        />
      );

      const button = getByTestId('oauth-callback-retry-button');
      expect(button.props.style).toEqual(
        expect.objectContaining(customButtonStyle)
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility labels', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Authentication failed',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      const { getByTestId } = render(
        <OAuthCallbackScreen
          config={mockConfig}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const retryButton = getByTestId('oauth-callback-retry-button');
      expect(retryButton.props.accessibilityLabel).toBe(
        'Retry OAuth authentication'
      );
      expect(retryButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('edge cases', () => {
    it('should handle missing onSuccess callback', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'success',
        message: 'Success!',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      expect(() =>
        render(
          <OAuthCallbackScreen config={mockConfig} onError={mockOnError} />
        )
      ).not.toThrow();
    });

    it('should handle missing onError callback', () => {
      mockUseOAuthCallback.mockReturnValue({
        status: 'error',
        message: 'Error!',
        handleCallback: jest.fn(),
        retry: jest.fn(),
      });

      expect(() =>
        render(
          <OAuthCallbackScreen config={mockConfig} onSuccess={mockOnSuccess} />
        )
      ).not.toThrow();
    });
  });
});
