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

export default function TermsScreen() {
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
          Terms of Service
        </Text>

        <Text
          style={[
            styles.date,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Effective: September 2026
        </Text>

        <Text
          style={[
            styles.introduction,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          These Terms of Service govern your use of the Brain
          Buzz application. By creating an account or using
          Brain Buzz, you agree to comply with these terms.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          1. Acceptance of Terms
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          By creating an account or using Brain Buzz, you
          acknowledge that you have read, understood, and agreed
          to these Terms of Service and our Privacy Policy. If
          you do not agree with these terms, you should not create
          or use an account.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          2. Eligibility and Account Information
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          You are responsible for providing accurate information
          when creating your Brain Buzz account and for keeping
          your account credentials secure. You should not
          impersonate another person or create an account using
          information that belongs to someone else.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          3. Academic Integrity
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Brain Buzz is designed as a learning and assessment
          aid. Users are encouraged to answer questions honestly
          so that quiz results accurately reflect their knowledge
          and progress.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          4. Prohibited Use
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Users must not attempt to scrape or copy protected
          question content, bypass application security
          mechanisms, manipulate quiz results, interfere with
          leaderboard scores, gain unauthorized access to
          accounts or services, or otherwise abuse Brain Buzz.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          5. Quiz Results and Leaderboards
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Quiz scores, achievements, rankings, and other
          academic statistics are generated using the systems
          provided by Brain Buzz. We may modify or correct
          results when necessary to address technical errors,
          abuse, or inaccurate data.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          6. Account Suspension or Termination
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We may suspend or terminate accounts that violate
          these Terms of Service, abuse the application, attempt
          to compromise its security, or otherwise engage in
          activities that may harm Brain Buzz or its users.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          7. Service Availability
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We aim to keep Brain Buzz available and reliable, but
          we cannot guarantee that the application will always
          be available, uninterrupted, or free from technical
          issues.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          8. Changes to These Terms
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          We may update these Terms of Service when necessary.
          Continued use of Brain Buzz after an updated version
          becomes effective means that you accept the revised
          terms.
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