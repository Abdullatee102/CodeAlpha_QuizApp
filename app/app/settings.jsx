// src/app/(main)/settings.jsx

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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
  useQueryClient,
} from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

import {
  useThemeStore,
} from '../store/themeStore';

import {
  Colors,
} from '../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const {
    logout,
    isLoading,
  } = useAuthStore();

  const {
    theme,
    appearance,
  } = useThemeStore();

  // =========================================================
  // APPEARANCE LABEL
  // =========================================================

  const getAppearanceLabel = () => {
    switch (appearance) {
      case 'light':
        return 'Light';

      case 'dark':
        return 'Dark';

      case 'system':
      default:
        return 'System Default';
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Log Out',
          style: 'destructive',

          onPress: async () => {
            try {
              /*
               * authStore.logout() already:
               *
               * 1. Unregisters push notifications.
               * 2. Logs out from the backend.
               * 3. Signs out from Firebase.
               * 4. Removes auth tokens.
               * 5. Calls quizStore.clearUserSession().
               * 6. Clears authStore user/session state.
               */

              const result =
                await logout();

              /*
               * Clear all TanStack Query
               * server-state cache so another
               * session cannot receive stale
               * data from this account.
               */

              queryClient.clear();

              if (
                result?.success === false
              ) {
                console.warn(
                  '[SETTINGS] Logout completed locally, but server logout reported an error:',
                  result.error
                );
              }

              router.replace(
                '/(auth)/sign-in'
              );
            } catch (error) {
              console.error(
                '[SETTINGS] Logout failed:',
                error
              );

              /*
               * Even if something unexpected
               * happens, clear the React Query
               * cache before returning to auth.
               */

              queryClient.clear();

              Alert.alert(
                'Logout Error',
                'Something went wrong while logging out. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

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
          Settings
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
            ACCOUNT
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
          Account
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
          <SettingsRow
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            theme={theme}
            onPress={() =>
              router.push(
                '/edit-profile'
              )
            }
          />

          <SettingsRow
            icon="finger-print-outline"
            title="Biometric Security"
            subtitle="Manage biometric login"
            theme={theme}
            onPress={() =>
              router.push(
                '/security'
              )
            }
            showDivider
          />

          <SettingsRow
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password"
            theme={theme}
            onPress={() =>
              router.push(
                '/change-password'
              )
            }
            showDivider
          />
        </View>

        {/* =====================================================
            PREFERENCES
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
          Preferences
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
          <SettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Push notifications and notification history"
            theme={theme}
            onPress={() =>
              router.push(
                '/notification-settings'
              )
            }
          />

          <SettingsRow
            icon="color-palette-outline"
            title="Appearance"
            subtitle={getAppearanceLabel()}
            theme={theme}
            onPress={() =>
              router.push(
                '/appearance'
              )
            }
            showDivider
          />
        </View>

        {/* =====================================================
            ACHIEVEMENT & GROWTH
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
          Achievement & Growth
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
          <SettingsRow
            icon="medal-outline"
            title="My Achievements"
            subtitle="View your unlocked achievements"
            theme={theme}
            onPress={() =>
              router.push(
                '/achievements'
              )
            }
          />

          <SettingsRow
            icon="time-outline"
            title="Quiz History"
            subtitle="Review your completed quizzes"
            theme={theme}
            onPress={() =>
              router.push(
                '/history'
              )
            }
            showDivider
          />
        </View>

        {/* =====================================================
            SUPPORT
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
          Support
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
          <SettingsRow
            icon="help-circle-outline"
            title="Help Center"
            subtitle="Get help and find answers"
            theme={theme}
            onPress={() =>
              router.push(
                '/support'
              )
            }
          />
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
          <SettingsRow
            icon="information-circle-outline"
            title="About Brain Buzz"
            subtitle="Learn more about Brain Buzz"
            theme={theme}
            onPress={() =>
              router.push(
                '/about'
              )
            }
          />

        </View>

        {/* =====================================================
            DELETE ACCOUNT
            ===================================================== */}

        <Text
          style={[
            styles.sectionTitle,
            styles.dangerSectionTitle,
            {
              color:
                Colors.error,
            },
          ]}
        >
          Delete Account
        </Text>

        <View
          style={[
            styles.dangerContainer,
            {
              backgroundColor:
                theme.card,
              borderColor:
                `${Colors.error}45`,
            },
          ]}
        >
          <TouchableOpacity
            style={
              styles.dangerRow
            }
            onPress={() =>
              router.push(
                '/delete-account'
              )
            }
            activeOpacity={0.65}
          >
            <View
              style={[
                styles.dangerIconContainer,
                {
                  backgroundColor:
                    `${Colors.error}15`,
                },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color={
                  Colors.error
                }
              />
            </View>

            <View
              style={
                styles.dangerTextContainer
              }
            >
              <Text
                style={[
                  styles.dangerTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Delete My Account
              </Text>

              <Text
                style={[
                  styles.dangerSubtitle,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Permanently delete your account and associated data
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={
                Colors.error
              }
            />
          </TouchableOpacity>
        </View>

        {/* =====================================================
            LOGOUT
            ===================================================== */}

        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor:
                theme.card,
              borderColor:
                Colors.error,
              opacity: isLoading
                ? 0.6
                : 1,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={
              Colors.error
            }
          />

          <Text
            style={[
              styles.logoutText,
              {
                color:
                  Colors.error,
              },
            ]}
          >
            Log Out
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        <View style={styles.footer}>
          <Text
            style={[
              styles.version,
              {
                color:
                  theme.textSecondary,
                opacity: 0.5,
              },
            ]}
          >
            Version 1.0.0 (Brain Buzz Beta)
          </Text>

          <Text
            style={[
              styles.copyright,
              {
                color:
                  theme.textSecondary,
                opacity: 0.3,
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
// SETTINGS ROW
// =============================================================

const SettingsRow = ({
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
    fontSize: 21,
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 9,
    marginLeft: 3,
  },

  dangerSectionTitle: {
    marginTop: 30,
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
  // DELETE ACCOUNT
  // ===========================================================

  dangerContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  dangerRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  dangerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  dangerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  dangerTitle: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 15,
  },

  dangerSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  // ===========================================================
  // LOGOUT
  // ===========================================================

  logoutButton: {
    marginTop: 30,
    minHeight: 58,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  logoutText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },

  // ===========================================================
  // FOOTER
  // ===========================================================

  footer: {
    alignItems: 'center',
    marginTop: 20,
  },

  version: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    textAlign: 'center',
  },

  copyright: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
});