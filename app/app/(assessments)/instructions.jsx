import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function AssessmentInstructionsScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useThemeStore();
  const { fetchAssessmentInstructions, startOrResumeAttempt } = useQuizStore();

  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadInstructions = useCallback(async () => {
    if (!assessmentId) return;
    setErrorMsg(null);
    setIsLoading(true);
    const result = await fetchAssessmentInstructions(assessmentId);
    if (result.success && result.data) {
      setAssessment(result.data);
    } else {
      setErrorMsg(result.error?.message || 'Failed to load assessment instructions');
    }
    setIsLoading(false);
  }, [assessmentId, fetchAssessmentInstructions]);

  useEffect(() => {
    loadInstructions();
  }, [loadInstructions]);

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

  const handleStartExam = async () => {
    if (!assessment) return;

    // Confirm dialog if starting fresh
    if (assessment.studentAttemptStatus !== 'IN_PROGRESS') {
      Alert.alert(
        'Start Assessment?',
        `You have ${assessment.durationMinutes} minutes to complete this assessment. The timer will start immediately and cannot be paused.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Begin Now',
            onPress: executeStartAttempt,
          },
        ]
      );
    } else {
      executeStartAttempt();
    }
  };

  const executeStartAttempt = async () => {
    setIsStarting(true);
    const result = await startOrResumeAttempt(assessment.id);
    setIsStarting(false);

    if (result.success && result.data?.attempt) {
      router.replace({
        pathname: '/(assessments)/exam',
        params: {
          assessmentId: assessment.id,
          attemptId: result.data.attempt.id,
        },
      });
    } else {
      Alert.alert(
        'Cannot Start Assessment',
        result.error?.message || 'An error occurred while initiating the assessment attempt. Please try again or contact your lecturer.'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary || '#6366F1'} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading assessment details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !assessment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>Error</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg || 'Assessment not found'}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary || '#6366F1', marginTop: 16 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOngoingAttempt = assessment.studentAttemptStatus === 'IN_PROGRESS';
  const isSubmitted = assessment.studentAttemptStatus === 'SUBMITTED';
  const isTimedOut = assessment.studentAttemptStatus === 'TIMED_OUT';
  const canStart =
    (assessment.operationalStatus === 'AVAILABLE_NOW' || isOngoingAttempt) &&
    !isSubmitted &&
    !isTimedOut;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border || '#E5E7EB' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text || '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]}>
          Assessment Briefing
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Banner */}
        <View style={[styles.bannerCard, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
          <View style={styles.badgeRow}>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>{assessment.courseCode || 'COURSE'}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.typeBadgeText, { color: '#1D4ED8' }]}>{assessment.assessmentType || 'CBT'}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text || '#111827' }]}>{assessment.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary || '#6B7280' }]}>
            {assessment.courseTitle}
          </Text>

          {assessment.session && (
            <Text style={[styles.sessionText, { color: theme.textSecondary || '#6B7280' }]}>
              Academic Session: {assessment.session} ({assessment.semester})
            </Text>
          )}
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.grid}>
          <View style={[styles.gridItem, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#6366F1" />
            <Text style={[styles.gridValue, { color: theme.text || '#111827' }]}>
              {assessment.durationMinutes}
            </Text>
            <Text style={[styles.gridLabel, { color: theme.textSecondary || '#6B7280' }]}>Minutes</Text>
          </View>

          <View style={[styles.gridItem, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color="#10B981" />
            <Text style={[styles.gridValue, { color: theme.text || '#111827' }]}>
              {assessment.questionsCount || 0}
            </Text>
            <Text style={[styles.gridLabel, { color: theme.textSecondary || '#6B7280' }]}>Questions</Text>
          </View>

          <View style={[styles.gridItem, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <MaterialCommunityIcons name="star-outline" size={24} color="#F59E0B" />
            <Text style={[styles.gridValue, { color: theme.text || '#111827' }]}>
              {assessment.totalPoints || 0}
            </Text>
            <Text style={[styles.gridLabel, { color: theme.textSecondary || '#6B7280' }]}>Points</Text>
          </View>

          <View style={[styles.gridItem, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <MaterialCommunityIcons name="repeat" size={24} color="#8B5CF6" />
            <Text style={[styles.gridValue, { color: theme.text || '#111827' }]}>
              {assessment.existingAttemptsCount || 0}/{assessment.maxAttempts || 1}
            </Text>
            <Text style={[styles.gridLabel, { color: theme.textSecondary || '#6B7280' }]}>Attempts</Text>
          </View>
        </View>

        {/* Schedule Window */}
        <View style={[styles.infoCard, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
          <Text style={[styles.infoTitle, { color: theme.text || '#111827' }]}>Examination Window</Text>
          <View style={styles.scheduleRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.scheduleValue, { color: theme.textSecondary || '#6B7280' }]}>
              Opens: {formatSchedule(assessment.startTime)}
            </Text>
          </View>
          <View style={[styles.scheduleRow, { marginTop: 6 }]}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary || '#6B7280'} />
            <Text style={[styles.scheduleValue, { color: theme.textSecondary || '#6B7280' }]}>
              Closes: {formatSchedule(assessment.endTime)}
            </Text>
          </View>
        </View>

        {/* Instructions / Description */}
        {assessment.description ? (
          <View style={[styles.infoCard, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <Text style={[styles.infoTitle, { color: theme.text || '#111827' }]}>Lecturer Instructions</Text>
            <Text style={[styles.infoBody, { color: theme.text || '#374151' }]}>
              {assessment.description}
            </Text>
          </View>
        ) : null}

        {/* Examination Rules & Regulations */}
        <View style={[styles.rulesCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7', borderColor: isDarkMode ? '#334155' : '#FDE68A' }]}>
          <View style={styles.rulesHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={[styles.rulesTitle, { color: isDarkMode ? '#FCD34D' : '#92400E' }]}>
              Examination Rules & Integrity
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons name="timer-outline" size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.ruleText, { color: isDarkMode ? '#CBD5E1' : '#78350F' }]}>
              <Text style={{ fontWeight: '700' }}>Server-Authoritative Clock:</Text> The timer is managed by the server and will not stop if you exit the app or lose connection.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons name="cloud-upload-outline" size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.ruleText, { color: isDarkMode ? '#CBD5E1' : '#78350F' }]}>
              <Text style={{ fontWeight: '700' }}>Instant Auto-Save:</Text> Every question answer is saved automatically to the examination server as you type or select it.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons name="pulse-outline" size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.ruleText, { color: isDarkMode ? '#CBD5E1' : '#78350F' }]}>
              <Text style={{ fontWeight: '700' }}>Live Heartbeat Monitoring:</Text> Your active connection status is visible to the presiding lecturer during the session.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons name="checkmark-done-circle-outline" size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.ruleText, { color: isDarkMode ? '#CBD5E1' : '#78350F' }]}>
              <Text style={{ fontWeight: '700' }}>Auto-Submission:</Text> When time expires, your answers will be automatically submitted without manual intervention.
            </Text>
          </View>
        </View>

        {/* Start / Resume Action */}
        <View style={styles.bottomActionArea}>
          {isSubmitted ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.completedBannerText}>
                You have already submitted this assessment.
              </Text>
            </View>
          ) : isTimedOut ? (
            <View style={[styles.completedBanner, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="time" size={24} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.completedBannerText, { color: '#B91C1C' }]}>
                This assessment session has expired.
              </Text>
            </View>
          ) : canStart ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isOngoingAttempt ? '#F59E0B' : (theme.primary || '#6366F1'),
                  opacity: isStarting ? 0.7 : 1,
                },
              ]}
              onPress={handleStartExam}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={isOngoingAttempt ? 'play' : 'checkmark-done-outline'}
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionButtonText}>
                    {isOngoingAttempt ? 'Resume Active Examination' : 'Start Assessment Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.completedBanner, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={[styles.completedBannerText, { color: '#6B7280' }]}>
                This assessment is not currently open for participation.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleValue: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  rulesCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomActionArea: {
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
  },
  completedBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
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
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
});
