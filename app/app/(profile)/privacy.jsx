import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const PRIVACY_OPTIONS = [
  {
    key: 'USERNAME_ONLY',
    title: 'Username Only (Recommended)',
    desc: 'Displays your @username and faculty badge. Your full student name is kept private.',
    icon: 'at-outline',
  },
  {
    key: 'FULL_NAME',
    title: 'Full Name & Username',
    desc: 'Displays your complete student name alongside your @username on public rankings.',
    icon: 'person-outline',
  },
  {
    key: 'ANONYMOUS',
    title: 'Anonymous Scholar',
    desc: 'Hides your name, username, and photo completely. You appear only as "Scholar #XXXX".',
    icon: 'eye-off-outline',
  },
  {
    key: 'EXCLUDE',
    title: 'Exclude from Leaderboards',
    desc: 'Omits your account from all public leaderboards. You can still see your personal rank privately.',
    icon: 'shield-outline',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();
  const { profile, updateLeaderboardPrivacy } = useAuthStore();

  const currentPrivacy = profile?.leaderboardPrivacy || 'USERNAME_ONLY';
  const [selectedPrivacy, setSelectedPrivacy] = useState(currentPrivacy);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const handleSelect = async (privacyKey) => {
    if (privacyKey === selectedPrivacy || isUpdating) return;

    setSelectedPrivacy(privacyKey);
    setIsUpdating(true);
    setSaveMessage(null);

    const result = await updateLeaderboardPrivacy(privacyKey);
    setIsUpdating(false);

    if (result.success) {
      setSaveMessage('Preference saved successfully');
      setTimeout(() => setSaveMessage(null), 3500);
    } else {
      setSelectedPrivacy(currentPrivacy);
      setSaveMessage(result.error || 'Failed to update preference');
      setTimeout(() => setSaveMessage(null), 3500);
    }
  };

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
          Privacy & Leaderboard
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* LEADERBOARD PRIVACY SELECTOR */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
            Leaderboard Display Preference
          </Text>
        </View>

        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Control how your name and identity appear on campus, faculty, and
          department leaderboards. Your choice is applied instantly.
        </Text>

        {saveMessage && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: saveMessage.includes('Failed')
                  ? '#FEF2F2'
                  : isDarkMode
                  ? '#064E3B'
                  : '#ECFDF5',
                borderColor: saveMessage.includes('Failed')
                  ? '#EF4444'
                  : '#10B981',
              },
            ]}
          >
            <Ionicons
              name={
                saveMessage.includes('Failed')
                  ? 'alert-circle-outline'
                  : 'checkmark-circle'
              }
              size={18}
              color={
                saveMessage.includes('Failed')
                  ? '#DC2626'
                  : isDarkMode
                  ? '#6EE7B7'
                  : '#059669'
              }
            />
            <Text
              style={[
                styles.feedbackText,
                {
                  color: saveMessage.includes('Failed')
                    ? '#DC2626'
                    : isDarkMode
                    ? '#D1FAE5'
                    : '#065F46',
                },
              ]}
            >
              {saveMessage}
            </Text>
          </View>
        )}

        <View style={styles.optionsList}>
          {PRIVACY_OPTIONS.map((opt) => {
            const isSelected = selectedPrivacy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleSelect(opt.key)}
                activeOpacity={0.8}
                disabled={isUpdating}
              >
                <View
                  style={[
                    styles.optionIconContainer,
                    {
                      backgroundColor: isSelected
                        ? `${theme.primary}20`
                        : isDarkMode
                        ? '#2D3748'
                        : '#E5E7EB',
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? theme.primary : theme.textSecondary}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {opt.desc}
                  </Text>
                </View>

                <View style={styles.radioContainer}>
                  {isUpdating && isSelected ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected
                            ? theme.primary
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECURITY & PRIVACY GUARANTEE */}
        <View
          style={[
            styles.guaranteeBox,
            {
              backgroundColor: isDarkMode ? '#1A202C' : '#F0F9FF',
              borderColor: isDarkMode ? '#2D3748' : '#BAE6FD',
            },
          ]}
        >
          <Ionicons name="lock-closed" size={20} color={theme.primary} />
          <View style={styles.guaranteeTextContainer}>
            <Text style={[styles.guaranteeTitle, { color: theme.text }]}>
              Institutional Privacy Guarantee
            </Text>
            <Text
              style={[
                styles.guaranteeDesc,
                { color: theme.textSecondary },
              ]}
            >
              • Student emails, phone numbers, and matriculation numbers are NEVER displayed publicly.{'\n'}
              • Academic test results and exam histories are stored separately from competitive rankings.{'\n'}
              • Even when excluded from public view, your personal performance metrics remain accessible to you.
            </Text>
          </View>
        </View>

        {/* DIVIDER */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDarkMode ? '#2D3748' : '#E5E7EB' },
          ]}
        />

        {/* STATUTORY PRIVACY POLICY */}
        <Text style={[styles.policyHeading, { color: theme.primary }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          Last Updated: October 2026 (BB-04 Verified)
        </Text>

        <Text style={[styles.body, { color: theme.textSecondary }]}>
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
          Brain Buzz operates academic leaderboards based on Mastery XP earned through verified practice. In accordance with student privacy controls, you may choose to appear with your username, full name, anonymously, or exclude yourself entirely from public rankings.
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
  },
  introText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  feedbackText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 13,
    flex: 1,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  optionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  optionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
    marginBottom: 3,
  },
  optionDesc: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  guaranteeBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  guaranteeTextContainer: {
    flex: 1,
  },
  guaranteeTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  policyHeading: {
    fontFamily: 'Archivo-Black',
    fontSize: 22,
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginBottom: 16,
  },
  body: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 12,
  },
});
