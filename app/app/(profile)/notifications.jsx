// app/app/(profile)/notifications.jsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import Colors from '../../constants/colors';
import {
  useNotificationsQuery,
  useNotificationMutations,
} from '../../hooks/useNotificationsQuery';

const formatNotificationTime = (dateString) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const seconds = Math.floor(difference / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return (
    date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' at ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const getNotificationIconInfo = (notification) => {
  const type = (notification?.type || notification?.data?.type || '').toLowerCase();
  const title = (notification?.title || '').toLowerCase();

  if (type === 'support_update' || title.includes('support')) {
    return { name: 'chatbubbles', family: 'Ionicons', color: '#0284C7', label: 'Support Ticket' };
  }
  if (type === 'achievement_unlocked' || title.includes('achievement')) {
    return { name: 'trophy', family: 'Ionicons', color: '#F59E0B', label: 'Achievement' };
  }
  if (type === 'quiz_completed' || title.includes('quiz') || title.includes('exam')) {
    return { name: 'school', family: 'Ionicons', color: '#10B981', label: 'Academic' };
  }
  if (type === 'announcement' || title.includes('schedule') || title.includes('timetable') || title.includes('maintenance')) {
    return { name: 'megaphone', family: 'Ionicons', color: '#8B5CF6', label: 'Announcement' };
  }
  if (type === 'system') {
    return { name: 'information-circle', family: 'Ionicons', color: '#6366F1', label: 'System Notice' };
  }

  return { name: 'notifications', family: 'Ionicons', color: '#0284C7', label: 'Update' };
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNotificationsQuery(50);

  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = notifications.filter((n) => !n?.isRead).length;

  const getActionConfig = (notification) => {
    if (!notification) return null;
    const type = (notification?.type || notification?.data?.type || '').toLowerCase();
    const title = (notification?.title || '').toLowerCase();
    const body = (notification?.body || '').toLowerCase();
    const ticketId = notification?.data?.ticketId || notification?.data?.requestId;

    if (ticketId || type === 'support_update' || title.includes('support')) {
      return {
        label: 'Open Support Ticket',
        icon: 'chatbubbles-outline',
        onPress: () => {
          setSelectedNotification(null);
          router.push({
            pathname: '/(profile)/live-chat',
            params: ticketId ? { requestId: String(ticketId) } : {},
          });
        },
      };
    }

    if (
      type === 'achievement_unlocked' ||
      title.includes('achievement') ||
      body.includes('achievement') ||
      body.includes('badge')
    ) {
      return {
        label: 'View Achievements',
        icon: 'trophy-outline',
        onPress: () => {
          setSelectedNotification(null);
          router.push('/(profile)/achievements');
        },
      };
    }

    if (
      type === 'opportunity' ||
      title.includes('opportunity') ||
      title.includes('scholarship') ||
      body.includes('scholarship')
    ) {
      return {
        label: 'Explore Opportunities',
        icon: 'school-outline',
        onPress: () => {
          setSelectedNotification(null);
          router.push('/(profile)/opportunities');
        },
      };
    }

    if (
      type === 'quiz_completed' ||
      title.includes('quiz') ||
      title.includes('exam') ||
      title.includes('timetable') ||
      body.includes('harmattan') ||
      body.includes('semester')
    ) {
      return {
        label: 'Go to Courses & Practice',
        icon: 'book-outline',
        onPress: () => {
          setSelectedNotification(null);
          router.push('/(questions)/courses');
        },
      };
    }

    if (notification?.data?.url) {
      return {
        label: 'Open Details',
        icon: 'arrow-forward-outline',
        onPress: () => {
          setSelectedNotification(null);
          const target = notification.data.url === '/support' ? '/(profile)/live-chat' : notification.data.url;
          router.push(target);
        },
      };
    }

    return null;
  };

  const handleNotificationPress = useCallback(
    async (notification) => {
      if (!notification) return;

      if (!notification.isRead && notification.id) {
        try {
          await markAsRead.mutateAsync(notification.id);
        } catch (error) {
          console.warn('[NOTIFICATIONS] Failed to mark notification as read:', error);
        }
      }

      // Open inner detail screen (modal) for complete visibility
      setSelectedNotification(notification);
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markAllAsRead.isPending) return;
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.warn('[NOTIFICATIONS] Failed to mark all notifications as read:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item?.isRead;
    const iconInfo = getNotificationIconInfo(item);
    const action = getActionConfig(item);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: isUnread ? `${theme.primary}12` : theme.card,
            borderColor: isUnread ? `${theme.primary}40` : theme.border,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: `${iconInfo.color}18` },
          ]}
        >
          <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text
                style={[styles.notificationTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {item?.title || 'Notification'}
              </Text>
            </View>

            {isUnread && (
              <View
                style={[styles.unreadDot, { backgroundColor: theme.primary }]}
              />
            )}
          </View>

          <Text
            style={[styles.notificationBody, { color: theme.textSecondary }]}
            numberOfLines={3}
          >
            {item?.body || ''}
          </Text>

          <View style={styles.notificationFooter}>
            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
              {formatNotificationTime(item?.createdAt)}
            </Text>

            <View style={styles.cardActionBadge}>
              <Text style={[styles.cardActionText, { color: theme.primary }]}>
                {action?.label ? `${action.label} ➔` : 'View Details ➔'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: `${Colors.error}12` },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color={Colors.error}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Unable to load notifications
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: `${theme.primary}12` },
          ]}
        >
          <Ionicons
            name="notifications-off-outline"
            size={38}
            color={theme.primary}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No notifications yet
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Support ticket replies, announcements, and achievement alerts will appear here.
        </Text>
      </View>
    );
  };

  const activeAction = getActionConfig(selectedNotification);
  const activeIconInfo = getNotificationIconInfo(selectedNotification);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notifications
          </Text>

          {unreadCount > 0 && (
            <View
              style={[styles.headerCount, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.headerCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0 || markAllAsRead.isPending}
          activeOpacity={0.7}
        >
          {markAllAsRead.isPending ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name="checkmark-done-outline"
              size={24}
              color={unreadCount > 0 ? theme.primary : theme.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Notification list */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item, index) => item?.id || `notification-${index}`}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* DETAILED NOTIFICATION MODAL / INNER SCREEN */}
      <Modal
        visible={!!selectedNotification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <SafeAreaView style={styles.modalBackdrop} edges={['top', 'bottom', 'left', 'right']}>
          <View
            style={[
              styles.detailModalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {/* Header with Type & Close */}
            <View style={styles.modalHeaderRow}>
              <View
                style={[
                  styles.modalCategoryBadge,
                  { backgroundColor: `${activeIconInfo?.color || theme.primary}18` },
                ]}
              >
                <Ionicons
                  name={activeIconInfo?.name || 'notifications'}
                  size={14}
                  color={activeIconInfo?.color || theme.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modalCategoryText,
                    { color: activeIconInfo?.color || theme.primary },
                  ]}
                >
                  {activeIconInfo?.label || 'Notification'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedNotification(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Full Title */}
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedNotification?.title || 'Notification'}
              </Text>

              {/* Timestamp */}
              <View style={styles.modalTimeRow}>
                <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.modalTimeText, { color: theme.textSecondary }]}>
                  {formatFullDate(selectedNotification?.createdAt)} ({formatNotificationTime(selectedNotification?.createdAt)})
                </Text>
              </View>

              {/* Full Body Content */}
              <View
                style={[
                  styles.modalBodyWrap,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.modalBodyText, { color: theme.text }]}>
                  {selectedNotification?.body || 'No additional details provided.'}
                </Text>
              </View>
            </ScrollView>

            {/* Actions Footer */}
            <View style={styles.modalFooter}>
              {activeAction ? (
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
                  onPress={activeAction.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name={activeAction.icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalPrimaryBtnText}>{activeAction.label}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setSelectedNotification(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalPrimaryBtnText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  headerCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  notificationTime: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
  },
  cardActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 11,
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

  // Modal Detail Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalCategoryText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 8,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  modalTimeText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
  },
  modalBodyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  modalBodyText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  modalFooter: {
    marginTop: 6,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },
});
