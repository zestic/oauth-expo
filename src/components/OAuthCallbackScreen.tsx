import { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useOAuthCallback } from '../hooks';
import type {
  OAuthCallbackParams,
  ExpoOAuthConfig,
  OAuthResult,
  OAuthTheme,
  OAuthVariant,
  OAuthThemeConfig,
  OAuthComponentOverrides,
} from '../types';

/**
 * Props for OAuthCallbackScreen component
 */
export interface OAuthCallbackScreenProps {
  /** OAuth callback parameters from URL (optional - will be extracted from URL if not provided) */
  params?: OAuthCallbackParams;
  /** OAuth configuration */
  config: ExpoOAuthConfig;
  /** Callback when OAuth succeeds */
  onSuccess?: (result: OAuthResult) => void;
  /** Callback when OAuth fails */
  onError?: (error: Error) => void;
  /** Callback for retry button */
  onRetry?: () => void;
  /** Custom styles (object with specific style properties) */
  styles?: {
    container?: ViewStyle;
    content?: ViewStyle;
    title?: TextStyle;
    message?: TextStyle;
    button?: ViewStyle;
    buttonText?: TextStyle;
  };
  /** Custom style (single style object for container) */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Custom button style */
  buttonStyle?: ViewStyle;
  /** Theme variant */
  theme?: OAuthTheme;
  /** Component variant */
  variant?: OAuthVariant;
  /** Unistyles theme configuration */
  themeConfig?: OAuthThemeConfig;
  /** Custom component overrides */
  components?: OAuthComponentOverrides;
  /** Custom messages */
  messages?: {
    processing?: string;
    success?: string;
    error?: string;
    retryButton?: string;
  };
  /** Whether to auto-redirect on success */
  autoRedirect?: boolean;
  /** Delay before auto-redirect (ms) */
  redirectDelay?: number;
}

/**
 * Reusable OAuth callback screen component
 * Handles OAuth callback processing with loading states and error handling
 */
