import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export default function ThemedActivityIndicator({
  size = 'small',
  style,
}) {
  const { theme } = useThemeStore();

  return (
    <ActivityIndicator
      size={size}
      color={theme.primary}
      style={style}
    />
  );
}