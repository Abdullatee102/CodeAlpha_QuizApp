import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../../utils/mmkvStorage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  useAuthStore,
} from '../../store/authStore';

import {
  useThemeStore,
} from '../../store/themeStore';

import {
  Colors,
} from '../../constants/colors';

import {
  GlobalStyles,
} from '../../constants/styles';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const {
    login,
    googleAuth,
    biometricLogin,
    isLoading,
    error,
  } = useAuthStore();

  const {
    theme,
  } = useThemeStore();

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const savedEmail =
        storage.getString('lastUserEmail') ||
        (await AsyncStorage.getItem('lastUserEmail'));

      if (savedEmail) {
        setIdentifier(savedEmail);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert(
        'Error',
        'Please fill in all fields'
      );
      return;
    }

    const res = await login(
      identifier,
      password
    );

    if (res?.success) {
      storage.set('lastUserEmail', identifier);
      await AsyncStorage.setItem(
        'lastUserEmail',
        identifier
      );

      router.replace('/(main)');
    }
  };

  const handleBiometricAuth = async () => {
    const hasHardware =
      await LocalAuthentication.hasHardwareAsync();

    const isEnrolled =
      await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        'Not Available',
        'Biometrics not set up on this device.'
      );
      return;
    }

    const savedEmail =
      storage.getString('lastUserEmail') ||
      (await AsyncStorage.getItem('lastUserEmail'));

    const biometricToken = storage.getString('biometricRefreshToken');
    const isBioEnabledInStore = useAuthStore.getState().biometricEnabled;

    const biometricEnabledPref = savedEmail
      ? storage.getString(`useBiometrics_${savedEmail}`) ||
        (await AsyncStorage.getItem(`useBiometrics_${savedEmail}`))
      : null;

    const isBiometricConfigured =
      (isBioEnabledInStore || biometricEnabledPref === 'true') &&
      !!biometricToken &&
      !!savedEmail;

    if (!isBiometricConfigured) {
      Alert.alert(
        'Setup Required',
        'Please sign in with your password first and enable Biometrics in Security settings.'
      );
      return;
    }

    const result =
      await LocalAuthentication.authenticateAsync({
        promptMessage: `Login as ${savedEmail}`,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

    if (result.success) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      const res =
        await biometricLogin(savedEmail);

      if (res?.success) {
        router.replace('/(main)');
      } else {
        Alert.alert(
          'Authentication Failed',
          res?.error ||
            'Could not complete biometric sign-in. Please log in with your password.'
        );
      }
    } else {
      const cancellationErrors = [
        'user_cancel',
        'system_cancel',
        'app_cancel',
        'user_fallback',
      ];
      if (result.error && !cancellationErrors.includes(result.error)) {
        Alert.alert(
          'Biometric Verification Failed',
          'Biometric verification was not successful. Please try again or use your password.'
        );
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);

    try {
      await GoogleSignin.hasPlayServices();

      const signInResult =
        await GoogleSignin.signIn();

      const idToken =
        signInResult.data?.idToken ||
        signInResult.idToken;

      if (!idToken) {
        throw new Error(
          'No ID Token found'
        );
      }

      await googleAuth(idToken);

      router.replace('/(main)');
    } catch (err) {
      if (
        err.code !==
        'ASYNC_OP_IN_PROGRESS'
      ) {
        Alert.alert(
          'Google Error',
          err.message
        );
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContainer
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            Welcome Back
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Sign in to continue your
            assessment journey.
          </Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email Address or Phone Number"
              placeholderTextColor={
                theme.textSecondary
              }
              style={[
                GlobalStyles.inputField,
                {
                  backgroundColor:
                    theme.card,
                  borderColor:
                    theme.border,
                  color:
                    theme.text,
                },
              ]}
              autoCapitalize="none"
              value={identifier}
              onChangeText={
                setIdentifier
              }
            />

            <View
              style={[
                styles.passwordWrapper,
                {
                  backgroundColor:
                    theme.card,
                  borderColor:
                    theme.border,
                },
              ]}
            >
              <TextInput
                placeholder="Password"
                placeholderTextColor={
                  theme.textSecondary
                }
                style={[
                  GlobalStyles.inputField,
                  {
                    flex: 1,
                    marginBottom: 0,
                    borderWidth: 0,
                    backgroundColor:
                      'transparent',
                    color:
                      theme.text,
                  },
                ]}
                secureTextEntry={
                  !showPassword
                }
                value={password}
                onChangeText={
                  setPassword
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    showPassword
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={22}
                  color={
                    theme.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  '/(auth)/forgot-password'
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text
              style={[
                styles.errorText,
                {
                  color:
                    Colors.error,
                },
              ]}
            >
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              GlobalStyles.primaryBtn,
              {
                backgroundColor:
                  theme.primary,
              },
              (isLoading ||
                socialLoading) && {
                opacity: 0.7,
              },
            ]}
            onPress={handleLogin}
            disabled={
              isLoading ||
              socialLoading
            }
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator
                color={Colors.white}
              />
            ) : (
              <Text
                style={[
                  GlobalStyles.btnText,
                  {
                    color:
                      Colors.white,
                  },
                ]}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.dividerContainer
            }
          >
            <View
              style={[
                styles.line,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <Text
              style={[
                styles.dividerText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              QUICK ACCESS
            </Text>

            <View
              style={[
                styles.line,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />
          </View>

          <View
            style={styles.socialRow}
          >
            <TouchableOpacity
              style={[
                styles.socialBtn,
                {
                  backgroundColor:
                    theme.card,
                  borderColor:
                    theme.border,
                },
              ]}
              onPress={
                handleBiometricAuth
              }
              disabled={
                isLoading ||
                socialLoading
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="finger-print"
                size={24}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.socialLabel,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Biometrics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                {
                  backgroundColor:
                    `${theme.primary}15`,
                  borderColor:
                    theme.primary,
                },
              ]}
              onPress={
                handleGoogleSignIn
              }
              disabled={
                isLoading ||
                socialLoading
              }
              activeOpacity={0.7}
            >
              {socialLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    theme.primary
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={24}
                    color={
                      theme.primary
                    }
                  />

                  <Text
                    style={[
                      styles.socialLabel,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={styles.footer}
          >
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Don&apos;t have an account?{' '}
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace(
                  '/(auth)/sign-up'
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContainer: {
    padding: 25,
    justifyContent: 'center',
    flexGrow: 1,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 32,
    marginBottom: 10,
  },

  subtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
    marginBottom: 30,
  },

  form: {
    marginTop: 10,
    marginBottom: 15,
  },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 15,
    marginBottom: 15,
  },

  eyeIcon: {
    padding: 5,
  },

  forgotText: {
    textAlign: 'right',
    fontFamily: 'Ubuntu-Medium',
    marginBottom: 25,
  },

  errorText: {
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    marginBottom: 15,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },

  line: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    marginHorizontal: 10,
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },

  socialRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },

  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 60,
  },

  socialLabel: {
    fontFamily: 'Ubuntu-Medium',
  },

  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerText: {
    fontFamily: 'Ubuntu-Regular',
  },

  linkText: {
    fontFamily: 'Ubuntu-Bold',
  },
});