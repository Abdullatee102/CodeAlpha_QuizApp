import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function AuthLayout() {
  const { theme } = useThemeStore(); 

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background }, 
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen 
        name="verify-email" 
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}