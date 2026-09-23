import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const { theme } = useThemeStore();

  const {
    changePassword,
    isLoading,
  } = useAuthStore();

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      return Alert.alert(
        'Error',
        'Please enter your current password.'
      );
    }

    if (
      !newPassword ||
      newPassword.length < 6
    ) {
      return Alert.alert(
        'Error',
        'New password must be at least 6 characters.'
      );
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert(
        'Error',
        'New passwords do not match.'
      );
    }

    const result =
      await changePassword(
        currentPassword,
        newPassword
      );

    if (result.success) {
      Alert.alert(
        'Success',
        'Password updated successfully.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.back(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Error',
        result.error ||
          'Failed to update password.'
      );
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
            name="lock-reset"
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
          Change Password
        </Text>

        <Text
          style={[
            GlobalStyles.subtitle,
            {
              textAlign: 'center',
              marginTop: 10,
              color:
                theme.textSecondary,
            },
          ]}
        >
          Enter your current password and a
          secure new password below.
        </Text>

        <View
          style={styles.formSection}
        >
          {/* Current Password */}
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor:
                  theme.card,
                borderColor:
                  theme.border,
              },
            ]}
          >
            <TextInput
              placeholder="Current Password"
              placeholderTextColor={
                theme.textSecondary
              }
              secureTextEntry={
                !showCurrent
              }
              style={[
                styles.passwordInput,
                {
                  color: theme.text,
                },
              ]}
              value={currentPassword}
              onChangeText={
                setCurrentPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={() =>
                setShowCurrent(
                  !showCurrent
                )
              }
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  showCurrent
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

          {/* New Password */}
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor:
                  theme.card,
                borderColor:
                  theme.border,
              },
            ]}
          >
            <TextInput
              placeholder="New Password"
              placeholderTextColor={
                theme.textSecondary
              }
              secureTextEntry={
                !showNew
              }
              style={[
                styles.passwordInput,
                {
                  color: theme.text,
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={() =>
                setShowNew(
                  !showNew
                )
              }
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  showNew
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

          {/* Confirm New Password */}
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor:
                  theme.card,
                borderColor:
                  theme.border,
              },
            ]}
          >
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor={
                theme.textSecondary
              }
              secureTextEntry={
                !showConfirm
              }
              style={[
                styles.passwordInput,
                {
                  color: theme.text,
                },
              ]}
              value={confirmPassword}
              onChangeText={
                setConfirmPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirm(
                  !showConfirm
                )
              }
              style={styles.eyeIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  showConfirm
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
              handleChangePassword
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
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },

  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: -10,
    marginLeft: -4,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  formSection: {
    width: '100%',
    marginTop: 20,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
  },

  eyeIcon: {
    padding: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },
});