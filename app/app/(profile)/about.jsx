// src/app/(main)/about.jsx

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import {
  useRouter,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useThemeStore,
} from '../../store/themeStore';

export default function AboutScreen() {
  const router = useRouter();

  const {
    theme,
  } = useThemeStore();


  // =========================================================
  // VERSION
  // =========================================================

  const handleVersion = () => {
    Alert.alert(
      'Brain Buzz',
      'Version 1.0.0\n\n© 2026 Popoola Abdullateef'
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

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
            {
              color:
                theme.primary,
            },
          ]}
        >
          About Brain Buzz
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* =====================================================
            APP INTRO
            ===================================================== */}

        <View style={styles.hero}>
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor:
                  theme.primary,
              },
            ]}
          >
            <Ionicons
              name="bulb-outline"
              size={48}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={[
              styles.appName,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Brain Buzz
          </Text>

          <Text
            style={[
              styles.tagline,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Learn. Practice. Grow.
          </Text>
        </View>

        {/* =====================================================
            ABOUT
            ===================================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          About
        </Text>

        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            },
          ]}
        >

          <AboutRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How your data is handled"
            theme={theme}
            onPress={
              ()=> router.push('/privacy')
            }
            showDivider
          />

          <AboutRow
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Rules for using Brain Buzz"
            theme={theme}
            onPress={
              ()=> router.push('/terms')
            }
            showDivider
          />

          <AboutRow
            icon="information-outline"
            title="Version 1.0.0"
            subtitle="Brain Buzz Beta"
            theme={theme}
            onPress={
              handleVersion
            }
            showDivider
          />
        </View>

        {/* =====================================================
            WHAT IS BRAIN BUZZ?
            ===================================================== */}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.infoIconContainer,
              {
                backgroundColor:
                  `${theme.primary}15`,
              },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={21}
              color={
                theme.primary
              }
            />
          </View>

          <Text
            style={[
              styles.infoTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            What is Brain Buzz?
          </Text>

          <Text
            style={[
              styles.infoText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Brain Buzz is built to give students a simple
            and engaging way to practice academic questions,
            test their knowledge, and monitor their learning
            progress.
          </Text>

          <Text
            style={[
              styles.infoText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Through quizzes, history, achievements, and
            performance tracking, Brain Buzz encourages
            students to keep learning and improving.
          </Text>
        </View>

        {/* =====================================================
            FEATURES
            ===================================================== */}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.infoIconContainer,
              {
                backgroundColor:
                  `${theme.primary}15`,
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={21}
              color={
                theme.primary
              }
            />
          </View>

          <Text
            style={[
              styles.infoTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            What You Can Do
          </Text>

          <FeatureRow
            icon="help-circle-outline"
            text="Practice academic quiz questions"
            theme={theme}
          />

          <FeatureRow
            icon="stats-chart-outline"
            text="Track your quiz performance"
            theme={theme}
          />

          <FeatureRow
            icon="time-outline"
            text="Review your completed quizzes"
            theme={theme}
          />

          <FeatureRow
            icon="trophy-outline"
            text="Unlock achievements as you progress"
            theme={theme}
          />

          <FeatureRow
            icon="notifications-outline"
            text="Stay updated with important notifications"
            theme={theme}
            last
          />
        </View>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Brain Buzz
          </Text>

          <Text
            style={[
              styles.footerTagline,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Learn. Practice. Grow.
          </Text>

          <Text
            style={[
              styles.copyright,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            © 2026 Popoola Abdullateef
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================
// ABOUT ROW
// =============================================================

const AboutRow = ({
  icon,
  title,
  subtitle,
  theme,
  onPress,
  showDivider = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        showDivider && {
          borderTopWidth: 1,
          borderTopColor:
            theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              `${theme.primary}15`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            theme.primary
          }
        />
      </View>

      <View
        style={
          styles.rowContent
        }
      >
        <Text
          style={[
            styles.rowTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.rowSubtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={
          theme.textSecondary
        }
      />
    </TouchableOpacity>
  );
};

// =============================================================
// FEATURE ROW
// =============================================================

const FeatureRow = ({
  icon,
  text,
  theme,
  last = false,
}) => {
  return (
    <View
      style={[
        styles.featureRow,
        !last && {
          marginBottom: 14,
        },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          {
            backgroundColor:
              `${theme.primary}12`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={
            theme.primary
          }
        />
      </View>

      <Text
        style={[
          styles.featureText,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 15,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 45,
  },

  // ===========================================================
  // HERO
  // ===========================================================

  hero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 22,
  },

  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  appName: {
    fontFamily: 'Archivo-Black',
    fontSize: 27,
  },

  tagline: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 14,
    marginTop: 5,
  },

  // ===========================================================
  // SECTION
  // ===========================================================

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 9,
    marginLeft: 3,
  },

  menuContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  rowContent: {
    flex: 1,
    paddingRight: 10,
  },

  rowTitle: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 15,
  },

  rowSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  // ===========================================================
  // INFO CARD
  // ===========================================================

  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    marginTop: 15,
  },

  infoIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },

  infoTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
    marginBottom: 10,
  },

  infoText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },

  // ===========================================================
  // FEATURES
  // ===========================================================

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  featureText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13.5,
    lineHeight: 20,
    flex: 1,
  },

  // ===========================================================
  // FOOTER
  // ===========================================================

  footer: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 10,
  },

  footerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 18,
  },

  footerTagline: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 4,
  },

  copyright: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
    marginTop: 10,
    opacity: 0.5,
  },
});