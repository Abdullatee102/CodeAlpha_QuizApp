// src/app/(main)/delete-account.jsx

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/colors';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    deleteAccount,
    isLoading,
  } = useAuthStore();

  const { theme } = useThemeStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: showFinalConfirmation,
        },
      ]
    );
  };

  const showFinalConfirmation = () => {
    Alert.alert(
      'Final Confirmation',
      'Your profile, quiz history, achievements, statistics, and other account data will be permanently deleted. Do you want to continue?',
      [
        {
          text: 'No, Keep My Account',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      const result = await deleteAccount();

      if (result?.success === false) {
        Alert.alert(
          'Deletion Failed',
          result.error ||
            'We could not delete your account. Please try again.'
        );
        return;
      }

      queryClient.clear();

      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error(
        'Delete account error:',
        error
      );

      Alert.alert(
        'Deletion Failed',
        'Something went wrong while deleting your account. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
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
            styles.headerTitle,
            { color: theme.primary },
          ]}
        >
          Delete Account
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Warning Icon */}
        <View style={styles.warningContainer}>
          <View
            style={[
              styles.warningCircle,
              {
                backgroundColor: `${Colors.error}15`,
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={54}
              color={Colors.error}
            />
          </View>

          <Text
            style={[
              styles.title,
              { color: theme.text },
            ]}
          >
            Delete your account?
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: theme.textSecondary },
            ]}
          >
            We're sorry to see you go. Please make sure
            you understand what happens before continuing.
          </Text>
        </View>

        {/* Consequences */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            What will be deleted?
          </Text>

          <DeleteItem
            icon="person-outline"
            text="Your Brain Buzz profile and account information"
            theme={theme}
          />

          <DeleteItem
            icon="time-outline"
            text="Your complete quiz history"
            theme={theme}
          />

          <DeleteItem
            icon="trophy-outline"
            text="Your achievements and progress"
            theme={theme}
          />

          <DeleteItem
            icon="stats-chart-outline"
            text="Your quiz statistics and performance data"
            theme={theme}
          />

          <DeleteItem
            icon="notifications-outline"
            text="Your account-related notification data"
            theme={theme}
          />
        </View>

        {/* Warning */}
        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: `${Colors.error}10`,
              borderColor: `${Colors.error}30`,
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={Colors.error}
          />

          <Text
            style={[
              styles.warningText,
              { color: theme.text },
            ]}
          >
            This action is permanent. Once your account is
            deleted, your account data cannot be recovered.
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: Colors.error,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          onPress={handleDeleteAccount}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="trash-outline"
              size={21}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.deleteButtonText}>
            {isLoading
              ? 'Deleting Account...'
              : 'Delete My Account'}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.cancelText,
              { color: theme.primary },
            ]}
          >
            Keep My Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------
   DELETE ITEM
------------------------------------------------------- */

const DeleteItem = ({
  icon,
  text,
  theme,
}) => {
  return (
    <View style={styles.deleteItem}>
      <View
        style={[
          styles.deleteItemIcon,
          {
            backgroundColor: `${Colors.error}10`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={Colors.error}
        />
      </View>

      <Text
        style={[
          styles.deleteItemText,
          { color: theme.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------
   STYLES
------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 15,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 45,
  },

  warningContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },

  warningCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontFamily: 'Archivo-Black',
    fontSize: 25,
    textAlign: 'center',
  },

  subtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 340,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    marginBottom: 15,
  },

  cardTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
    marginBottom: 16,
  },

  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  deleteItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  deleteItemText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 22,
  },

  warningText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    marginLeft: 10,
  },

  deleteButton: {
    minHeight: 58,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },

  cancelButton: {
    minHeight: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  cancelText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },
});