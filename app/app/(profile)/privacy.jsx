import React from 'react';

import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useThemeStore } from '../../store/themeStore';

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={28}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.primary,
            },
          ]}
        >
          Privacy Policy
        </Text>

        <Text
          style={[
            styles.date,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Last Updated: September 2026
        </Text>

        <Text
          style={[
            styles.introduction,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          This Privacy Policy explains how Brain Buzz collects,
          uses, stores, and protects information when you use
          our application.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          1. Data Collection
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We collect information necessary to provide and
          improve Brain Buzz services. This may include your
          name, username, contact information, profile details,
          quiz results, scores, academic progress, and
          information related to your use of the application.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          2. How We Use Your Information
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Your information may be used to create and manage
          your account, provide quiz and learning features,
          track academic progress, calculate achievements,
          maintain leaderboards, provide support, improve the
          application, and protect the security of our services.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          3. Biometric Data
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Brain Buzz does not store your actual fingerprint,
          face, or other biometric information. When biometric
          authentication is enabled, Brain Buzz relies on the
          authentication mechanisms provided by your device
          operating system. Your biometric data remains under
          the control of your device's secure authentication
          system.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          4. Notifications
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          If you enable push notifications, Brain Buzz may
          store your device's push notification token so that
          we can deliver relevant notifications to you. You can
          disable push notifications through your device or
          application settings.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          5. Data Security
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We take reasonable measures to protect information
          associated with your account from unauthorized access,
          alteration, disclosure, or destruction. However, no
          internet-based service can guarantee absolute security.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          6. Account Deletion
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          You can request deletion of your Brain Buzz account.
          When an account deletion request is processed, personal
          information and associated account data will be deleted
          or anonymized where appropriate, subject to any data
          that we may be required to retain for legitimate legal,
          security, or operational purposes.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          7. Changes to This Policy
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We may update this Privacy Policy from time to time.
          When important changes are made, we will take
          reasonable steps to notify users through the
          application or other appropriate channels.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 60,
    justifyContent: 'center',
  },

  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },

  content: {
    paddingHorizontal: 25,
    paddingBottom: 50,
  },

  title: {
    fontFamily: 'Archivo-Black',
    fontSize: 28,
    marginBottom: 5,
  },

  date: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 25,
  },

  introduction: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },

  body: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 15,
    lineHeight: 24,
  },
});