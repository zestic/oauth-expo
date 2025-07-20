# Unistyles Integration Guide

This guide shows how to integrate the OAuth Expo library with `react-native-unistyles` for theme-aware, responsive styling.

## Installation

```bash
yarn add react-native-unistyles
```

## Basic Setup

### 1. Configure Unistyles Theme

```typescript
// theme.ts
import { UnistylesRegistry } from 'react-native-unistyles';

const lightTheme = {
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
    onPrimary: '#ffffff',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
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
  },
};

const darkTheme = {
  ...lightTheme,
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
    onPrimary: '#ffffff',
  },
};

UnistylesRegistry
  .addThemes({
    light: lightTheme,
    dark: darkTheme,
  })
  .addConfig({
    adaptiveThemes: true,
  });
```

### 2. Create Styled OAuth Components

```typescript
// StyledOAuthScreen.tsx
import React from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { OAuthCallbackScreen } from '@your-org/oauth-expo';
import type { ExpoOAuthConfig, OAuthCallbackParams } from '@your-org/oauth-expo';

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
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

export function StyledOAuthScreen({ 
  config, 
  params 
}: {
  config: ExpoOAuthConfig;
  params?: OAuthCallbackParams;
}) {
  const { styles } = useStyles(stylesheet);

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      variant="card"
      styles={{
        container: styles.container,
        content: styles.content,
        title: styles.title,
        message: styles.message,
        button: styles.button,
        buttonText: styles.buttonText,
      }}
    />
  );
}
```

## Advanced Usage

### 1. Responsive Design

```typescript
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
    maxWidth: 320,
    variants: {
      screen: {
        xs: { maxWidth: 280 },
        md: { maxWidth: 400 },
        lg: { maxWidth: 480 },
      },
    },
  },
}));

export function ResponsiveOAuthScreen({ config, params }: Props) {
  const { styles } = useStyles(responsiveStylesheet);

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      styles={{
        container: styles.container,
        content: styles.content,
      }}
    />
  );
}
```

### 2. Custom Components with Unistyles

```typescript
import { ActivityIndicator, Text, View } from 'react-native';

const customComponentsStylesheet = createStyleSheet((theme) => ({
  customLoader: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  loaderText: {
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
}));

function CustomLoadingIndicator() {
  const { styles, theme } = useStyles(customComponentsStylesheet);
  return (
    <View style={styles.customLoader}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loaderText}>Authenticating...</Text>
    </View>
  );
}

function CustomSuccessIcon() {
  const { styles } = useStyles(customComponentsStylesheet);
  return <Text style={styles.successIcon}>🎉</Text>;
}

function CustomErrorIcon() {
  const { styles } = useStyles(customComponentsStylesheet);
  return <Text style={styles.errorIcon}>❌</Text>;
}

export function CustomOAuthScreen({ config, params }: Props) {
  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      components={{
        LoadingIndicator: CustomLoadingIndicator,
        SuccessIcon: CustomSuccessIcon,
        ErrorIcon: CustomErrorIcon,
      }}
    />
  );
}
```

### 3. Theme-Aware Variants

```typescript
export function VariantOAuthScreen({ 
  config, 
  params, 
  variant = 'card' 
}: Props & { 
  variant?: 'minimal' | 'card' | 'fullscreen' | 'modal' 
}) {
  const { theme } = useStyles();

  // Pass theme config directly to the component
  const themeConfig = {
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
  };

  return (
    <OAuthCallbackScreen
      config={config}
      params={params}
      variant={variant}
      themeConfig={themeConfig}
    />
  );
}
```

## Built-in Theme Support

The library also provides built-in theme support without requiring unistyles:

```typescript
// Using built-in themes
<OAuthCallbackScreen
  config={config}
  params={params}
  theme="dark"           // 'light' | 'dark' | 'auto'
  variant="card"         // 'minimal' | 'card' | 'fullscreen' | 'modal'
/>

// Using custom theme config
<OAuthCallbackScreen
  config={config}
  params={params}
  themeConfig={{
    colors: { /* custom colors */ },
    spacing: { /* custom spacing */ },
    // ... other theme properties
  }}
/>
```

## Best Practices

1. **Use variants for different contexts:**
   - `minimal` - For embedded use cases
   - `card` - For modal-like presentations
   - `fullscreen` - For dedicated auth screens
   - `modal` - For overlay presentations

2. **Leverage responsive design:**
   - Use unistyles breakpoints for different screen sizes
   - Adjust padding, font sizes, and component sizes accordingly

3. **Customize components when needed:**
   - Override default icons and loading indicators
   - Use your app's design system components

4. **Theme consistency:**
   - Use the same theme tokens across your app
   - Ensure OAuth screens match your app's visual identity

## TypeScript Support

All components are fully typed with TypeScript:

```typescript
import type {
  OAuthTheme,
  OAuthVariant,
  OAuthThemeConfig,
  OAuthComponentOverrides,
} from '@your-org/oauth-expo';
```
