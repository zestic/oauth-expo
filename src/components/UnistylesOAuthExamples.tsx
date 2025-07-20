/**
 * Unistyles Integration Examples for OAuth Components
 *
 * This file demonstrates how to integrate the OAuth components with react-native-unistyles
 * for theme-aware, responsive styling.
 */

// All imports are commented out since this is an example file
// import React from 'react';
// import { View, Text, ActivityIndicator } from 'react-native';
// import { OAuthCallbackScreen } from './OAuthCallbackScreen';
// import type { ExpoOAuthConfig, OAuthCallbackParams } from '../types';

// Example: Using react-native-unistyles (pseudo-code since we don't have the actual dependency)
// import { createStyleSheet, useStyles } from 'react-native-unistyles';

/**
 * Example 1: Basic Unistyles Integration
 */
/*
const oauthStylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.body.lineHeight,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
}));

export function UnistylesOAuthScreen({ config, params }: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
}) {
  const { styles } = useStyles(oauthStylesheet);

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      styles={{
        container: styles.container,
        title: styles.title,
        message: styles.message,
        button: styles.button,
        buttonText: styles.buttonText,
      }}
    />
  );
}
*/

/**
 * Example 2: Theme-Aware OAuth Screen with Variants
 */
/*
const variantStylesheet = createStyleSheet((theme) => ({
  // Card variant
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    ...theme.shadows.md,
    variants: {
      elevated: {
        true: {
          ...theme.shadows.lg,
        },
      },
    },
  },
  
  // Modal variant
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    maxWidth: 340,
    width: '90%',
    ...theme.shadows.lg,
  },
  
  // Responsive button
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: 120,
    variants: {
      size: {
        small: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minWidth: 100,
        },
        large: {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          minWidth: 160,
        },
      },
      variant: {
        outline: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        ghost: {
          backgroundColor: 'transparent',
        },
      },
    },
  },
}));

export function ThemedOAuthScreen({ 
  config, 
  params, 
  variant = 'card',
  elevated = false 
}: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
  variant?: 'card' | 'modal' | 'fullscreen';
  elevated?: boolean;
}) {
  const { styles } = useStyles(variantStylesheet);

  if (variant === 'modal') {
    return (
      <View style={styles.modalOverlay}>
        <OAuthCallbackScreen
          config={config}
          params={params}
          variant="modal"
          style={styles.modalContent}
        />
      </View>
    );
  }

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      variant={variant}
      style={variant === 'card' ? styles.cardContainer({ elevated }) : undefined}
    />
  );
}
*/

/**
 * Example 3: Custom Component Overrides with Unistyles
 */
/*
const customComponentsStylesheet = createStyleSheet((theme) => ({
  customLoader: {
    padding: theme.spacing.md,
  },
  customSuccessIcon: {
    fontSize: 64,
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  customErrorIcon: {
    fontSize: 64,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
  customButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md,
  },
}));

// Custom components
function CustomLoadingIndicator() {
  const { styles, theme } = useStyles(customComponentsStylesheet);
  return (
    <View style={styles.customLoader}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ color: theme.colors.text, marginTop: theme.spacing.sm }}>
        Authenticating...
      </Text>
    </View>
  );
}

function CustomSuccessIcon() {
  const { styles } = useStyles(customComponentsStylesheet);
  return <Text style={styles.customSuccessIcon}>🎉</Text>;
}

function CustomErrorIcon() {
  const { styles } = useStyles(customComponentsStylesheet);
  return <Text style={styles.customErrorIcon}>❌</Text>;
}

export function CustomOAuthScreen({ config, params }: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
}) {
  const { styles } = useStyles(customComponentsStylesheet);

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      components={{
        LoadingIndicator: CustomLoadingIndicator,
        SuccessIcon: CustomSuccessIcon,
        ErrorIcon: CustomErrorIcon,
      }}
      buttonStyle={styles.customButton}
    />
  );
}
*/

/**
 * Example 4: Responsive OAuth Screen
 */
/*
const responsiveStylesheet = createStyleSheet((theme) => ({
  container: {
    padding: theme.spacing.md,
    variants: {
      screen: {
        xs: { padding: theme.spacing.sm },
        sm: { padding: theme.spacing.md },
        md: { padding: theme.spacing.lg },
        lg: { padding: theme.spacing.xl },
      },
    },
  },
  content: {
    maxWidth: 300,
    variants: {
      screen: {
        xs: { maxWidth: 280 },
        sm: { maxWidth: 320 },
        md: { maxWidth: 400 },
        lg: { maxWidth: 480 },
      },
    },
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    variants: {
      screen: {
        xs: { fontSize: theme.typography.h3.fontSize },
        lg: { fontSize: theme.typography.h1.fontSize },
      },
    },
  },
}));

export function ResponsiveOAuthScreen({ config, params }: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
}) {
  const { styles } = useStyles(responsiveStylesheet);

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      styles={{
        container: styles.container,
        content: styles.content,
        title: styles.title,
      }}
    />
  );
}
*/

/**
 * Example 5: Dark/Light Theme Toggle
 */
/*
export function ThemeAwareOAuthScreen({ 
  config, 
  params,
  forceDarkMode = false 
}: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
  forceDarkMode?: boolean;
}) {
  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      theme={forceDarkMode ? 'dark' : 'auto'}
      variant="card"
    />
  );
}
*/

// Export types for TypeScript users
export type {
  OAuthTheme,
  OAuthVariant,
  OAuthThemeConfig,
  OAuthComponentOverrides,
} from '../types';
