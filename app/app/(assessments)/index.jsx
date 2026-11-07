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
    fetchAvailableOfferings,
    fetchStudentEnrollments,
    enrollInOffering,
    unenrollFromOffering,
  } = useQuizStore();

  const [assessments, setAssessments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'assessments'
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Result inspection modal state (BB-07F.7)
  const [selectedResultData, setSelectedResultData] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [resultError, setResultError] = useState(null);



  // Course Enrollment modal state
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [availableOfferings, setAvailableOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollingOfferingId, setEnrollingOfferingId] = useState(null);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState(null);

  const handleOpenEnrollModal = async () => {
    setEnrollModalVisible(true);
    setLoadingOfferings(true);
    setEnrollError(null);
    setEnrollSuccessMsg(null);
    const res = await fetchAvailableOfferings();
    setLoadingOfferings(false);
    if (res.success && res.data) {
      setAvailableOfferings(res.data);
    } else {
      setEnrollError(res.error?.message || 'Failed to retrieve available course offerings.');
    }
  };

  const handleToggleEnrollment = async (offering) => {
    setEnrollingOfferingId(offering.id);
    setEnrollError(null);
    setEnrollSuccessMsg(null);

    if (offering.isEnrolled) {
      const res = await unenrollFromOffering(offering.id);
      setEnrollingOfferingId(null);
      if (res.success) {
        setEnrollSuccessMsg(`Dropped ${offering.courseCode}.`);
        setAvailableOfferings((prev) =>
          prev.map((o) => (o.id === offering.id ? { ...o, isEnrolled: false } : o))
        );
        setEnrollments((prev) => prev.filter((e) => e.offeringId !== offering.id));
        loadData();
      } else {
        setEnrollError(res.error?.message || 'Failed to drop course offering.');
      }
    } else {
      const res = await enrollInOffering(offering.id);
      setEnrollingOfferingId(null);
      if (res.success) {
        setEnrollSuccessMsg(`Enrolled in ${offering.courseCode} successfully!`);
        setAvailableOfferings((prev) =>
          prev.map((o) => (o.id === offering.id ? { ...o, isEnrolled: true } : o))
        );
        loadData();
      } else {
        setEnrollError(res.error?.message || 'Failed to enroll in course offering.');
      }
    }
  };

  const loadData = useCallback(async () => {
    setErrorMsg(null);
    const [assessmentsRes, enrollmentsRes] = await Promise.all([
      fetchAvailableAssessments(),
      fetchStudentEnrollments(),
    ]);

    if (assessmentsRes.success) {
      setAssessments(assessmentsRes.data || []);
    } else {
      setErrorMsg(assessmentsRes.error?.message || 'Failed to load assessments');
    }

    if (enrollmentsRes.success) {
      const activeEnrollments = (enrollmentsRes.data || []).filter(
        (e) => !e.enrollmentStatus || e.enrollmentStatus === 'ENROLLED'
      );
      setEnrollments(activeEnrollments);
    }

    setIsLoading(false);
    setRefreshing(false);
  }, [fetchAvailableAssessments, fetchStudentEnrollments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

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

  const handleViewAttendance = (item) => {
    router.push({
      pathname: '/(assessments)/attendance',
      params: {
        offeringId: item.offeringId,
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
      },
    });
  };

  const handleViewMaterials = (item) => {
    router.push({
      pathname: '/(assessments)/materials',
      params: {
        offeringId: item.offeringId,
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
      },
    });
  };

  const handleViewAnnouncements = (item) => {
    router.push({
      pathname: '/(assessments)/notices',
      params: {
        offeringId: item.offeringId,
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
      },
    });
  };

  const handleViewDiscussions = (item) => {
    router.push({
      pathname: '/(assessments)/discussions',
      params: {
        offeringId: item.offeringId,
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
      },
    });
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

  const renderCourseCard = ({ item }) => {
    const courseAssessments = assessments.filter((a) => a.offeringId === item.offeringId);
    const hasLiveAssessment = courseAssessments.some(
      (a) => a.operationalStatus === 'AVAILABLE_NOW' || a.studentAttemptStatus === 'IN_PROGRESS'
    );

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card || '#FFFFFF',
            borderColor: theme.border || '#E5E7EB',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>{item.courseCode || 'COURSE'}</Text>
          </View>
          <View style={[styles.courseLevelBadge, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
            <Text style={[styles.courseLevelBadgeText, { color: theme.textSecondary || '#6B7280' }]}>
              {item.level ? `${item.level}L` : 'Level'} {item.semester ? `• Sem ${item.semester}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={13} color="#059669" style={{ marginRight: 3 }} />
            <Text style={[styles.statusBadgeText, { color: '#059669' }]}>
              {item.enrollmentStatus || 'ENROLLED'}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text || '#111827' }]} numberOfLines={2}>
          {item.courseTitle}
        </Text>

        <Text style={[styles.cardSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
          {item.departmentName || 'Academic Department'} • Session {item.academicSession || 'Current'}
        </Text>

        {hasLiveAssessment && (
          <TouchableOpacity
            style={styles.liveAssessmentBanner}
            onPress={() => setActiveTab('assessments')}
            activeOpacity={0.8}
          >
            <Ionicons name="radio-button-on" size={14} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.liveAssessmentBannerText}>
              Active assessment open now — Tap to take
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#059669" />
          </TouchableOpacity>
        )}

        {/* 4 Academic Quick Actions */}
        <View style={styles.courseActionGrid}>
          <TouchableOpacity
            style={[
              styles.courseActionTile,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
                borderColor: isDarkMode ? '#334155' : '#BFDBFE',
              },
            ]}
            onPress={() =>
              handleViewAttendance({
                offeringId: item.offeringId,
                courseCode: item.courseCode,
                courseTitle: item.courseTitle,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={18} color="#2563EB" />
            <Text style={[styles.courseActionTileText, { color: '#1E40AF' }]}>Attendance</Text>
            <Text style={[styles.courseActionTileSub, { color: '#3B82F6' }]}>Check-in & stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.courseActionTile,
              {
                backgroundColor: isDarkMode ? '#064E3B22' : '#F0FDF4',
                borderColor: isDarkMode ? '#065F46' : '#BBF7D0',
              },
            ]}
            onPress={() =>
              handleViewMaterials({
                offeringId: item.offeringId,
                courseCode: item.courseCode,
                courseTitle: item.courseTitle,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="folder-open" size={18} color="#16A34A" />
            <Text style={[styles.courseActionTileText, { color: '#15803D' }]}>Materials</Text>
            <Text style={[styles.courseActionTileSub, { color: '#22C55E' }]}>Slides & notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.courseActionTile,
              {
                backgroundColor: isDarkMode ? '#78350F22' : '#FFFBEB',
                borderColor: isDarkMode ? '#92400E' : '#FDE68A',
              },
            ]}
            onPress={() =>
              handleViewAnnouncements({
                offeringId: item.offeringId,
                courseCode: item.courseCode,
                courseTitle: item.courseTitle,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="megaphone" size={18} color="#D97706" />
            <Text style={[styles.courseActionTileText, { color: '#B45309' }]}>Notices</Text>
            <Text style={[styles.courseActionTileSub, { color: '#F59E0B' }]}>Announcements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.courseActionTile,
              {
                backgroundColor: isDarkMode ? '#312E8122' : '#F5F3FF',
                borderColor: isDarkMode ? '#4C1D95' : '#DDD6FE',
              },
            ]}
            onPress={() =>
              handleViewDiscussions({
                offeringId: item.offeringId,
                courseCode: item.courseCode,
                courseTitle: item.courseTitle,
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles" size={18} color="#7C3AED" />
            <Text style={[styles.courseActionTileText, { color: '#6D28D9' }]}>Discussions</Text>
            <Text style={[styles.courseActionTileSub, { color: '#8B5CF6' }]}>Ask & engage</Text>
          </TouchableOpacity>
        </View>

        {courseAssessments.length > 0 && (
          <TouchableOpacity
            style={[
              styles.courseAssessmentsBtn,
              {
                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
              },
            ]}
            onPress={() => setActiveTab('assessments')}
          >
            <MaterialCommunityIcons
              name="format-list-checks"
              size={16}
              color={theme.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.courseAssessmentsBtnText, { color: theme.primary }]}>
              View {courseAssessments.length} Assessment{courseAssessments.length > 1 ? 's' : ''} for {item.courseCode}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
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

          <TouchableOpacity
            style={[styles.attendanceBtn, { borderColor: theme.border || '#D1D5DB' }]}
            onPress={() => handleViewAnnouncements(item)}
          >
            <Ionicons name="megaphone-outline" size={15} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={[styles.attendanceBtnText, { color: '#D97706' }]}>Notices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.attendanceBtn, { borderColor: theme.border || '#D1D5DB' }]}
            onPress={() => handleViewDiscussions(item)}
          >
            <Ionicons name="chatbubbles-outline" size={15} color="#4F46E5" style={{ marginRight: 4 }} />
            <Text style={[styles.attendanceBtnText, { color: '#4F46E5' }]}>Discussions</Text>
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
            Academic Course Hub
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            Courses, attendance, materials & exams
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerEnrollBtn, { backgroundColor: theme.primary + '18' }]}
          onPress={handleOpenEnrollModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="school-outline" size={16} color={theme.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.headerEnrollText, { color: theme.primary }]}>Enroll</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border || '#E5E7EB', backgroundColor: theme.card || '#FFFFFF' }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'courses' && [styles.tabBtnActive, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setActiveTab('courses')}
        >
          <Ionicons
            name="school-outline"
            size={16}
            color={activeTab === 'courses' ? theme.primary : (theme.textSecondary || '#6B7280')}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'courses' ? theme.primary : (theme.textSecondary || '#6B7280') },
              activeTab === 'courses' && styles.tabBtnTextActive,
            ]}
          >
            My Courses ({enrollments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'assessments' && [styles.tabBtnActive, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setActiveTab('assessments')}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === 'assessments' ? theme.primary : (theme.textSecondary || '#6B7280')}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'assessments' ? theme.primary : (theme.textSecondary || '#6B7280') },
              activeTab === 'assessments' && styles.tabBtnTextActive,
            ]}
          >
            Assessments ({assessments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading your academic portal...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Unable to load academic portal
          </Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={loadData}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'courses' ? (
        enrollments.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="school-outline" size={64} color={theme.textSecondary || '#9CA3AF'} />
            <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
              No Courses Enrolled Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
              You have not enrolled in any course offerings for the current session. Enrolling gives you direct access to attendance check-in, course materials, lecturer announcements, and exams.
            </Text>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleOpenEnrollModal}
            >
              <Ionicons name="school-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Browse & Enroll in Courses</Text>
            </TouchableOpacity>

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
            data={enrollments}
            keyExtractor={(item) => String(item.enrollmentId || item.offeringId)}
            renderItem={renderCourseCard}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
            ListFooterComponent={
              <TouchableOpacity
                style={[
                  styles.addCourseFooterBtn,
                  {
                    borderColor: theme.border || '#E5E7EB',
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  },
                ]}
                onPress={handleOpenEnrollModal}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.addCourseFooterText, { color: theme.primary }]}>
                  Browse & Enroll in More Courses
                </Text>
              </TouchableOpacity>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          />
        )
      ) : assessments.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.textSecondary || '#9CA3AF'} />
          <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
            No Assessments Available
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            There are currently no official tests, CBT exams or assignments scheduled for your enrolled courses.
          </Text>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab('courses')}
          >
            <Ionicons name="school-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionBtnText}>View My Enrolled Courses</Text>
          </TouchableOpacity>

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

      {/* Academic Features (Attendance, Materials, Notices, Discussions) are routed to dedicated screens */}

      {/* Course Enrollment Modal */}
      <Modal
        visible={enrollModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEnrollModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border || '#E5E7EB' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text || '#111827' },
                  ]}
                >
                  Course Enrollment
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.textSecondary || '#6B7280' },
                  ]}
                >
                  Select and enroll in your academic course offerings
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEnrollModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.textSecondary || '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Notifications / Errors */}
            {enrollError ? (
              <View style={styles.enrollErrorBox}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.enrollErrorText}>{enrollError}</Text>
              </View>
            ) : null}

            {enrollSuccessMsg ? (
              <View style={styles.enrollSuccessBox}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.enrollSuccessText}>{enrollSuccessMsg}</Text>
              </View>
            ) : null}

            {/* Modal Body */}
            {loadingOfferings ? (
              <View style={[styles.centered, { paddingVertical: 48 }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280', marginTop: 12 }]}>
                  Loading academic offerings...
                </Text>
              </View>
            ) : availableOfferings.length === 0 ? (
              <View style={[styles.centered, { paddingVertical: 48 }]}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={54} color={theme.textSecondary || '#9CA3AF'} />
                <Text style={[styles.emptyTitle, { color: theme.text || '#111827', marginTop: 12 }]}>
                  No Offerings Available
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                  There are currently no active course offerings available for enrollment.
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableOfferings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.enrollmentCard,
                      {
                        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                        borderColor: item.isEnrolled ? (theme.primary + '50') : (theme.border || '#E5E7EB'),
                      },
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={[styles.enrollCardCode, { color: theme.text || '#111827' }]}>
                          {item.courseCode}
                        </Text>
                        {item.isEnrolled ? (
                          <View style={styles.enrolledBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#059669" />
                            <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.enrollCardTitle, { color: theme.textSecondary || '#4B5563' }]} numberOfLines={2}>
                        {item.courseTitle}
                      </Text>
                      <Text style={[styles.enrollCardMeta, { color: theme.textSecondary || '#9CA3AF' }]}>
                        Level {item.level} • {item.semester} Sem • {item.academicSession}
                      </Text>
                      {item.departmentName ? (
                        <Text style={[styles.enrollCardDept, { color: theme.primary }]}>
                          {item.departmentName}
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.enrollActionBtn,
                        item.isEnrolled
                          ? { backgroundColor: 'transparent', borderColor: '#EF4444', borderWidth: 1 }
                          : { backgroundColor: theme.primary },
                      ]}
                      disabled={enrollingOfferingId === item.id}
                      onPress={() => handleToggleEnrollment(item)}
                    >
                      {enrollingOfferingId === item.id ? (
                        <ActivityIndicator size="small" color={item.isEnrolled ? '#EF4444' : '#FFFFFF'} />
                      ) : (
                        <Text
                          style={[
                            styles.enrollActionBtnText,
                            item.isEnrolled ? { color: '#EF4444' } : { color: '#FFFFFF' },
                          ]}
                        >
                          {item.isEnrolled ? 'Drop' : 'Enroll'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
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
  modalLoadingBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorBox: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  announcementCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  announcementDate: {
    fontSize: 10,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  announcementAuthor: {
    fontSize: 11,
    marginBottom: 6,
  },
  announcementContent: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  attachmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 240,
  },
  discussionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  threadAuthorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  replyCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  replyAuthorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  replyContent: {
    fontSize: 12,
    lineHeight: 17,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    margin: 12,
  },
  lockedBannerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  composerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  composerSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTopicTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  newTopicTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createTopicBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  createTopicHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  createTopicBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pinnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinnedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lockedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  replyCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  replyCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  discussionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  discussionSnippet: {
    fontSize: 11,
    lineHeight: 16,
  },
  headerEnrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerEnrollText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 18,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  enrollErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  enrollErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  enrollSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  enrollSuccessText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  enrollmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  enrollCardCode: {
    fontSize: 15,
    fontWeight: '800',
  },
  enrollCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  enrollCardMeta: {
    fontSize: 11,
    marginBottom: 2,
  },
  enrollCardDept: {
    fontSize: 11,
    fontWeight: '600',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  enrolledBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  enrollActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
  },
  courseLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  courseLevelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveAssessmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  liveAssessmentBannerText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  courseActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  courseActionTile: {
    flex: 1,
    minWidth: '46%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  courseActionTileText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  courseActionTileSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  courseAssessmentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  courseAssessmentsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  addCourseFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 20,
  },
  addCourseFooterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  markAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markAttendanceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

