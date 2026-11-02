import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function AssessmentsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useThemeStore();
  const { fetchAvailableAssessments } = useQuizStore();

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadAssessments = useCallback(async () => {
    setErrorMsg(null);
    const result = await fetchAvailableAssessments();
    if (result.success) {
      setAssessments(result.data || []);
    } else {
      setErrorMsg(result.error?.message || 'Failed to load assessments');
    }
    setIsLoading(false);
    setRefreshing(false);
  }, [fetchAvailableAssessments]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAssessments();
  }, [loadAssessments]);

  const formatSchedule = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-GB', {
        timeZone: 'Africa/Lagos',
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

  const getStatusBadge = (item) => {
    const status = item.operationalStatus || item.status;
    const studentStatus = item.studentAttemptStatus;

    if (studentStatus === 'SUBMITTED') {
      return { label: 'Submitted', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' };
    }
    if (studentStatus === 'IN_PROGRESS') {
      return { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', icon: 'play-circle' };
    }
    if (studentStatus === 'TIMED_OUT') {
      return { label: 'Timed Out', color: '#EF4444', bg: '#FEE2E2', icon: 'time' };
    }

    if (status === 'AVAILABLE_NOW' || status === 'AVAILABLE') {
      return { label: 'Available Now', color: '#10B981', bg: '#D1FAE5', icon: 'radio-button-on' };
    }
    if (status === 'SCHEDULED' || status === 'UPCOMING') {
      return { label: 'Upcoming', color: '#3B82F6', bg: '#DBEAFE', icon: 'calendar' };
    }
    if (status === 'ENDED' || status === 'EXPIRED') {
      return { label: 'Concluded', color: '#6B7280', bg: '#F3F4F6', icon: 'lock-closed' };
    }
    if (status === 'ATTEMPTS_EXHAUSTED') {
      return { label: 'Max Attempts Used', color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle' };
    }

    return { label: status, color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
  };

  const handleAssessmentPress = (item) => {
    router.push({
      pathname: '/(assessments)/instructions',
      params: { assessmentId: item.id },
    });
  };

  const renderAssessmentCard = ({ item }) => {
    const badge = getStatusBadge(item);
    const canAttempt =
      (item.operationalStatus === 'AVAILABLE_NOW' || item.studentAttemptStatus === 'IN_PROGRESS') &&
      item.studentAttemptStatus !== 'SUBMITTED' &&
      item.studentAttemptStatus !== 'TIMED_OUT';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.card || '#FFFFFF',
            borderColor: theme.border || '#E5E7EB',
          },
        ]}
        onPress={() => handleAssessmentPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>{item.courseCode || 'COURSE'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={14} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text || '#111827' }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.cardSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
          {item.courseTitle}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.metaText, { color: theme.textSecondary || '#6B7280' }]}>
              {item.durationMinutes} mins
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="help-circle-outline" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.metaText, { color: theme.textSecondary || '#6B7280' }]}>
              {item.questionsCount || item.totalQuestions || 0} Qs
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="star-outline" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.metaText, { color: theme.textSecondary || '#6B7280' }]}>
              {item.totalPoints || 0} pts
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="format-list-checks" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.metaText, { color: theme.textSecondary || '#6B7280' }]}>
              {item.assessmentType || 'CBT'}
            </Text>
          </View>
        </View>

        <View style={[styles.scheduleBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary || '#6B7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.scheduleText, { color: theme.textSecondary || '#6B7280' }]} numberOfLines={1}>
            {formatSchedule(item.startTime)} - {formatSchedule(item.endTime)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {item.studentAttemptStatus === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => handleAssessmentPress(item)}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Resume Exam</Text>
            </TouchableOpacity>
          ) : canAttempt ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary || '#6366F1' }]}
              onPress={() => handleAssessmentPress(item)}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Take Assessment</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]}
              onPress={() => handleAssessmentPress(item)}
            >
              <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary || '#6B7280'} style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: theme.textSecondary || '#6B7280' }]}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border || '#E5E7EB' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text || '#111827'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]}>
            Course Assessments
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            Official academic evaluations
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary || '#6366F1'} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading your assessments...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Unable to load assessments
          </Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary || '#6366F1' }]}
            onPress={loadAssessments}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : assessments.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.textSecondary || '#9CA3AF'} />
          <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
            No Assessments Available
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            There are currently no official course assessments scheduled for your enrolled courses.
          </Text>
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: theme.border || '#D1D5DB' }]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={16} color={theme.text || '#111827'} style={{ marginRight: 6 }} />
            <Text style={[styles.refreshBtnText, { color: theme.text || '#111827' }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssessmentCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary || '#6366F1'}
              colors={[theme.primary || '#6366F1']}
            />
          }
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

