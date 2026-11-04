import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Privacy Policy
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.policyHeading, { color: theme.primary }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          Last Updated: October 2026
        </Text>

        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          This Privacy Policy explains how Brain Buzz collects, uses, stores, and protects student information when you use our academic CBT practice application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          1. Data Collection
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We collect information strictly necessary to provide and improve Brain Buzz academic services. This includes your name, username, institutional email, department, faculty, academic level, and practice quiz history.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          2. Academic Practice & Leaderboards
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Brain Buzz operates academic leaderboards based on Mastery XP earned through verified practice. In accordance with student privacy controls, you may choose to appear with your username, full name, anonymously, or exclude yourself entirely from public rankings. These controls can be customized at any time under Settings → Leaderboard Privacy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          3. Biometric Security
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Brain Buzz does not store fingerprints, facial data, or biometric records. Biometric authentication relies exclusively on your device&apos;s secure enclave and operating system.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          4. Push Notifications
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          When push notifications are enabled, Brain Buzz stores device push tokens to deliver study reminders, quiz feedback, and achievement alerts. Dead or reassigned tokens are automatically pruned.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          5. Data Security & Storage
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We implement industry-standard database indexing, salted hashing, and credential isolation to safeguard student information against unauthorized access.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          6. Account Deletion
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          You can request deletion of your Brain Buzz account at any time under Settings → Delete Account. When an account deletion request is processed, personal information is permanently purged.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  policyHeading: {
    fontFamily: 'Archivo-Black',
    fontSize: 22,
    marginTop: 8,
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginBottom: 16,
  },
  intro: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 10,
  },
});
