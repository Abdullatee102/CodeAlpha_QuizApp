import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function CourseNoticesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { offeringId, courseCode, courseTitle } = params;

  const { theme, isDarkMode } = useThemeStore();
  const { fetchCourseAnnouncements } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  const loadNotices = useCallback(async (isRefresh = false) => {
    if (!offeringId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    const res = await fetchCourseAnnouncements(offeringId);
    if (res.success && res.data) {
      setAnnouncements(res.data.announcements || []);
    } else {
      setErrorMsg(res.error?.message || 'Failed to retrieve course announcements.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [offeringId, fetchCourseAnnouncements]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleOpenAttachment = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open', 'Unable to open this attachment link.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to open link.');
    }
  };

  const getPriorityBadge = (priority = 'NORMAL') => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return { label: 'URGENT', color: '#DC2626', bg: isDarkMode ? '#451A1A' : '#FEF2F2', border: '#FCA5A5' };
      case 'IMPORTANT':
        return { label: 'IMPORTANT', color: '#D97706', bg: isDarkMode ? '#452A15' : '#FFFBEB', border: '#FCD34D' };
      default:
        return { label: 'NOTICE', color: '#2563EB', bg: isDarkMode ? '#172554' : '#EFF6FF', border: '#93C5FD' };
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background || '#F9FAFB', paddingTop: topInset }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: theme.border || '#E5E7EB' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text || '#111827'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.courseBadgeRow}>
            <View style={[styles.courseBadge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.courseBadgeText, { color: theme.primary }]}>
                {courseCode || 'COURSE'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
              Official Notices
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
            {courseTitle || 'Course Announcements'}
          </Text>
        </View>
      </View>

      {/* Main Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading notices...
          </Text>
        </View>
      ) : errorMsg && announcements.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Unable to Load Notices
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => loadNotices(false)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotices(true)}
              tintColor={theme.primary}
            />
          }
        >
          {/* Header Stats Banner */}
          <View
            style={[
              styles.statsBanner,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: theme.border || '#E5E7EB',
              },
            ]}
          >
            <View style={styles.statsIconWrap}>
              <Ionicons name="megaphone" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statsTitle, { color: theme.text || '#111827' }]}>
                {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'} Published
              </Text>
              <Text style={[styles.statsSub, { color: theme.textSecondary || '#6B7280' }]}>
                Official updates, schedule changes, and instructions from your lecturers.
              </Text>
            </View>
          </View>

          {announcements.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="bullhorn-outline"
                size={54}
                color={isDarkMode ? '#4B5563' : '#9CA3AF'}
              />
              <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
                No Notices Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                Your course lecturers have not posted any announcements for this course offering yet.
              </Text>
            </View>
          ) : (
            announcements.map((notice) => {
              const priority = getPriorityBadge(notice.priority);

              return (
                <View
                  key={notice.id}
                  style={[
                    styles.noticeCard,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: notice.isPinned
                        ? theme.primary
                        : theme.border || '#E5E7EB',
                      borderWidth: notice.isPinned ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Notice Badges */}
                  <View style={styles.noticeBadgeRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor: priority.bg,
                            borderColor: priority.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.priorityBadgeText, { color: priority.color }]}>
                          {priority.label}
                        </Text>
                      </View>

                      {notice.isPinned && (
                        <View style={[styles.pinnedBadge, { backgroundColor: theme.primary + '15' }]}>
                          <Ionicons name="pin" size={12} color={theme.primary} />
                          <Text style={[styles.pinnedBadgeText, { color: theme.primary }]}>
                            Pinned
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.dateText, { color: theme.textSecondary || '#6B7280' }]}>
                      {formatDate(notice.createdAt || notice.publishedAt)}
                    </Text>
                  </View>

                  {/* Notice Title */}
                  <Text style={[styles.noticeTitle, { color: theme.text || '#111827' }]}>
                    {notice.title}
                  </Text>

                  {/* Full Message Content (No truncation) */}
                  <Text style={[styles.noticeContent, { color: theme.textSecondary || '#374151' }]}>
                    {notice.content}
                  </Text>

                  {/* Author & Optional Attachment */}
                  <View style={[styles.noticeFooter, { borderTopColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
                    <View style={styles.authorRow}>
                      <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.authorAvatarText, { color: theme.primary }]}>
                          {notice.authorName ? notice.authorName.charAt(0).toUpperCase() : 'L'}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.authorName, { color: theme.text || '#111827' }]}>
                          {notice.authorName || 'Course Lecturer'}
                        </Text>
                        <Text style={[styles.authorRole, { color: theme.textSecondary || '#6B7280' }]}>
                          Course Instructor
                        </Text>
                      </View>
                    </View>

                    {notice.attachmentUrl && (
                      <TouchableOpacity
                        style={[styles.attachmentBtn, { borderColor: theme.border || '#D1D5DB' }]}
                        onPress={() => handleOpenAttachment(notice.attachmentUrl)}
                      >
                        <Ionicons name="attach" size={16} color={theme.primary} />
                        <Text style={[styles.attachmentBtnText, { color: theme.primary }]}>
                          Attachment
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  courseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  courseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  statsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsSub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  noticeCard: {
    borderRadius: 16,
    padding: 16,
  },
  noticeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  noticeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  authorRole: {
    fontSize: 10,
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  attachmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
