import React from 'react';
import { Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export default function ThemedText({ style, children, type = 'body', ...props }) {
  const { theme } = useThemeStore();

  const colorMap = {
    body: theme.text,
    secondary: theme.textSecondary,
    primary: theme.primary,
  };

  return (
    <Text style={[{ color: colorMap[type] }, style]} {...props}>
      {children}
    </Text>
  );
}