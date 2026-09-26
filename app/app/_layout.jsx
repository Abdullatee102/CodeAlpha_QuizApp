import { useEffect, useRef } from 'react';

import {
  Platform,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';

import {
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import * as NavigationBar from 'expo-navigation-bar';

import { useFonts } from 'expo-font';

import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';

import { useAuthStore } from '../store/authStore';

import { useThemeStore } from '../store/themeStore';

import { Colors } from '../constants/colors';

import * as Notifications from 'expo-notifications';

import {
  QueryClientProvider,
} from '@tanstack/react-query';
import { queryClient } from '../data/queryClient';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const {
    user,
    isInitializing,
    initialize,
    hasFinishedOnboarding,
    _hasHydrated,
    registerPushNotifications,
  } = useAuthStore();

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  const segments =
    useSegments();

  const router =
    useRouter();

  const notificationListener =
    useRef(null);

  const responseListener =
    useRef(null);

  // =====================================================
  // SYNC ANDROID NAVIGATION BAR
  // =====================================================

  useEffect(() => {
    if (
      Platform.OS === 'android'
    ) {
      try {
        NavigationBar.setButtonStyleAsync(
          isDarkMode
            ? 'light'
            : 'dark'
        );
        NavigationBar.setBackgroundColorAsync(
          theme.background
        );
      } catch (e) {
        console.warn(
          'Navigation bar styling error:',
          e
        );
      }
    }
  }, [
    isDarkMode,
    theme.background,
  ]);

  useEffect(() => {
    try {
      SystemUI.setBackgroundColorAsync(
        theme.background
      );
    } catch (e) {
      console.warn(
        'SystemUI styling error:',
        e
      );
    }
  }, [
    theme.background,
  ]);

  // =====================================================
  // GOOGLE AUTH + NOTIFICATION LISTENERS
  // =====================================================

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '777496097951-jb7mabvi6ajftdvf5gvckp8qpuea543g.apps.googleusercontent.com',

      offlineAccess: true,
    });

    /*
     * Notification received while the app is open.
     *
     * The backend is now responsible for creating and
     * sending achievement notifications.
     */
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log(
            'Notification Received:',
            notification
          );
        }
      );

    /*
     * Notification tapped by the user.
     */
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const {
            data,
          } =
            response.notification
              .request.content;

          if (data?.url) {
            router.push(
              data.url
            );
          }
        }
      );

    return () => {
      if (
        notificationListener.current
      ) {
        notificationListener.current.remove();

        notificationListener.current =
          null;
      }

      if (
        responseListener.current
      ) {
        responseListener.current.remove();

        responseListener.current =
          null;
      }
    };
  }, []);

  // =====================================================
  // INITIALIZE AUTH SESSION
  // =====================================================

  useEffect(() => {
    if (_hasHydrated) {
      initialize();
    }
  }, [
    _hasHydrated,
  ]);

  // =====================================================
  // REGISTER DEVICE FOR PUSH NOTIFICATIONS
  // =====================================================

  /*
   * The root layout does NOT call the notification API.
   *
   * It only asks authStore to handle registration.
   *
   * This runs whenever an authenticated user exists.
   *
   * This also covers:
   * - normal login
   * - signup
   * - OTP login
   * - Google login
   * - biometric login
   * - app restart with an existing session
   */
  useEffect(() => {
    if (
      !_hasHydrated ||
      isInitializing ||
      !user
    ) {
      return;
    }

    registerPushNotifications();
  }, [
    _hasHydrated,
    isInitializing,
    user,
    registerPushNotifications,
  ]);

  // =====================================================
  // LOAD FONTS
  // =====================================================

  const [
    fontsLoaded,
  ] = useFonts({
    'Archivo-Black':
      require('../assets/fonts/Archivo_Black/ArchivoBlack-Regular.ttf'),

    'Ubuntu-Regular':
      require('../assets/fonts/Ubuntu/Ubuntu-Regular.ttf'),

    'Ubuntu-Bold':
      require('../assets/fonts/Ubuntu/Ubuntu-Bold.ttf'),

    'Ubuntu-Medium':
      require('../assets/fonts/Ubuntu/Ubuntu-Medium.ttf'),

    'Ubuntu-Light':
      require('../assets/fonts/Ubuntu/Ubuntu-Light.ttf'),
  });

  // =====================================================
  // AUTH NAVIGATION
  // =====================================================

  useEffect(() => {
    if (
      !fontsLoaded ||
      isInitializing ||
      !_hasHydrated
    ) {
      return;
    }

    const inAuthGroup =
      segments[0] === '(auth)';

    const inOnboarding =
      segments[0] === 'onboarding';

    const inResetPassword =
      segments[0] === '(auth)' && segments[1] === 'reset-password';

    if (!user) {
      if (
        !hasFinishedOnboarding &&
        !inOnboarding
      ) {
        router.replace(
          '/onboarding'
        );
      } else if (
        hasFinishedOnboarding &&
        !inAuthGroup &&
        !inOnboarding
      ) {
        router.replace(
          '/(auth)/sign-in'
        );
      }
    } else if (
      user &&
      !inResetPassword &&
      (
        inAuthGroup ||
        inOnboarding ||
        segments.length === 0
      )
    ) {
      router.replace(
        '/(main)'
      );
    }

    const hideSplash =
      async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn(
            'Splash screen error:',
            e
          );
        }
      };

    hideSplash();
  }, [
    user,
    isInitializing,
    fontsLoaded,
    _hasHydrated,
    hasFinishedOnboarding,
    segments,
  ]);

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (
    !fontsLoaded ||
    isInitializing ||
    !_hasHydrated
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            Colors.tertiary,
          justifyContent:
            'center',
          alignItems:
            'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#ffffff"
        />

        <Text
          style={{
            color: '#fff',
            marginTop: 10,
            fontFamily:
              fontsLoaded
                ? 'Ubuntu-Medium'
                : 'System',
          }}
        >
          Loading Brain Buzz...
        </Text>
      </View>
    );
  }

  // =====================================================
  // APP
  // =====================================================

  return (
    <QueryClientProvider
      client={queryClient}
    >
      <StatusBar
        style={
          isDarkMode
            ? 'light'
            : 'dark'
        }
        backgroundColor={
          theme.background
        }
      />

      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              theme.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
        />

        <Stack.Screen
          name="onboarding"
          options={{
            animation: 'fade',
          }}
        />

        <Stack.Screen
          name="(auth)"
          options={{
            animation: 'fade',
          }}
        />

        <Stack.Screen
          name="(main)"
          options={{
            gestureEnabled: false,
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="(profile)"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}