import React from 'react';
import { Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export default function ThemedText({
  style,
  children,
  type = 'body',
  ...props
}) {
  const { theme } = useThemeStore();

  const colorMap = {
    body: theme.text,
    secondary: theme.textSecondary,
    primary: theme.primary,
  };

  const textColor = colorMap[type] || theme.text;

  return (
    <Text
      style={[
        {
          color: textColor,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}