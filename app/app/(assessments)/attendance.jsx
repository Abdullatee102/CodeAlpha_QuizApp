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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function CourseAttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { offeringId, courseCode, courseTitle } = params;

  const { theme, isDarkMode } = useThemeStore();
  const { fetchStudentAttendance, markSelfAttendance } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [markingSessionId, setMarkingSessionId] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  const loadAttendance = useCallback(async (isRefresh = false) => {
    if (!offeringId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    const res = await fetchStudentAttendance(offeringId);
    if (res.success && res.data) {
      setAttendanceData(res.data);
    } else {
      setErrorMsg(res.error?.message || 'Failed to retrieve attendance records.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [offeringId, fetchStudentAttendance]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleSelfMarkAttendance = async (sessionId) => {
    setMarkingSessionId(sessionId);
    setSuccessBanner(null);
    setErrorMsg(null);

    const res = await markSelfAttendance(offeringId, sessionId);
    setMarkingSessionId(null);

    if (res.success) {
      setSuccessBanner(res.message || 'Marked present successfully!');
      // Reload attendance records
      const refreshed = await fetchStudentAttendance(offeringId);
      if (refreshed.success && refreshed.data) {
        setAttendanceData(refreshed.data);
      }
    } else {
      setErrorMsg(res.error?.message || 'Failed to mark attendance.');
    }
  };

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

  const summary = attendanceData?.summary;
  const history = attendanceData?.history || [];

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
                {courseCode || attendanceData?.offering?.courseCode || 'COURSE'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
              Attendance Record
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
            {courseTitle || attendanceData?.offering?.courseTitle || 'Course Attendance'}
          </Text>
        </View>
      </View>

      {/* Main Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading attendance records...
          </Text>
        </View>
      ) : errorMsg && !attendanceData ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Unable to Load Attendance
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => loadAttendance(false)}
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
              onRefresh={() => loadAttendance(true)}
              tintColor={theme.primary}
            />
          }
        >
          {successBanner && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{successBanner}</Text>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* Main Attendance Rate Card */}
          <View
            style={[
              styles.rateCard,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: theme.border || '#E5E7EB',
              },
            ]}
          >
            <Text style={styles.rateCardLabel}>YOUR ATTENDANCE RATE</Text>
            <Text
              style={[
                styles.rateCardBigNumber,
                {
                  color:
                    (summary?.attendancePercentage ?? 0) >= 75
                      ? '#059669'
                      : (summary?.attendancePercentage ?? 0) >= 60
                      ? '#D97706'
                      : '#DC2626',
                },
              ]}
            >
              {summary?.attendancePercentage ?? 0}%
            </Text>
            <Text style={[styles.rateCardSub, { color: theme.textSecondary || '#6B7280' }]}>
              {summary?.attendedCount ?? 0} of {summary?.totalSessions ?? 0} sessions attended
            </Text>

            {/* Visual Breakdown Cards */}
            <View style={styles.breakdownRow}>
              <View
                style={[
                  styles.breakdownCol,
                  { backgroundColor: isDarkMode ? '#143828' : '#ECFDF5' },
                ]}
              >
                <Text style={[styles.breakdownLabel, { color: '#059669' }]}>Present</Text>
                <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                  {summary?.presentCount ?? 0}
                </Text>
              </View>

              <View
                style={[
                  styles.breakdownCol,
                  { backgroundColor: isDarkMode ? '#3B2914' : '#FFFBEB' },
                ]}
              >
                <Text style={[styles.breakdownLabel, { color: '#D97706' }]}>Late</Text>
                <Text style={[styles.breakdownVal, { color: '#D97706' }]}>
                  {summary?.lateCount ?? 0}
                </Text>
              </View>

              <View
                style={[
                  styles.breakdownCol,
                  { backgroundColor: isDarkMode ? '#3B1818' : '#FEF2F2' },
                ]}
              >
                <Text style={[styles.breakdownLabel, { color: '#DC2626' }]}>Absent</Text>
                <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                  {summary?.absentCount ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Section Heading */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text || '#111827' }]}>
              Class Session History ({history.length})
            </Text>
          </View>

          {/* Sessions List */}
          {history.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.border || '#E5E7EB',
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={44} color={theme.textSecondary || '#9CA3AF'} />
              <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
                No Attendance Sessions Recorded
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                Your lecturer has not opened or published attendance records for this course offering yet.
              </Text>
            </View>
          ) : (
            history.map((session, idx) => {
              const isPresent = session.status === 'PRESENT';
              const isLate = session.status === 'LATE';
              const isExcused = session.status === 'EXCUSED';

              const statusColor = isPresent
                ? '#059669'
                : isLate
                ? '#D97706'
                : isExcused
                ? '#7C3AED'
                : '#DC2626';

              const statusBg = isPresent
                ? isDarkMode ? '#064E3B' : '#D1FAE5'
                : isLate
                ? isDarkMode ? '#78350F' : '#FEF3C7'
                : isExcused
                ? isDarkMode ? '#4C1D95' : '#EDE9FE'
                : isDarkMode ? '#7F1D1D' : '#FEE2E2';

              const isOpenForSelfCheckIn = session.sessionStatus === 'OPEN' && !isPresent;

              return (
                <View
                  key={session.sessionId || idx}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: isOpenForSelfCheckIn ? '#059669' : (theme.border || '#E5E7EB'),
                      borderWidth: isOpenForSelfCheckIn ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.sessionCardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.sessionTitle, { color: theme.text || '#111827' }]}>
                        {session.title || 'Lecture Session'}
                      </Text>
                      <Text style={[styles.sessionDate, { color: theme.textSecondary || '#6B7280' }]}>
                        {formatSchedule(session.sessionDate)} • {session.sessionType || 'LECTURE'}
                      </Text>
                    </View>

                    <View style={[styles.sessionBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.sessionBadgeText, { color: statusColor }]}>
                        {session.status || 'UNRECORDED'}
                      </Text>
                    </View>
                  </View>

                  {session.remarks ? (
                    <Text style={[styles.sessionRemarks, { color: theme.textSecondary || '#9CA3AF' }]}>
                      Note: {session.remarks}
                    </Text>
                  ) : null}

                  {/* Active Self Check-in Callout */}
                  {isOpenForSelfCheckIn && (
                    <View style={styles.checkInRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.checkInHelpText}>
                          Lecturer has opened live roll-call for this session!
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.markAttendanceBtn}
                        disabled={markingSessionId === session.sessionId}
                        onPress={() => handleSelfMarkAttendance(session.sessionId)}
                        activeOpacity={0.8}
                      >
                        {markingSessionId === session.sessionId ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#FFFFFF"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.markAttendanceBtnText}>Mark Present</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
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
    gap: 8,
    marginBottom: 2,
  },
  courseBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  rateCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  rateCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  rateCardBigNumber: {
    fontSize: 44,
    fontWeight: '900',
    marginVertical: 4,
  },
  rateCardSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  breakdownCol: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyBox: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  sessionCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sessionDate: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  sessionRemarks: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  checkInRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkInHelpText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  markAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  markAttendanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
