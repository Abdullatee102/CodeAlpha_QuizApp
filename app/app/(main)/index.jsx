import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationsQuery } from '../../hooks/useNotificationsQuery';
import { useProfileQuery } from '../../hooks/useProfileQuery';
import { useRecommendedCoursesQuery } from '../../hooks/useRecommendedCoursesQuery';
import { Colors } from '../../constants/colors';
import {
  getFacultyMeta,
  getCourseIcon,
} from '../../constants/academicIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  // =====================================================
  // AUTH / SESSION STATE
  // =====================================================

  const { user } = useAuthStore();

  // =====================================================
  // PROFILE
  // =====================================================

  const {
    data: profile,
    isLoading: isProfileLoading,
  } = useProfileQuery();

  // =====================================================
  // QUIZ STORE
  // =====================================================

  const {
    abandonQuiz,
    faculties,
    isLoadingFaculties,
    fetchFaculties,
  } = useQuizStore();

  // =====================================================
  // THEME
  // =====================================================

  const { theme, isDarkMode } = useThemeStore();

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const { data: notifications = [] } = useNotificationsQuery(50);

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification?.isRead
  ).length;

  // =====================================================
  // FETCH FACULTIES
  // =====================================================

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  // =====================================================
  // RECOMMENDED COURSES & PERSONALIZED ACADEMIC AREA
  // =====================================================

  const [selectedSemester, setSelectedSemester] = useState('harmattan');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const {
    data: recResponse,
    isLoading: isLoadingRecs,
  } = useRecommendedCoursesQuery(selectedSemester);

  const handleRecommendedCoursePress = (course) => {
    abandonQuiz();
    setSelectedCourse(course);
    setShowAssessmentModal(true);
  };

  const closeAssessmentModal = () => {
    setShowAssessmentModal(false);
    setSelectedCourse(null);
  };

  const startAssessment = (quizType) => {
    if (!selectedCourse) return;

    const course = selectedCourse;

    setShowAssessmentModal(false);
    setSelectedCourse(null);

    router.push({
      pathname: '/(main)/quiz',
      params: {
        courseId: course.id,
        courseTitle: course.title,
        courseCode: course.code,
        quizType,

        departmentId:
          recResponse?.department?.id ||
          (typeof profile?.department === 'object'
            ? profile?.department?.id
            : profile?.departmentId),

        departmentName:
          recResponse?.department?.name ||
          (typeof profile?.department === 'object'
            ? profile?.department?.name
            : profile?.departmentName),

        departmentCode:
          recResponse?.department?.code ||
          (typeof profile?.department === 'object'
            ? profile?.department?.code
            : profile?.departmentCode),

        facultyId:
          recResponse?.faculty?.id ||
          (typeof profile?.faculty === 'object'
            ? profile?.faculty?.id
            : profile?.facultyId),

        facultyName:
          recResponse?.faculty?.name ||
          (typeof profile?.faculty === 'object'
            ? profile?.faculty?.name
            : profile?.facultyName),

        facultyCode:
          recResponse?.faculty?.code ||
          (typeof profile?.faculty === 'object'
            ? profile?.faculty?.code
            : profile?.facultyCode),

        level: recResponse?.level || profile?.level,
        semester: course.semester || selectedSemester || 'harmattan',
      },
    });
  };

  // =====================================================
  // PROFILE STATISTICS
  // =====================================================

  const totalQuizzes =
    profile?.quizzesCompleted ??
    profile?.totalQuizzesTaken ??
    0;

  const totalScore = profile?.totalScore ?? 0;

  const correctAnswers =
    profile?.totalCorrect ??
    profile?.totalCorrectAnswers ??
    profile?.correctAnswers ??
    profile?.correct ??
    0;

  // =====================================================
  // PROFILE IDENTITY
  // =====================================================

  const rawInitialName =
    profile?.fullName ||
    user?.displayName ||
    user?.fullName ||
    profile?.username ||
    user?.username ||
    'Scholar';

  const cleanInitialName =
    rawInitialName === 'Verified User' ||
    rawInitialName === 'Verified'
      ? profile?.username ||
        user?.username ||
        'Scholar'
      : rawInitialName;

  const userInitial = cleanInitialName
    .split(' ')[0]
    .charAt(0)
    .toUpperCase();

  const profileImage = profile?.photoURL || user?.photoURL;

  // =====================================================
  // FACULTY PRESS
  // =====================================================

  const handleFacultyPress = (faculty) => {
    abandonQuiz();

    if (faculty.code === 'MIXED' || faculty.id === 'mixed') {
      router.push({
        pathname: '/(questions)/levels',
        params: {
          isMixed: 'true',
          facultyId: 'mixed',
          facultyName: 'All Faculties Practice',
          facultyCode: 'MIXED',
          departmentName: 'All Faculties Practice',
          departmentCode: 'MIXED',
        },
      });

      return;
    }

    router.push({
      pathname: '/(questions)/departments',
      params: {
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyCode: faculty.code,
      },
    });
  };

  // =====================================================
  // FACULTIES + MIXED PRACTICE
  // =====================================================

  const allFacultiesWithMixed = useMemo(() => {
    const list = Array.isArray(faculties) ? [...faculties] : [];

    const hasMixed = list.some(
      (faculty) =>
        faculty.id === 'mixed' ||
        faculty.code === 'MIXED'
    );

    if (!hasMixed) {
      list.push({
        id: 'mixed',
        name: 'All Faculties Practice',
        code: 'MIXED',
        description:
          'Randomized questions across all LAUTECH faculties',
      });
    }

    return list;
  }, [faculties]);

  // =====================================================
  // FACULTY ITEM
  // =====================================================

  const renderFaculty = ({ item }) => {
    const meta = getFacultyMeta(item);

    return (
      <TouchableOpacity
        style={[
          styles.facultyCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleFacultyPress(item)}
        activeOpacity={0.7}
      >
        {/* Faculty icon + arrow */}
        <View style={styles.facultyTopRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: `${meta.color}18`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={meta.icon}
              size={26}
              color={meta.color}
            />
          </View>

          <View
            style={[
              styles.facultyArrow,
              {
                backgroundColor: `${meta.color}15`,
              },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={13}
              color={meta.color}
            />
          </View>
        </View>

        {/* Faculty name */}
        <Text
          style={[
            styles.facultyTitle,
            {
              color: theme.text,
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {/* Faculty code */}
        <Text
          style={[
            styles.facultyCode,
            {
              color: meta.color,
            },
          ]}
        >
          {item.code}
        </Text>
      </TouchableOpacity>
    );
  };

  // =====================================================
  // PROFILE LOADING
  // =====================================================

  if (isProfileLoading && !profile) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />
      </View>
    );
  }

  // =====================================================
  // HOME
  // =====================================================

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: topInset,
        },
      ]}
      edges={['left', 'right']}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text
            style={[
              styles.welcomeText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Hello,
          </Text>

          <Text
            style={[
              styles.userName,
              {
                color: theme.primary,
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {(() => {
              const rawName =
                profile?.fullName ||
                user?.displayName ||
                user?.fullName ||
                profile?.username ||
                user?.username ||
                'Scholar';

              const cleanName =
                rawName === 'Verified User' ||
                rawName === 'Verified'
                  ? profile?.username ||
                    user?.username ||
                    'Scholar'
                  : rawName;

              return cleanName.split(' ')[0];
            })()}
          </Text>
        </View>

        {/* Header actions */}
        <View style={styles.headerActions}>
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[
              styles.notificationButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.primary}
            />

            {unreadNotificationCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {
                    backgroundColor: Colors.error,
                    borderColor: theme.card,
                  },
                ]}
              >
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 99
                    ? '99+'
                    : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/')}
            style={styles.avatarWrapper}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage,
                }}
                style={[
                  styles.avatar,
                  {
                    borderColor: theme.background,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.initialAvatar,
                  {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.initialText,
                    {
                      color: theme.primary,
                    },
                  ]}
                >
                  {userInitial}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >

        {/* How to Play */}

        <View
          style={[
            styles.instructionCard,
            {
              backgroundColor: isDarkMode
                ? theme.card
                : '#F0F7FF',
              borderColor: isDarkMode
                ? theme.border
                : '#DCEBFA',
            },
          ]}
        >
          <View
            style={[
              styles.infoIconBox,
              {
                backgroundColor: theme.background,
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.infoTitle,
                {
                  color: theme.primary,
                },
              ]}
            >
              How to play
            </Text>

            <Text
              style={[
                styles.infoText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Pick a faculty, select your department and
              course, then start your assessment.
            </Text>
          </View>
        </View>

        {/* Statistics */}

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: isDarkMode ? '#000' : '#444',
              elevation: isDarkMode ? 2 : 4,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Ionicons
              name="book"
              size={20}
              color={theme.primary}
            />

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {totalQuizzes}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Completed
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.statItem}>
            <Ionicons
              name="star"
              size={20}
              color="#FFD700"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {totalScore}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Total Pts
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.statItem}>
            <Ionicons
              name="trending-up"
              size={20}
              color="#27AE60"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {correctAnswers}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Correct
            </Text>
          </View>
        </View>

        {/* Personalized Academic Area & Recommended Courses */}

        <View style={styles.sectionContainer}>
          {recResponse?.hasAcademicProfile ? (
            <View>
              <View style={styles.recHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.text,
                        marginBottom: 2,
                      },
                    ]}
                  >
                    Recommended Courses
                  </Text>

                  <Text
                    style={[
                      styles.recAcademicArea,
                      {
                        color: theme.primary,
                      },
                    ]}
                  >
                    {recResponse.faculty?.code || 'LAUTECH'} |{' '}
                    {recResponse.department?.name} |{' '}
                    {recResponse.level}L
                  </Text>
                </View>

                {/* Semester Selector Chips */}

                <View style={styles.semesterToggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.semesterPill,
                      {
                        backgroundColor:
                          selectedSemester === 'harmattan'
                            ? '#D97706'
                            : theme.card,
                        borderColor:
                          selectedSemester === 'harmattan'
                            ? '#D97706'
                            : theme.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedSemester('harmattan')
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.semesterPillText,
                        {
                          color:
                            selectedSemester === 'harmattan'
                              ? '#FFFFFF'
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      Harmattan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.semesterPill,
                      {
                        backgroundColor:
                          selectedSemester === 'rain'
                            ? '#0284C7'
                            : theme.card,
                        borderColor:
                          selectedSemester === 'rain'
                            ? '#0284C7'
                            : theme.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedSemester('rain')
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.semesterPillText,
                        {
                          color:
                            selectedSemester === 'rain'
                              ? '#FFFFFF'
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      Rain
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isLoadingRecs ? (
                <View style={styles.recLoadingBox}>
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                  />

                  <Text
                    style={[
                      styles.recLoadingText,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    Finding departmental courses...
                  </Text>
                </View>
              ) : recResponse?.data?.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recCoursesList}
                >
                  {recResponse.data.map((course) => {
                    const icon = getCourseIcon(course.code);

                    return (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.recCourseCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() =>
                          handleRecommendedCoursePress(course)
                        }
                        activeOpacity={0.8}
                      >
                        <View style={styles.recCardTop}>
                          <View
                            style={[
                              styles.recIconCircle,
                              {
                                backgroundColor: `${theme.primary}18`,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={icon}
                              size={22}
                              color={theme.primary}
                            />
                          </View>

                          <View
                            style={[
                              styles.recSemesterBadge,
                              {
                                backgroundColor:
                                  course.semester === 'harmattan'
                                    ? 'rgba(217, 119, 6, 0.15)'
                                    : 'rgba(2, 132, 199, 0.15)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.recSemesterBadgeText,
                                {
                                  color:
                                    course.semester === 'harmattan'
                                      ? '#D97706'
                                      : '#0284C7',
                                },
                              ]}
                            >
                              {course.semester === 'harmattan'
                                ? 'Harmattan'
                                : 'Rain'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.recCourseCode,
                            {
                              color: theme.primary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {course.code}
                        </Text>

                        <Text
                          style={[
                            styles.recCourseTitle,
                            {
                              color: theme.text,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {course.title}
                        </Text>

                        <View style={styles.recStartRow}>
                          <Text
                            style={[
                              styles.recStartText,
                              {
                                color: theme.primary,
                              },
                            ]}
                          >
                            Take Assessment
                          </Text>

                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={theme.primary}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View
                  style={[
                    styles.recEmptyCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={32}
                    color={theme.textSecondary}
                  />

                  <Text
                    style={[
                      styles.recEmptyTitle,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    No courses scheduled for{' '}
                    {selectedSemester === 'harmattan'
                      ? 'Harmattan'
                      : 'Rain'}{' '}
                    semester yet.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.unconfiguredBanner,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.unconfiguredBannerLeft}>
                <View
                  style={[
                    styles.unconfiguredBannerIcon,
                    {
                      backgroundColor: `${theme.primary}18`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="school"
                    size={24}
                    color={theme.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.unconfiguredBannerTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Personalize Your Academic Courses
                  </Text>

                  <Text
                    style={[
                      styles.unconfiguredBannerDesc,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    Configure your Faculty, Department, and
                    Level to see tailored course recommendations.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.unconfiguredBannerBtn,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.unconfiguredBannerBtnText}>
                  Set Up Profile
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Explore All Faculties */}

        <View style={styles.sectionContainer}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Explore All Faculties
          </Text>

          {isLoadingFaculties ? (
            <View style={styles.loadingFaculties}>
              <ActivityIndicator
                size="small"
                color={theme.primary}
              />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Loading faculties...
              </Text>
            </View>
          ) : allFacultiesWithMixed.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="school-outline"
                size={40}
                color={theme.textSecondary}
              />

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                No faculties available
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                We couldn't load the faculties right now.
              </Text>

              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={fetchFaculties}
              >
                <Text style={styles.retryText}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={allFacultiesWithMixed}
              renderItem={renderFaculty}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              style={{
                marginTop: 15,
              }}
            />
          )}
        </View>

        {/* Timed Challenge */}

        <View
          style={[
            styles.timerBanner,
            {
              backgroundColor: theme.primary,
              borderColor: `${theme.primary}CC`,
            },
          ]}
        >
          <View>
            <Text style={styles.bannerTitle}>
              Timed Challenge
            </Text>

            <Text style={styles.bannerSub}>
              Mixed Faculty Questions | 30secs
            </Text>
          </View>

          <MaterialCommunityIcons
            name="timer-off-outline"
            size={35}
            color={Colors.white}
          />
        </View>
      </ScrollView>

      {/* Recommended Course Assessment Type Modal */}

      <Modal
        visible={showAssessmentModal}
        transparent
        animationType="slide"
        onRequestClose={closeAssessmentModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeAssessmentModal}
          />

          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.background,
              },
            ]}
          >
            {/* Handle */}

            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            {/* Header */}

            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIcon,
                  {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={25}
                  color={theme.primary}
                />
              </View>

              <View style={styles.modalHeaderText}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Select Assessment
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedCourse?.code || 'Course'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeAssessmentModal}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.modalDescription,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Choose how you want to take this assessment.
            </Text>

            {/* CBT Option */}

            <TouchableOpacity
              style={[
                styles.assessmentCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => startAssessment('cbt')}
            >
              <View
                style={[
                  styles.assessmentIcon,
                  {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={27}
                  color={theme.primary}
                />
              </View>

              <View style={styles.assessmentContent}>
                <Text
                  style={[
                    styles.assessmentTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  CBT
                </Text>

                <Text
                  style={[
                    styles.assessmentDescription,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  Multiple-choice questions. Choose the correct
                  option.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* THEORY Option */}

            <TouchableOpacity
              style={[
                styles.assessmentCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => startAssessment('theory')}
            >
              <View
                style={[
                  styles.assessmentIcon,
                  {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={27}
                  color={theme.primary}
                />
              </View>

              <View style={styles.assessmentContent}>
                <Text
                  style={[
                    styles.assessmentTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Theory
                </Text>

                <Text
                  style={[
                    styles.assessmentDescription,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  Detailed written explanations and conceptual
                  answers.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    marginBottom: 6,
  },

  welcomeContainer: {
    flex: 1,
    marginRight: 12,
  },

  welcomeText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginBottom: -2,
  },

  userName: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
    flexWrap: 'wrap',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },

  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Ubuntu-Bold',
    textAlign: 'center',
  },

  avatarWrapper: {
    flexShrink: 0,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
  },

  initialAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },

  initialText: {
    fontFamily: 'Archivo-Black',
    fontSize: 16,
  },

  instructionCard: {
    flexDirection: 'row',
    marginHorizontal: 25,
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },

  infoIconBox: {
    padding: 8,
    borderRadius: 10,
  },

  infoTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
  },

  infoText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 18,
  },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 25,
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-around',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  statLabel: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 2,
  },

  divider: {
    width: 1,
    height: 35,
  },

  sectionContainer: {
    paddingHorizontal: 25,
  },

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  facultyCard: {
    width: '47%',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
  },

  facultyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },

  iconBox: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },

  facultyArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  facultyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },

  facultyCode: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 4,
  },

  loadingFaculties: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    fontFamily: 'Ubuntu-Regular',
    marginTop: 10,
  },

  emptyContainer: {
    marginTop: 15,
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginTop: 10,
  },

  emptyText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
  },

  retryButton: {
    marginTop: 15,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },

  timerBanner: {
    margin: 25,
    borderRadius: 22,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },

  bannerTitle: {
    fontFamily: 'Archivo-Black',
    color: Colors.white,
    fontSize: 18,
  },

  bannerSub: {
    fontFamily: 'Ubuntu-Regular',
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
  },

  // =====================================================
  // RECOMMENDED COURSES
  // =====================================================

  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  recAcademicArea: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },

  semesterToggleGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  semesterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  semesterPillText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },

  recLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },

  recLoadingText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
  },

  recCoursesList: {
    gap: 12,
    paddingRight: 20,
    paddingVertical: 4,
  },

  recCourseCard: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },

  recCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  recIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  recSemesterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  recSemesterBadgeText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 11,
  },

  recCourseCode: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginBottom: 4,
  },

  recCourseTitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 12,
  },

  recStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },

  recStartText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
  },

  recEmptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },

  recEmptyTitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    textAlign: 'center',
  },

  // =====================================================
  // UNCONFIGURED BANNER
  // =====================================================

  unconfiguredBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },

  unconfiguredBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  unconfiguredBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  unconfiguredBannerTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
    marginBottom: 4,
  },

  unconfiguredBannerDesc: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
  },

  unconfiguredBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },

  unconfiguredBannerBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },

  // =====================================================
  // ASSESSMENT MODAL
  // =====================================================

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },

  modalHandle: {
    width: 45,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },

  modalSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginTop: 2,
  },

  modalCloseButton: {
    padding: 5,
  },

  modalDescription: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  assessmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },

  assessmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  assessmentContent: {
    flex: 1,
  },

  assessmentTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginBottom: 4,
  },

  assessmentDescription: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
});