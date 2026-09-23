import React, {
  useState,
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import {
  useRouter,
  useLocalSearchParams,
} from 'expo-router';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';
import { GlobalStyles } from '../../constants/styles';
import { useAuthStore } from '../../store/authStore';
import api from '../../data/api';

import { Colors } from '../../constants/colors';

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const identifier =
    params?.identifier || '';

  const isPasswordResetFlow =
    params?.flow === 'reset';

  const isOTPFlow = true;

  const { theme } = useThemeStore();

  const {
    verifyOTP,
    isLoading,
  } = useAuthStore();

  const [otpCode, setOtpCode] =
    useState('');

  const [resending, setResending] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(
        () => setCooldown(cooldown - 1),
        1000
      );

      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const openEmailApp = () => {
    Linking.openURL('mailto:').catch(() => {
      Alert.alert(
        'Error',
        'Unable to open email app'
      );
    });
  };

  const handleVerifyOTPCode = async () => {
    if (
      !otpCode ||
      otpCode.length !== 6
    ) {
      Alert.alert(
        'Error',
        'Please enter the valid 6-digit verification code.'
      );

      return;
    }

    const res = await verifyOTP(
      otpCode,
      identifier
    );

    if (res?.success) {
      if (isPasswordResetFlow) {
        router.replace({
          pathname:
            '/(auth)/reset-password',
          params: {
            identifier,
          },
        });
      } else {
        Alert.alert(
          'Success',
          'Account verified successfully!',
          [
            {
              text: 'Continue',
              onPress: () =>
                router.replace(
                  '/(main)'
                ),
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Verification Failed',
        res?.error ||
          'Invalid code entered.'
      );
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;

    try {
      setResending(true);

      if (identifier) {
        const payload =
          identifier.includes('@')
            ? { email: identifier }
            : {
                phoneNumber: identifier,
              };

        await api.post(
          '/auth/send-otp',
          payload
        );

        Alert.alert(
          'Success',
          'Verification code resent successfully.'
        );

        setCooldown(60);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to resend verification code.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        GlobalStyles.safeArea,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                theme.primary + '15',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              isPasswordResetFlow
                ? 'lock-reset'
                : isOTPFlow
                ? 'cellphone-message'
                : 'email-check-outline'
            }
            size={60}
            color={theme.primary}
          />
        </View>

        <Text
          style={[
            GlobalStyles.headerTitle,
            {
              textAlign: 'center',
              color: theme.primary,
            },
          ]}
        >
          {isPasswordResetFlow
            ? 'Verify Reset Code'
            : isOTPFlow
            ? 'Verify Your Account'
            : 'Check Your Email'}
        </Text>

        <Text
          style={[
            GlobalStyles.subtitle,
            {
              textAlign: 'center',
              marginTop: 10,
              color: theme.textSecondary,
            },
          ]}
        >
          {isOTPFlow
            ? `We've sent a 6-digit verification code to ${identifier}. Enter it below to proceed.`
            : `We've sent a verification link to ${
                identifier ||
                'your email address'
              }. Please verify to proceed.`}
        </Text>

        {isOTPFlow ? (
          <View
            style={styles.otpSection}
          >
            <TextInput
              placeholder="------"
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
                  color: theme.text,
                  textAlign: 'center',
                  fontSize: 24,
                  letterSpacing: 8,
                  fontWeight: 'bold',
                },
              ]}
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <TouchableOpacity
              style={[
                GlobalStyles.primaryBtn,
                {
                  backgroundColor:
                    theme.primary,
                  marginTop: 10,
                },
                isLoading &&
                  styles.disabledButton,
              ]}
              onPress={
                handleVerifyOTPCode
              }
              disabled={isLoading}
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
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={styles.buttonGroup}
          >
            <TouchableOpacity
              style={[
                GlobalStyles.primaryBtn,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
              onPress={
                openEmailApp
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  GlobalStyles.btnText,
                  {
                    color:
                      Colors.white,
                  },
                ]}
              >
                Open Email App
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            {
              borderColor:
                theme.border,
              backgroundColor:
                theme.card,
              marginTop: 15,
              width: '100%',
            },
          ]}
          onPress={() =>
            router.replace(
              '/(auth)/sign-in'
            )
          }
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              {
                color: theme.primary,
              },
            ]}
          >
            Back to Sign In
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.resendContainer
          }
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
            Didn't receive a code?{' '}
          </Text>

          <TouchableOpacity
            onPress={
              handleResendCode
            }
            disabled={
              resending ||
              cooldown > 0
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendText,
                {
                  color:
                    cooldown > 0
                      ? theme.textSecondary
                      : theme.primary,
                },
              ]}
            >
              {resending
                ? 'Sending...'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  otpSection: {
    width: '100%',
    marginTop: 30,
  },

  buttonGroup: {
    width: '100%',
    marginTop: 40,
  },

  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
  },

  secondaryBtnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },

  footerText: {
    fontFamily: 'Ubuntu-Regular',
  },

  resendText: {
    fontFamily: 'Ubuntu-Bold',
  },

  resendContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.7,
  },
});