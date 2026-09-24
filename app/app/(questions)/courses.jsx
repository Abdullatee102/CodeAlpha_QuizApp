import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore';
import { getCourseIcon } from '../../constants/academicIcons';

export default function CoursesScreen() {
  const router = useRouter();

  const {
    departmentId,
    departmentName,
    departmentCode,
    facultyId,
    facultyName,
    facultyCode,
    level,
    semester,
  } = useLocalSearchParams();

  const {
    courses,
    isLoadingCourses,
    fetchCourses,
  } = useQuizStore();

  const { theme } =
    useThemeStore();

  // =====================================================
  // LOCAL STATE
  // =====================================================

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState(null);

  const [
    showAssessmentModal,
    setShowAssessmentModal,
  ] = useState(false);

  // =====================================================
  // FETCH COURSES
  // =====================================================

  useEffect(() => {
    if (
      departmentId &&
      level &&
      semester
    ) {
      fetchCourses(
        departmentId,
        Number(level),
        semester
      );
    }
  }, [
    departmentId,
    level,
    semester,
    fetchCourses,
  ]);

  // =====================================================
  // OPEN QUIZ
  // =====================================================

  const openQuiz = (
    course,
    quizType
  ) => {
    setShowAssessmentModal(
      false
    );

    setSelectedCourse(null);

    router.push({
      pathname:
        '/(main)/quiz',

      params: {
        courseId:
          course.id,

        courseTitle:
          course.title,

        courseCode:
          course.code,

        quizType,

        departmentId,
        departmentName,
        departmentCode,

        facultyId,
        facultyName,
        facultyCode,

        level,
        semester,
      },
    });
  };

  // =====================================================
  // SELECT COURSE
  // =====================================================

  const handleCoursePress = (
    course
  ) => {
    setSelectedCourse(
      course
    );

    setShowAssessmentModal(
      true
    );
  };

  // =====================================================
  // CLOSE ASSESSMENT MODAL
  // =====================================================

  const closeAssessmentModal =
    () => {
      setShowAssessmentModal(
        false
      );

      setSelectedCourse(null);
    };

  // =====================================================
  // SEMESTER NAME
  // =====================================================

  const getSemesterName = (
    value
  ) => {
    if (
      value === 'harmattan'
    ) {
      return 'Harmattan';
    }

    if (
      value === 'rain'
    ) {
      return 'Rain';
    }

    return value;
  };

  // =====================================================
  // COURSE CARD
  // =====================================================

  const renderCourse = ({
    item,
  }) => {
    const courseIcon =
      getCourseIcon(item.code);

    return (
      <TouchableOpacity
        style={[
          styles.courseCard,
          {
            backgroundColor:
              theme.card,

            borderColor:
              theme.border,
          },
        ]}
        onPress={() =>
          handleCoursePress(
            item
          )
        }
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                `${theme.primary}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={courseIcon}
            size={26}
            color={
              theme.primary
            }
          />
        </View>

        <View
          style={
            styles.courseInfo
          }
        >
          <Text
            style={[
              styles.courseCode,
              {
                color:
                  theme.primary,
              },
            ]}
          >
            {item.code}
          </Text>

          <Text
            style={[
              styles.courseTitle,
              {
                color:
                  theme.text,
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.courseDetails,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {item.level} Level •{' '}
            {getSemesterName(
              item.semester
            )}
          </Text>

          <View
            style={
              styles.assessmentHint
            }
          >
            <Ionicons
              name="options-outline"
              size={13}
              color={
                theme.textSecondary
              }
            />

            <Text
              style={[
                styles.assessmentHintText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Choose assessment type
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={
            theme.textSecondary
          }
        />
      </TouchableOpacity>
    );
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      {/* Header */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={
              theme.text
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerTextContainer
          }
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Select Course
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {departmentName} •{' '}
            {level} Level
          </Text>
        </View>
      </View>

      {/* Selection Summary */}

      <View
        style={[
          styles.summaryCard,
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
            styles.summaryIcon,
            {
              backgroundColor:
                `${theme.primary}20`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="school-outline"
            size={27}
            color={
              theme.primary
            }
          />
        </View>

        <View
          style={
            styles.summaryInfo
          }
        >
          <Text
            style={[
              styles.departmentName,
              {
                color:
                  theme.text,
              },
            ]}
            numberOfLines={1}
          >
            {departmentName}
          </Text>

          <Text
            style={[
              styles.summaryDetails,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {departmentCode} •{' '}
            {level} Level •{' '}
            {getSemesterName(
              semester
            )}
          </Text>
        </View>
      </View>

      {/* Courses */}

      <View
        style={styles.content}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          Available Courses
        </Text>

        <Text
          style={[
            styles.sectionSubtitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Select a course, then choose
          your assessment type.
        </Text>

        {isLoadingCourses ? (
          <View
            style={
              styles.centered
            }
          >
            <ActivityIndicator
              size="large"
              color={
                theme.primary
              }
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Loading courses...
            </Text>
          </View>
        ) : courses.length ===
          0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor:
                  theme.card,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={45}
              color={
                theme.textSecondary
              }
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              No courses available
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
              No courses were found
              for this level and
              semester.
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
                fetchCourses(
                  departmentId,
                  Number(level),
                  semester
                )
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={
              renderCourse
            }
            keyExtractor={(
              item
            ) => item.id}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.listContent
            }
          />
        )}
      </View>

      {/* =================================================
          ASSESSMENT TYPE MODAL
      ================================================= */}

      <Modal
        visible={
          showAssessmentModal
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeAssessmentModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <Pressable
            style={
              styles.modalBackdrop
            }
            onPress={
              closeAssessmentModal
            }
          />

          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  theme.background,
              },
            ]}
          >
            {/* Handle */}

            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            {/* Header */}

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={[
                  styles.modalIcon,
                  {
                    backgroundColor:
                      `${theme.primary}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={25}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={
                  styles.modalHeaderText
                }
              >
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Select Assessment
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedCourse?.code ||
                    'Course'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={
                  closeAssessmentModal
                }
                style={
                  styles.modalCloseButton
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={
                    theme.text
                  }
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.modalDescription,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Choose how you want to
              take this assessment.
            </Text>

            {/* CBT */}

            <TouchableOpacity
              style={[
                styles.assessmentCard,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                selectedCourse &&
                openQuiz(
                  selectedCourse,
                  'cbt'
                )
              }
            >
              <View
                style={[
                  styles.assessmentIcon,
                  {
                    backgroundColor:
                      `${theme.primary}20`,
                  },
                ]}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={27}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={
                  styles.assessmentContent
                }
              >
                <Text
                  style={[
                    styles.assessmentTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  CBT
                </Text>

                <Text
                  style={[
                    styles.assessmentDescription,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Multiple-choice questions.
                  Choose the correct option.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={
                  theme.textSecondary
                }
              />
            </TouchableOpacity>

            {/* THEORY */}

            <TouchableOpacity
              style={[
                styles.assessmentCard,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                selectedCourse &&
                openQuiz(
                  selectedCourse,
                  'theory'
                )
              }
            >
              <View
                style={[
                  styles.assessmentIcon,
                  {
                    backgroundColor:
                      `${theme.primary}20`,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={27}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={
                  styles.assessmentContent
                }
              >
                <Text
                  style={[
                    styles.assessmentTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Theory
                </Text>

                <Text
                  style={[
                    styles.assessmentDescription,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Written-answer questions.
                  Explain your answer clearly.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color={
                  theme.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.cancelButton
              }
              onPress={
                closeAssessmentModal
              }
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 20,

      paddingTop: 15,

      paddingBottom: 20,
    },

    backButton: {
      marginRight: 15,
    },

    headerTextContainer: {
      flex: 1,
    },

    headerTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 22,
    },

    headerSubtitle: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      marginTop: 3,
    },

    summaryCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginHorizontal: 20,

      padding: 16,

      borderRadius: 18,

      borderWidth: 1,

      marginBottom: 20,
    },

    summaryIcon: {
      width: 50,

      height: 50,

      borderRadius: 15,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 14,
    },

    summaryInfo: {
      flex: 1,
    },

    departmentName: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 16,
    },

    summaryDetails: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 12,

      marginTop: 4,
    },

    content: {
      flex: 1,

      paddingHorizontal: 20,
    },

    sectionTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 20,

      marginBottom: 4,
    },

    sectionSubtitle: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      marginBottom: 15,
    },

    listContent: {
      paddingBottom: 30,
    },

    courseCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      padding: 16,

      borderRadius: 18,

      borderWidth: 1,

      marginBottom: 12,
    },

    iconBox: {
      width: 52,

      height: 52,

      borderRadius: 15,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 15,
    },

    courseInfo: {
      flex: 1,
    },

    courseCode: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 13,

      marginBottom: 3,
    },

    courseTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 16,
    },

    courseDetails: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 11,

      marginTop: 5,
    },

    assessmentHint: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,

      marginTop: 7,
    },

    assessmentHintText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 10,
    },

    centered: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    loadingText: {
      fontFamily:
        'Ubuntu-Regular',

      marginTop: 10,
    },

    emptyContainer: {
      padding: 30,

      borderRadius: 20,

      borderWidth: 1,

      marginTop: 10,

      alignItems:
        'center',
    },

    emptyTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 17,

      marginTop: 12,
    },

    emptyText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      textAlign:
        'center',

      marginTop: 6,
    },

    retryButton: {
      marginTop: 18,

      paddingHorizontal: 25,

      paddingVertical: 11,

      borderRadius: 10,
    },

    retryText: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',
    },

    // =====================================================
    // ASSESSMENT MODAL
    // =====================================================

    modalOverlay: {
      flex: 1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(0, 0, 0, 0.45)',
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },

    modalContainer: {
      borderTopLeftRadius: 28,

      borderTopRightRadius: 28,

      paddingHorizontal: 22,

      paddingTop: 12,

      paddingBottom: 30,
    },

    modalHandle: {
      width: 45,

      height: 5,

      borderRadius: 10,

      alignSelf:
        'center',

      marginBottom: 20,
    },

    modalHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    modalIcon: {
      width: 48,

      height: 48,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    modalHeaderText: {
      flex: 1,
    },

    modalTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 20,
    },

    modalSubtitle: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      marginTop: 3,
    },

    modalCloseButton: {
      width: 38,

      height: 38,

      borderRadius: 19,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    modalDescription: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 14,

      lineHeight: 20,

      marginTop: 16,

      marginBottom: 16,
    },

    assessmentCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      padding: 17,

      borderRadius: 18,

      borderWidth: 1,

      marginBottom: 12,
    },

    assessmentIcon: {
      width: 48,

      height: 48,

      borderRadius: 14,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 13,
    },

    assessmentContent: {
      flex: 1,
    },

    assessmentTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 17,
    },

    assessmentDescription: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 12,

      lineHeight: 18,

      marginTop: 3,

      paddingRight: 8,
    },

    cancelButton: {
      alignItems:
        'center',

      paddingVertical: 14,

      marginTop: 3,
    },

    cancelButtonText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,
    },
  });