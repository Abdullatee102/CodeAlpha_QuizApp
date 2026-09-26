// src/app/notifications.jsx

import React, {
  useCallback,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
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
  useNotificationsQuery,
} from '../../hooks/useNotificationsQuery';

import {
  useNotificationMutations,
} from '../../hooks/useNotificationMutations';

import {
  useThemeStore,
} from '../../store/themeStore';

import {
  Colors,
} from '../../constants/colors';

const formatNotificationTime = (
  value
) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const difference =
    now.getTime() -
    date.getTime();

  const seconds = Math.floor(
    difference / 1000
  );

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? 'numeric'
          : undefined,
    }
  );
};

const getNotificationIcon = (
  notification
) => {
  const type =
    notification?.type ||
    notification?.data?.type ||
    '';

  if (
    type ===
    'achievement_unlocked'
  ) {
    return 'trophy';
  }

  if (
    type === 'quiz_completed'
  ) {
    return 'checkmark-circle';
  }

  if (
    type === 'announcement'
  ) {
    return 'megaphone';
  }

  if (
    type === 'system'
  ) {
    return 'information-circle';
  }

  return 'notifications';
};

export default function NotificationsScreen() {
  const router = useRouter();

  const {
    theme,
  } = useThemeStore();

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNotificationsQuery(50);

  const {
    markAsRead,
    markAllAsRead,
  } =
    useNotificationMutations();

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification?.isRead
    ).length;

  const handleNotificationPress =
    useCallback(
      async (notification) => {
        if (!notification) {
          return;
        }

        if (
          !notification.isRead &&
          notification.id
        ) {
          try {
            await markAsRead.mutateAsync(
              notification.id
            );
          } catch (error) {
            console.warn(
              '[NOTIFICATIONS] Failed to mark notification as read:',
              error
            );
          }
        }

        const url =
          notification?.data?.url;

        if (url) {
          try {
            router.push(url);
          } catch (error) {
            console.warn(
              '[NOTIFICATIONS] Failed to navigate from notification:',
              error
            );
          }
        }
      },
      [
        markAsRead,
        router,
      ]
    );

  const handleMarkAllAsRead =
    async () => {
      if (
        unreadCount === 0 ||
        markAllAsRead.isPending
      ) {
        return;
      }

      try {
        await markAllAsRead.mutateAsync();
      } catch (error) {
        console.warn(
          '[NOTIFICATIONS] Failed to mark all notifications as read:',
          error
        );
      }
    };

  const renderNotification = ({
    item,
  }) => {
    const isUnread =
      !item?.isRead;

    const iconName =
      getNotificationIcon(item);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor:
              isUnread
                ? `${theme.primary}10`
                : theme.card,

            borderColor:
              isUnread
                ? `${theme.primary}35`
                : theme.border,
          },
        ]}
        onPress={() =>
          handleNotificationPress(
            item
          )
        }
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.notificationIcon,
            {
              backgroundColor:
                isUnread
                  ? `${theme.primary}18`
                  : `${theme.textSecondary}12`,
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={
              isUnread
                ? theme.primary
                : theme.textSecondary
            }
          />
        </View>

        <View
          style={
            styles.notificationContent
          }
        >
          <View
            style={
              styles.notificationTitleRow
            }
          >
            <Text
              style={[
                styles.notificationTitle,
                {
                  color:
                    theme.text,
                },
              ]}
              numberOfLines={2}
            >
              {item?.title ||
                'Notification'}
            </Text>

            {isUnread && (
              <View
                style={[
                  styles.unreadDot,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                ]}
              />
            )}
          </View>

          <Text
            style={[
              styles.notificationBody,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {item?.body || ''}
          </Text>

          <Text
            style={[
              styles.notificationTime,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {formatNotificationTime(
              item?.createdAt
            )}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View
          style={styles.centerState}
        >
          <ActivityIndicator
            size="large"
            color={theme.primary}
          />

          <Text
            style={[
              styles.stateText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View
          style={styles.centerState}
        >
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor:
                  `${Colors.error}12`,
              },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color={Colors.error}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Couldn&apos;t load notifications
          </Text>

          <Text
            style={[
              styles.emptyText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Check your connection and
            try again.
          </Text>

          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor:
                  theme.primary,
              },
            ]}
            onPress={() =>
              refetch()
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={styles.centerState}
      >
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor:
                `${theme.primary}12`,
            },
          ]}
        >
          <Ionicons
            name="notifications-off-outline"
            size={38}
            color={theme.primary}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: theme.text,
            },
          ]}
        >
          No notifications yet
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Achievement and other
          important updates will appear
          here.
        </Text>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            router.back()
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        <View
          style={styles.headerTitleContainer}
        >
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

          {unreadCount > 0 && (
            <View
              style={[
                styles.headerCount,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
            >
              <Text
                style={
                  styles.headerCountText
                }
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={
            handleMarkAllAsRead
          }
          disabled={
            unreadCount === 0 ||
            markAllAsRead.isPending
          }
          activeOpacity={0.7}
        >
          {markAllAsRead.isPending ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />
          ) : (
            <Ionicons
              name="checkmark-done-outline"
              size={24}
              color={
                unreadCount > 0
                  ? theme.primary
                  : theme.textSecondary
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Notification list */}
      <FlatList
        data={notifications}
        renderItem={
          renderNotification
        }
        keyExtractor={(item, index) =>
          item?.id ||
          `notification-${index}`
        }
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isFetching &&
              !isLoading
            }
            onRefresh={refetch}
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
        }
        ListEmptyComponent={
          renderEmpty
        }
      />
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

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  headerCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCountText: {
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 10,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  notificationCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 11,
  },

  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  notificationTitle: {
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
    lineHeight: 19,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },

  notificationBody: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 19,
  },

  notificationTime: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
    marginTop: 7,
  },

  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
    textAlign: 'center',
  },

  emptyText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },

  stateText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginTop: 12,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },
});