export function OAuthCallbackScreen({
  params = {},
  config,
  onSuccess,
  onError,
  onRetry,
  styles: customStyles,
  style,
  textStyle,
  buttonStyle,
  theme = 'auto',
  variant = 'fullscreen',
  themeConfig,
  components,
  messages,
  autoRedirect = true,
  redirectDelay = 1500,
}: OAuthCallbackScreenProps) {
  // Get theme-aware styles
  const themedStyles = getThemedStyles(theme, variant, themeConfig);

  const { status, message, retry } = useOAuthCallback(params, config, {
    onSuccess,
    onError,
    autoStart: true,
  });

  // Handle auto-redirect on success
  useEffect(() => {
    if (status === 'success' && autoRedirect && onSuccess) {
      const timer = setTimeout(() => {
        // This will be handled by the onSuccess callback
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, autoRedirect, redirectDelay, onSuccess]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      retry();
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return (
          messages?.processing || message || 'Processing OAuth callback...'
        );
      case 'success':
        return messages?.success || message || 'Authentication successful!';
      case 'error':
        return messages?.error || message;
      default:
        return message;
    }
  };

  const getStatusIcon = () => {
    const LoadingIndicator = components?.LoadingIndicator || ActivityIndicator;
    const SuccessIcon = components?.SuccessIcon;
    const ErrorIcon = components?.ErrorIcon;

    switch (status) {
      case 'processing':
        return (
          <LoadingIndicator size="large" color={themedStyles.colors.primary} />
        );
      case 'success':
        return SuccessIcon ? (
          <SuccessIcon />
        ) : (
          <Text
            style={[
              themedStyles.icon,
              themedStyles.successIcon,
              customStyles?.title,
            ]}
          >
            ✓
          </Text>
        );
      case 'error':
        return ErrorIcon ? (
          <ErrorIcon />
        ) : (
          <Text
            style={[
              themedStyles.icon,
              themedStyles.errorIcon,
              customStyles?.title,
            ]}
          >
            ✗
          </Text>
        );
      default:
        return null;
    }
  };

  const Container = components?.Container || View;
  const Title = components?.Title || Text;
  const Message = components?.Message || Text;
  const Button = components?.Button || TouchableOpacity;

  return (
    <Container
      style={[themedStyles.container, customStyles?.container]}
      testID={`oauth-callback-${status}`}
    >
      <View
        style={[themedStyles.content, customStyles?.content, style]}
        testID="oauth-callback-container"
      >
        {getStatusIcon()}

        <Title
          style={[themedStyles.title, customStyles?.title]}
          testID="oauth-callback-title"
        >
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </Title>

        <Message
          style={[themedStyles.message, customStyles?.message, textStyle]}
          testID="oauth-callback-text"
        >
          {getStatusMessage()}
        </Message>

        {status === 'error' && (
          <Button
            style={[themedStyles.button, customStyles?.button, buttonStyle]}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry OAuth authentication"
            testID="oauth-callback-retry-button"
          >
            <Text style={[themedStyles.buttonText, customStyles?.buttonText]}>
              {messages?.retryButton || 'Try Again'}
            </Text>
          </Button>
        )}
      </View>
    </Container>
  );
}

/**
 * Minimal OAuth callback screen with just loading indicator
 */
export function MinimalOAuthCallbackScreen({
  params,
  config,
  onSuccess,
  onError,
}: Pick<
  OAuthCallbackScreenProps,
  'params' | 'config' | 'onSuccess' | 'onError'
>) {
  useOAuthCallback(params, config, { onSuccess, onError });

  return (
    <View style={minimalStyles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={minimalStyles.text}>Authenticating...</Text>
    </View>
  );
}

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

/**
 * Default theme configurations
 */
const defaultThemes: Record<OAuthTheme, OAuthThemeConfig> = {
  light: {
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      primary: '#007AFF',
      secondary: '#5856d6',
      text: '#000000',
      textSecondary: '#666666',
      success: '#34c759',
      error: '#ff3b30',
      warning: '#ff9500',
      border: '#e1e1e1',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '700' },
      h2: { fontSize: 24, fontWeight: '600' },
      h3: { fontSize: 20, fontWeight: '600' },
      body: { fontSize: 16, fontWeight: '400' },
      caption: { fontSize: 14, fontWeight: '400' },
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  },
  dark: {
    colors: {
      background: '#000000',
      surface: '#1c1c1e',
      primary: '#0a84ff',
      secondary: '#5e5ce6',
      text: '#ffffff',
      textSecondary: '#8e8e93',
      success: '#30d158',
      error: '#ff453a',
      warning: '#ff9f0a',
      border: '#38383a',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '700' },
      h2: { fontSize: 24, fontWeight: '600' },
      h3: { fontSize: 20, fontWeight: '600' },
      body: { fontSize: 16, fontWeight: '400' },
      caption: { fontSize: 14, fontWeight: '400' },
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  },
  auto: {
    // Auto theme will be resolved at runtime based on system preference
    // For now, defaults to light theme
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      primary: '#007AFF',
      secondary: '#5856d6',
      text: '#000000',
      textSecondary: '#666666',
      success: '#34c759',
      error: '#ff3b30',
      warning: '#ff9500',
      border: '#e1e1e1',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '700' },
      h2: { fontSize: 24, fontWeight: '600' },
      h3: { fontSize: 20, fontWeight: '600' },
      body: { fontSize: 16, fontWeight: '400' },
      caption: { fontSize: 14, fontWeight: '400' },
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  },
};

/**
 * Get themed styles based on theme, variant, and custom theme config
 */
function getThemedStyles(
  theme: OAuthTheme = 'auto',
  variant: OAuthVariant = 'fullscreen',
  customThemeConfig?: OAuthThemeConfig
) {
  // Resolve theme config
  const themeConfig = customThemeConfig || defaultThemes[theme];

  // Base styles for all variants
  const baseStyles = {
    colors: themeConfig.colors,
    icon: {
      fontSize: 48,
      marginBottom: themeConfig.spacing.lg,
      color: themeConfig.colors.primary,
    },
    successIcon: {
      color: themeConfig.colors.success,
    },
    errorIcon: {
      color: themeConfig.colors.error,
    },
    title: {
      fontSize: themeConfig.typography.h2.fontSize,
      fontWeight: themeConfig.typography.h2.fontWeight,
      color: themeConfig.colors.text,
      marginBottom: themeConfig.spacing.sm,
      textAlign: 'center' as const,
    },
    message: {
      fontSize: themeConfig.typography.body.fontSize,
      color: themeConfig.colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 22,
      marginBottom: themeConfig.spacing.xl,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: themeConfig.typography.body.fontSize,
      fontWeight: '600',
      textAlign: 'center' as const,
    },
  };

  // Variant-specific styles
  switch (variant) {
    case 'minimal':
      return {
        ...baseStyles,
        container: {
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          padding: themeConfig.spacing.md,
        },
        content: {
          alignItems: 'center',
          maxWidth: 280,
        },
        button: {
          backgroundColor: themeConfig.colors.primary,
          paddingHorizontal: themeConfig.spacing.lg,
          paddingVertical: themeConfig.spacing.sm,
          borderRadius: themeConfig.borderRadius.sm,
          minWidth: 100,
        },
      };

    case 'card':
      return {
        ...baseStyles,
        container: {
          flex: 1,
          backgroundColor: themeConfig.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: themeConfig.spacing.lg,
        },
        content: {
          alignItems: 'center',
          maxWidth: 320,
          backgroundColor: themeConfig.colors.surface,
          padding: themeConfig.spacing.xl,
          borderRadius: themeConfig.borderRadius.lg,
          borderWidth: 1,
          borderColor: themeConfig.colors.border,
          ...themeConfig.shadows.md,
        },
        button: {
          backgroundColor: themeConfig.colors.primary,
          paddingHorizontal: themeConfig.spacing.xl,
          paddingVertical: themeConfig.spacing.md,
          borderRadius: themeConfig.borderRadius.md,
          minWidth: 120,
          ...themeConfig.shadows.sm,
        },
      };

    case 'modal':
      return {
        ...baseStyles,
        container: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: themeConfig.spacing.lg,
        },
        content: {
          alignItems: 'center',
          maxWidth: 340,
          backgroundColor: themeConfig.colors.surface,
          padding: themeConfig.spacing.xl,
          borderRadius: themeConfig.borderRadius.xl,
          ...themeConfig.shadows.lg,
        },
        button: {
          backgroundColor: themeConfig.colors.primary,
          paddingHorizontal: themeConfig.spacing.xl,
          paddingVertical: themeConfig.spacing.md,
          borderRadius: themeConfig.borderRadius.md,
          minWidth: 140,
          ...themeConfig.shadows.sm,
        },
      };

    case 'fullscreen':
    default:
      return {
        ...baseStyles,
        container: {
          flex: 1,
          backgroundColor: themeConfig.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: themeConfig.spacing.lg,
        },
        content: {
          alignItems: 'center',
          maxWidth: 300,
        },
        button: {
          backgroundColor: themeConfig.colors.primary,
          paddingHorizontal: themeConfig.spacing.xl,
          paddingVertical: themeConfig.spacing.md,
          borderRadius: themeConfig.borderRadius.md,
          minWidth: 120,
        },
      };
  }
}
