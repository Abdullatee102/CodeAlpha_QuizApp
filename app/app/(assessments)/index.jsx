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
  Modal,
  ScrollView,
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
  const {
    fetchAvailableAssessments,
    fetchAssessmentResults,
    fetchStudentAttendance,
    fetchCourseMaterials,
    downloadCourseMaterial,
  } = useQuizStore();

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Result inspection modal state (BB-07F.7)
  const [selectedResultData, setSelectedResultData] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [resultError, setResultError] = useState(null);

  // Attendance inspection modal state (BB-07G)
  const [selectedAttendanceData, setSelectedAttendanceData] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  // Course Materials inspection modal state (BB-07H)
  const [selectedMaterialsData, setSelectedMaterialsData] = useState(null);
  const [materialsModalVisible, setMaterialsModalVisible] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState(null);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState(null);

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

  const handleViewResults = async (item) => {
    setSelectedResultData({ assessment: item, result: null, isPending: true });
    setResultModalVisible(true);
    setLoadingResult(true);
    setResultError(null);

    const res = await fetchAssessmentResults(item.id);
    setLoadingResult(false);
    if (res.success && res.data) {
      setSelectedResultData({
        assessment: item,
        result: res.data.result || null,
        status: res.data.status,
        message: res.data.message,
        publicationStatus: res.data.publicationStatus,
        isPending: res.data.status === 'PENDING_PUBLICATION',
      });
    } else {
      setResultError(res.error?.message || 'Failed to retrieve assessment results.');
    }
  };

  const handleViewAttendance = async (item) => {
    setSelectedAttendanceData({
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      offeringId: item.offeringId,
      summary: null,
      history: [],
    });
    setAttendanceModalVisible(true);
    setLoadingAttendance(true);
    setAttendanceError(null);

    const res = await fetchStudentAttendance(item.offeringId);
    setLoadingAttendance(false);
    if (res.success && res.data) {
      setSelectedAttendanceData((prev) => ({
        ...prev,
        offering: res.data.offering,
        summary: res.data.summary,
        history: res.data.history || [],
      }));
    } else {
      setAttendanceError(res.error?.message || 'Failed to retrieve attendance records.');
    }
  };

  const handleViewMaterials = async (item) => {
    setSelectedMaterialsData({
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      offeringId: item.offeringId,
      materials: [],
    });
    setMaterialsModalVisible(true);
    setLoadingMaterials(true);
    setMaterialsError(null);

    const res = await fetchCourseMaterials(item.offeringId);
    setLoadingMaterials(false);
    if (res.success && res.data) {
      setSelectedMaterialsData((prev) => ({
        ...prev,
        materials: res.data.materials || [],
      }));
    } else {
      setMaterialsError(res.error?.message || 'Failed to retrieve course learning materials.');
    }
  };

  const handleDownloadMaterial = async (offeringId, material) => {
    setDownloadingMaterialId(material.id);
    const res = await downloadCourseMaterial(offeringId, material.id);
    setDownloadingMaterialId(null);
    if (!res.success) {
      alert(res.error?.message || 'Failed to download course material.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (item) => {
    const status = item.operationalStatus || item.status;
    const studentStatus = item.studentAttemptStatus;
    const pubStatus = item.resultsPublicationStatus;

    if (studentStatus === 'SUBMITTED' || studentStatus === 'TIMED_OUT') {
      if (pubStatus === 'PUBLISHED') {
        return { label: 'Results Published', color: '#059669', bg: '#D1FAE5', icon: 'ribbon-outline' };
      }
      return {
        label: 'Awaiting Publication',
        color: '#7C3AED',
        bg: '#EDE9FE',
        icon: 'hourglass-outline',
      };
    }

    if (studentStatus === 'IN_PROGRESS') {
      return { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', icon: 'play-circle' };
    }

    if (status === 'AVAILABLE_NOW' || status === 'AVAILABLE' || status === 'OPEN') {
      return { label: 'Available Now', color: '#10B981', bg: '#D1FAE5', icon: 'radio-button-on' };
    }
    if (status === 'SCHEDULED' || status === 'UPCOMING') {
      return { label: 'Upcoming', color: '#3B82F6', bg: '#DBEAFE', icon: 'calendar' };
    }
    if (status === 'ENDED' || status === 'EXPIRED' || status === 'CLOSED') {
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
          <TouchableOpacity
            style={[styles.attendanceBtn, { borderColor: theme.border || '#D1D5DB' }]}
            onPress={() => handleViewAttendance(item)}
          >
            <Ionicons name="calendar-outline" size={15} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.attendanceBtnText, { color: theme.primary }]}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attendanceBtn, { borderColor: theme.border || '#D1D5DB' }]}
            onPress={() => handleViewMaterials(item)}
          >
            <Ionicons name="folder-open-outline" size={15} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={[styles.attendanceBtnText, { color: '#0284C7' }]}>Materials</Text>
          </TouchableOpacity>

          {item.studentAttemptStatus === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => handleAssessmentPress(item)}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Resume Exam</Text>
            </TouchableOpacity>
          ) : item.studentAttemptStatus === 'SUBMITTED' || item.studentAttemptStatus === 'TIMED_OUT' ? (
            item.resultsPublicationStatus === 'PUBLISHED' ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                onPress={() => handleViewResults(item)}
              >
                <Ionicons name="ribbon-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>View Published Results</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#374151' : '#EDE9FE' }]}
                onPress={() => handleViewResults(item)}
              >
                <Ionicons name="hourglass-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Awaiting Publication</Text>
              </TouchableOpacity>
            )
          ) : canAttempt ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
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
          <ActivityIndicator size="large" color={theme.primary} />
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
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
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
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}

      {/* Result Inspection Modal (BB-07F.7) */}
      <Modal
        visible={resultModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border || '#E5E7EB' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalCourseCode, { color: theme.primary }]}>
                  {selectedResultData?.assessment?.courseCode || 'COURSE'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
                  {selectedResultData?.assessment?.title || 'Assessment Result'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setResultModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary || '#6B7280'} />
              </TouchableOpacity>
            </View>

            {loadingResult ? (
              <View style={styles.modalBodyCentered}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.modalLoadingText, { color: theme.textSecondary || '#6B7280' }]}>
                  Retrieving evaluation status...
                </Text>
              </View>
            ) : resultError ? (
              <View style={styles.modalBodyCentered}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#EF4444" />
                <Text style={[styles.modalErrorTitle, { color: theme.text || '#111827' }]}>
                  Unable to Load Results
                </Text>
                <Text style={[styles.modalErrorText, { color: theme.textSecondary || '#6B7280' }]}>
                  {resultError}
                </Text>
              </View>
            ) : selectedResultData?.isPending || !selectedResultData?.result ? (
              <View style={styles.modalBodyCentered}>
                <View style={styles.pendingIconBox}>
                  <Ionicons name="hourglass-outline" size={40} color="#7C3AED" />
                </View>
                <Text style={[styles.pendingTitle, { color: theme.text || '#111827' }]}>
                  Results Awaiting Publication
                </Text>
                <Text style={[styles.pendingText, { color: theme.textSecondary || '#6B7280' }]}>
                  {selectedResultData?.message ||
                    'Your assessment submission is safely recorded. Grades are undergoing formal moderation and will be published once officially approved by the academic department.'}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Score Showcase */}
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreCardLabel}>OFFICIAL GRADE</Text>
                  <Text style={styles.scoreCardBigNumber}>
                    {selectedResultData.result.totalScore}
                    <Text style={styles.scoreCardDenominator}>
                      {' '}/ {selectedResultData.result.maxPossibleScore}
                    </Text>
                  </Text>
                  <View style={styles.percentageBadge}>
                    <Text style={styles.percentageText}>
                      {selectedResultData.result.percentage}%
                    </Text>
                  </View>

                  <View style={styles.passFailRow}>
                    {selectedResultData.result.isPassing === true ? (
                      <View style={[styles.statusPill, { backgroundColor: '#D1FAE5' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={[styles.statusPillText, { color: '#059669' }]}>PASSING</Text>
                      </View>
                    ) : selectedResultData.result.isPassing === false ? (
                      <View style={[styles.statusPill, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                        <Text style={[styles.statusPillText, { color: '#DC2626' }]}>NOT PASSING</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Score Breakdown (CBT vs Theory) */}
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownCol, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                    <Text style={[styles.breakdownLabel, { color: theme.textSecondary || '#6B7280' }]}>CBT Score</Text>
                    <Text style={[styles.breakdownVal, { color: theme.text || '#111827' }]}>
                      {selectedResultData.result.cbtScore}
                    </Text>
                  </View>
                  <View style={[styles.breakdownCol, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                    <Text style={[styles.breakdownLabel, { color: theme.textSecondary || '#6B7280' }]}>Theory Score</Text>
                    <Text style={[styles.breakdownVal, { color: theme.text || '#111827' }]}>
                      {selectedResultData.result.theoryScore}
                    </Text>
                  </View>
                </View>

                {/* General Feedback / Moderation Note if present */}
                {selectedResultData.result.generalFeedback ? (
                  <View style={[styles.feedbackBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }]}>
                    <Text style={[styles.feedbackLabel, { color: theme.textSecondary || '#6B7280' }]}>
                      Examiner Feedback:
                    </Text>
                    <Text style={[styles.feedbackText, { color: theme.text || '#111827' }]}>
                      {selectedResultData.result.generalFeedback}
                    </Text>
                  </View>
                ) : null}

                {/* Published Timestamp */}
                {selectedResultData.result.publishedAt ? (
                  <Text style={[styles.publishedAtText, { color: theme.textSecondary || '#9CA3AF' }]}>
                    Officially published: {formatSchedule(selectedResultData.result.publishedAt)}
                  </Text>
                ) : null}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border || '#E5E7EB' }]}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => setResultModalVisible(false)}
              >
                <Text style={styles.modalActionBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Student Attendance Modal (BB-07G) */}
      <Modal
        visible={attendanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttendanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border || '#E5E7EB' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalCourseCode, { color: theme.primary }]}>
                  {selectedAttendanceData?.courseCode || 'COURSE'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
                  Course Attendance Record
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAttendanceModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary || '#6B7280'} />
              </TouchableOpacity>
            </View>

            {loadingAttendance ? (
              <View style={styles.modalBodyCentered}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.modalLoadingText, { color: theme.textSecondary || '#6B7280' }]}>
                  Loading attendance records...
                </Text>
              </View>
            ) : attendanceError ? (
              <View style={styles.modalBodyCentered}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#EF4444" />
                <Text style={[styles.modalErrorTitle, { color: theme.text || '#111827' }]}>
                  Unable to Load Attendance
                </Text>
                <Text style={[styles.modalErrorText, { color: theme.textSecondary || '#6B7280' }]}>
                  {attendanceError}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Attendance Summary Showcase */}
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreCardLabel}>YOUR ATTENDANCE RATE</Text>
                  <Text style={styles.scoreCardBigNumber}>
                    {selectedAttendanceData?.summary?.attendancePercentage ?? 0}%
                  </Text>
                  <Text style={[styles.scoreCardDenominator, { marginTop: 4 }]}>
                    {selectedAttendanceData?.summary?.attendedCount ?? 0} of {selectedAttendanceData?.summary?.totalSessions ?? 0} sessions attended
                  </Text>
                </View>

                {/* Counters Breakdown */}
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownCol, { backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }]}>
                    <Text style={[styles.breakdownLabel, { color: '#059669' }]}>Present</Text>
                    <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                      {selectedAttendanceData?.summary?.presentCount ?? 0}
                    </Text>
                  </View>
                  <View style={[styles.breakdownCol, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFBEB' }]}>
                    <Text style={[styles.breakdownLabel, { color: '#D97706' }]}>Late</Text>
                    <Text style={[styles.breakdownVal, { color: '#D97706' }]}>
                      {selectedAttendanceData?.summary?.lateCount ?? 0}
                    </Text>
                  </View>
                  <View style={[styles.breakdownCol, { backgroundColor: isDarkMode ? '#1F2937' : '#FEF2F2' }]}>
                    <Text style={[styles.breakdownLabel, { color: '#DC2626' }]}>Absent</Text>
                    <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                      {selectedAttendanceData?.summary?.absentCount ?? 0}
                    </Text>
                  </View>
                </View>

                {/* Session Timeline */}
                <Text style={[styles.sectionHeading, { color: theme.text || '#111827' }]}>
                  Class Session History ({selectedAttendanceData?.history?.length ?? 0})
                </Text>

                {(!selectedAttendanceData?.history || selectedAttendanceData.history.length === 0) ? (
                  <View style={styles.emptySessionBox}>
                    <Ionicons name="calendar-outline" size={32} color={theme.textSecondary || '#9CA3AF'} />
                    <Text style={[styles.emptySessionText, { color: theme.textSecondary || '#6B7280' }]}>
                      No class attendance sessions recorded yet for this course.
                    </Text>
                  </View>
                ) : (
                  selectedAttendanceData.history.map((session, idx) => {
                    const statusColor =
                      session.status === 'PRESENT'
                        ? '#059669'
                        : session.status === 'LATE'
                        ? '#D97706'
                        : session.status === 'EXCUSED'
                        ? '#7C3AED'
                        : '#DC2626';
                    const statusBg =
                      session.status === 'PRESENT'
                        ? '#D1FAE5'
                        : session.status === 'LATE'
                        ? '#FEF3C7'
                        : session.status === 'EXCUSED'
                        ? '#EDE9FE'
                        : '#FEE2E2';

                    return (
                      <View
                        key={session.sessionId || idx}
                        style={[
                          styles.sessionCard,
                          {
                            backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                            borderColor: theme.border || '#E5E7EB',
                          },
                        ]}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.sessionTitle, { color: theme.text || '#111827' }]}>
                            {session.title}
                          </Text>
                          <Text style={[styles.sessionDate, { color: theme.textSecondary || '#6B7280' }]}>
                            {formatSchedule(session.sessionDate)} • {session.sessionType || 'LECTURE'}
                          </Text>
                          {session.remarks ? (
                            <Text style={[styles.sessionRemarks, { color: theme.textSecondary || '#9CA3AF' }]}>
                              Note: {session.remarks}
                            </Text>
                          ) : null}
                        </View>
                        <View style={[styles.sessionBadge, { backgroundColor: statusBg }]}>
                          <Text style={[styles.sessionBadgeText, { color: statusColor }]}>
                            {session.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border || '#E5E7EB' }]}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => setAttendanceModalVisible(false)}
              >
                <Text style={styles.modalActionBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Course Materials Modal (BB-07H) */}
      <Modal
        visible={materialsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMaterialsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border || '#E5E7EB' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalCourseCode, { color: theme.primary }]}>
                  {selectedMaterialsData?.courseCode || 'COURSE'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
                  Learning Materials & Resources
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMaterialsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary || '#6B7280'} />
              </TouchableOpacity>
            </View>

            {loadingMaterials ? (
              <View style={styles.modalBodyCentered}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.modalLoadingText, { color: theme.textSecondary || '#6B7280' }]}>
                  Loading course materials...
                </Text>
              </View>
            ) : materialsError ? (
              <View style={styles.modalBodyCentered}>
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#EF4444" />
                <Text style={[styles.modalErrorTitle, { color: theme.text || '#111827' }]}>
                  Unable to Load Materials
                </Text>
                <Text style={[styles.modalErrorText, { color: theme.textSecondary || '#6B7280' }]}>
                  {materialsError}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionHeading, { color: theme.text || '#111827' }]}>
                  Available Course Files ({selectedMaterialsData?.materials?.length ?? 0})
                </Text>

                {(!selectedMaterialsData?.materials || selectedMaterialsData.materials.length === 0) ? (
                  <View style={styles.emptySessionBox}>
                    <MaterialCommunityIcons name="folder-open-outline" size={36} color={theme.textSecondary || '#9CA3AF'} />
                    <Text style={[styles.emptySessionText, { color: theme.textSecondary || '#6B7280' }]}>
                      No learning materials published for this course yet. Check back soon!
                    </Text>
                  </View>
                ) : (
                  selectedMaterialsData.materials.map((mat) => {
                    const isDownloading = downloadingMaterialId === mat.id;
                    const ext = (mat.originalFilename || '').split('.').pop()?.toLowerCase();
                    const iconName =
                      ext === 'pdf'
                        ? 'file-pdf-box'
                        : ext === 'doc' || ext === 'docx'
                        ? 'file-word-box'
                        : ext === 'ppt' || ext === 'pptx'
                        ? 'file-powerpoint-box'
                        : ext === 'zip'
                        ? 'folder-zip'
                        : 'file-document';

                    const iconColor =
                      ext === 'pdf'
                        ? '#DC2626'
                        : ext === 'doc' || ext === 'docx'
                        ? '#2563EB'
                        : ext === 'ppt' || ext === 'pptx'
                        ? '#D97706'
                        : ext === 'zip'
                        ? '#7C3AED'
                        : '#059669';

                    return (
                      <View
                        key={mat.id}
                        style={[
                          styles.materialCard,
                          {
                            backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                            borderColor: theme.border || '#E5E7EB',
                          },
                        ]}
                      >
                        <View style={styles.materialLeft}>
                          <MaterialCommunityIcons name={iconName} size={32} color={iconColor} />
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={[styles.materialTitle, { color: theme.text || '#111827' }]} numberOfLines={2}>
                            {mat.title}
                          </Text>
                          {mat.description ? (
                            <Text style={[styles.materialDescription, { color: theme.textSecondary || '#6B7280' }]} numberOfLines={2}>
                              {mat.description}
                            </Text>
                          ) : null}
                          <View style={styles.materialMetaRow}>
                            <View style={[styles.materialCategoryPill, { backgroundColor: isDarkMode ? '#374151' : '#E0F2FE' }]}>
                              <Text style={[styles.materialCategoryText, { color: '#0284C7' }]}>
                                {mat.category || 'OTHER'}
                              </Text>
                            </View>
                            <Text style={[styles.materialMetaText, { color: theme.textSecondary || '#9CA3AF' }]}>
                              {formatFileSize(mat.fileSizeBytes)} • {mat.downloadCount || 0} downloads
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.materialDownloadBtn, { backgroundColor: theme.primary }]}
                          disabled={isDownloading}
                          onPress={() => handleDownloadMaterial(selectedMaterialsData.offeringId, mat)}
                        >
                          {isDownloading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border || '#E5E7EB' }]}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => setMaterialsModalVisible(false)}
              >
                <Text style={styles.modalActionBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(0, 93, 75, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005D4B',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCourseCode: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    marginLeft: 12,
  },
  modalBodyCentered: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  modalErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  modalErrorText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  pendingIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalScrollBody: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#4338CA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 1,
    marginBottom: 6,
  },
  scoreCardBigNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreCardDenominator: {
    fontSize: 18,
    fontWeight: '500',
    color: '#A5B4FC',
  },
  percentageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  percentageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  passFailRow: {
    marginTop: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  breakdownCol: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  breakdownVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  publishedAtText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  attendanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
  },
  emptySessionBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySessionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 11,
  },
  sessionRemarks: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  materialLeft: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  materialDescription: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 15,
  },
  materialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  materialCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  materialCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  materialMetaText: {
    fontSize: 11,
  },
  materialDownloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

