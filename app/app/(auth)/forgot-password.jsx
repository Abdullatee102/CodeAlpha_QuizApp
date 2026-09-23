import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');

  const {
    forgotPassword,
    sendOTP,
    isLoading,
  } = useAuthStore();

  const { theme } = useThemeStore();

  const router = useRouter();

  const handleReset = async () => {
    if (!identifier.trim()) {
      return Alert.alert(
        'Required',
        'Please enter your email address or phone number.'
      );
    }

    const value = identifier.trim();
    const isEmail = value.includes('@');

    try {
      let res;

      if (isEmail) {
        res = await forgotPassword(value);
      } else {
        res = await sendOTP(value);
      }

      if (res?.success) {
        const testOtpCode = res.data?.testOtp
          ? ` (Dev Code: ${res.data.testOtp})`
          : '';

        Alert.alert(
          'Success',
          `Verification code sent to your ${
            isEmail ? 'email' : 'phone number'
          }.${testOtpCode}`,
          [
            {
              text: 'OK',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/verify-email',
                  params: {
                    identifier: value,
                    flow: 'reset',
                  },
                }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          res?.error ||
            'Failed to send reset code. Please try again.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Connection Error',
        'Sorry, something went wrong. Please try your request again.'
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        GlobalStyles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              GlobalStyles.headerTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            Reset Password
          </Text>

          <Text
            style={[
              GlobalStyles.subtitle,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Enter your email address or phone number and we'll
            help you get back into your account.
          </Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email Address or Phone Number"
              placeholderTextColor={theme.textSecondary}
              style={[
                GlobalStyles.inputField,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />

            <TouchableOpacity
              style={[
                GlobalStyles.primaryBtn,
                {
                  backgroundColor: theme.primary,
                },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleReset}
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
                      color: Colors.white,
                    },
                  ]}
                >
                  Send Reset Instructions
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    marginHorizontal: 15,
    flexGrow: 0.8,
    justifyContent: 'center',
    paddingBottom: 50,
  },

  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingBottom: 70,
    marginTop: -170,
    marginLeft: -4,
  },

  form: {
    marginTop: 15,
    marginBottom: 10,
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.7,
  },
});