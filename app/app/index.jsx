import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore"; 
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { loading, _hasHydrated, user, hasFinishedOnboarding } = useAuthStore();
  const { theme } = useThemeStore(); 

  if (!_hasHydrated || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (user) return <Redirect href="/(main)" />;
  if (!hasFinishedOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(auth)/sign-in" />;
}