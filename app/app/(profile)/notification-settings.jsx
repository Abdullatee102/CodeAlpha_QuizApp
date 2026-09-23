// src/app/notification-settings.jsx

import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
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
  useAuthStore,
} from '../../store/authStore';

import {
  useThemeStore,
} from '../../store/themeStore';

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const {
    getPushNotificationStatus,
    enablePushNotifications,
    disablePushNotifications,
  } = useAuthStore();

  const {
    theme,
  } = useThemeStore();

  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const result =
          await getPushNotificationStatus();

        if (
          isMounted &&
          result?.success
        ) {
          setNotificationsEnabled(
            Boolean(
              result?.data?.enabled
            )
          );
        }
      } catch (error) {
        console.warn(
          '[NOTIFICATION SETTINGS] Failed to load push status:',
          error
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [
    getPushNotificationStatus,
  ]);

  const handleToggle =
    async (value) => {
      if (isUpdating) {
        return;
      }

      setIsUpdating(true);

      try {
        if (value) {
          /*
           * This requests notification permission when
           * necessary and registers the device with the
           * backend when permission is available.
           */
          const result =
            await enablePushNotifications();

          if (result?.success) {
            setNotificationsEnabled(
              true
            );
          } else {
            setNotificationsEnabled(
              false
            );

            Alert.alert(
              'Notifications Not Enabled',
              result?.error ||
                'We could not enable push notifications. Please check your notification permissions.'
            );
          }
        } else {
          /*
           * This removes the device from backend
           * push registration while preserving the
           * operating-system permission itself.
           */
          const result =
            await disablePushNotifications();

          if (result?.success) {
            setNotificationsEnabled(
              false
            );
          } else {
            Alert.alert(
              'Could Not Disable Notifications',
              result?.error ||
                'Something went wrong while disabling notifications.'
            );
          }
        }
      } catch (error) {
        console.error(
          '[NOTIFICATION SETTINGS] Toggle error:',
          error
        );

        Alert.alert(
          'Notification Settings',
          'Something went wrong while updating notification settings.'
        );
      } finally {
        setIsUpdating(false);
      }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.headerButton}
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
              color: theme.text,
            },
          ]}
        >
          Notifications
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <View
        style={styles.content}
      >
        {/* Push notification setting */}
        <View
          style={[
            styles.settingCard,
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
              styles.settingIcon,
              {
                backgroundColor:
                  `${theme.primary}15`,
              },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.primary}
            />
          </View>

          <View
            style={
              styles.settingContent
            }
          >
            <Text
              style={[
                styles.settingTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Push Notifications
            </Text>

            <Text
              style={[
                styles.settingDescription,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Receive alerts for achievements
              and other important updates.
            </Text>
          </View>

          {isLoading ||
          isUpdating ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />
          ) : (
            <Switch
              value={
                notificationsEnabled
              }
              onValueChange={
                handleToggle
              }
              trackColor={{
                false: theme.border,
                true: `${theme.primary}70`,
              }}
              thumbColor={
                notificationsEnabled
                  ? theme.primary
                  : '#f4f3f4'
              }
              ios_backgroundColor={
                theme.border
              }
            />
          )}
        </View>

        {/* Explanation */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                `${theme.primary}0D`,
              borderColor:
                `${theme.primary}25`,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={theme.primary}
          />

          <Text
            style={[
              styles.infoText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Turning this setting off stops
            Brain Buzz from registering this
            device for push notifications.
            Your notification history remains
            available inside the app.
          </Text>
        </View>

        {/* Notification history */}
        <TouchableOpacity
          style={[
            styles.historyCard,
            {
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            },
          ]}
          onPress={() =>
            router.push('/notifications')
          }
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.historyIcon,
              {
                backgroundColor:
                  `${theme.primary}15`,
              },
            ]}
          >
            <Ionicons
              name="list-outline"
              size={23}
              color={theme.primary}
            />
          </View>

          <View
            style={
              styles.historyContent
            }
          >
            <Text
              style={[
                styles.historyTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Notification History
            </Text>

            <Text
              style={[
                styles.historySubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              View all notifications sent to
              your account.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              theme.textSecondary
            }
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  settingCard: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  settingContent: {
    flex: 1,
    paddingRight: 10,
  },

  settingTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },

  settingDescription: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  infoCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 18,
  },

  historyCard: {
    marginTop: 15,
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  historyContent: {
    flex: 1,
    paddingRight: 10,
  },

  historyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },

  historySubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});