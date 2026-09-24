import React, {
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import {
  useRouter,
} from 'expo-router';

import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

import {
  useAuthStore,
} from '../../store/authStore';

import {
  useQuizStore,
} from '../../store/quizStore';

import {
  useThemeStore,
} from '../../store/themeStore';

import {
  useNotificationsQuery,
} from '../../hooks/useNotificationsQuery';

import {
  useProfileQuery,
} from '../../hooks/useProfileQuery';

import {
  Colors,
} from '../../constants/colors';

import {
  getFacultyMeta,
} from '../../constants/academicIcons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  // =====================================================
  // AUTH / SESSION STATE
  // =====================================================

  const {
    user,
  } = useAuthStore();

  // =====================================================
  // PROFILE
  // =====================================================
  /*
   * TanStack Query is the source of truth for
   * profile/server state.
   *
   * This means profile information and statistics
   * displayed on Home come from the ['profile'] query.
   */

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

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const {
    data: notifications = [],
  } = useNotificationsQuery(50);

  const unreadNotificationCount =
    notifications.filter(
      (notification) =>
        !notification?.isRead
    ).length;

  // =====================================================
  // FETCH FACULTIES
  // =====================================================

  /*
   * Faculties are quiz-selection data,
   * so they remain managed by quizStore.
   */

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  // =====================================================
  // PROFILE STATISTICS
  // =====================================================

  /*
   * These values now come from TanStack Query.
   *
   * We intentionally do not fall back to
   * quizStore.results because those are local
   * quiz-session values rather than authoritative
   * server statistics.
   */

  const totalQuizzes =
    profile?.quizzesCompleted ??
    profile?.totalQuizzesTaken ??
    0;

  const totalScore =
    profile?.totalScore ??
    0;

  const correctAnswers =
    profile?.totalCorrect ??
    profile?.totalCorrectAnswers ??
    profile?.correctAnswers ??
    profile?.correct ??
    0;

  // =====================================================
  // PROFILE IDENTITY
  // =====================================================

  const userInitial = (
    profile?.fullName ||
    user?.displayName ||
    user?.fullName ||
    'S'
  )
    .split(' ')[0]
    .charAt(0)
    .toUpperCase();

  const profileImage =
    profile?.photoURL ||
    user?.photoURL;

  // =====================================================
  // FACULTY ICON
  // =====================================================

  const getFacultyIcon = (
    faculty
  ) => {
    const value =
      `${faculty?.code || ''} ${faculty?.name || ''}`
        .toLowerCase();

    if (
      value.includes('comput') ||
      value.includes('informatics')
    ) {
      return 'laptop';
    }

    if (
      value.includes('engineering') ||
      value.includes('technology') ||
      value.includes('fet')
    ) {
      return 'cog-outline';
    }

    if (
      value.includes('agric') ||
      value.includes('farm')
    ) {
      return 'sprout';
    }

    if (
      value.includes('science') ||
      value.includes('fci')
    ) {
      return 'atom';
    }

    if (
      value.includes('management') ||
      value.includes('business') ||
      value.includes('fbms')
    ) {
      return 'briefcase-outline';
    }

    if (
      value.includes('medicine') ||
      value.includes('health')
    ) {
      return 'medical-bag';
    }

    if (
      value.includes('art') ||
      value.includes('social') ||
      value.includes('human')
    ) {
      return 'account-group-outline';
    }

    if (
      value.includes('environment') ||
      value.includes('geo')
    ) {
      return 'map-marker-radius-outline';
    }

    return 'school-outline';
  };

  // =====================================================
  // FACULTY COLOR
  // =====================================================

  const getFacultyColor = (
    index
  ) => {
    const colors = [
      '#4834D4',
      '#0984E3',
      '#00B894',
      '#EB4D4B',
      '#E17055',
      '#6C5CE7',
      '#FD79A8',
      '#FF9F43',
      '#6AB04C',
      '#00CEC9',
    ];

    return colors[
      index % colors.length
    ];
  };

  // =====================================================
  // FACULTY PRESS
  // =====================================================

  const handleFacultyPress = (
    faculty
  ) => {
    abandonQuiz();

    router.push({
      pathname:
        '/(questions)/departments',

      params: {
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyCode: faculty.code,
      },
    });
  };

  // =====================================================
  // FACULTY ITEM
  // =====================================================

  const renderFaculty = ({
    item,
    index,
  }) => {
    const meta =
      getFacultyMeta(item);

    const icon =
      meta.icon;

    const color =
      meta.color;

    return (
      <TouchableOpacity
        style={[
          styles.facultyCard,
          {
            backgroundColor:
              theme.card,

            borderColor:
              theme.border,
          },
        ]}
        onPress={() =>
          handleFacultyPress(item)
        }
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                `${color}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={30}
            color={color}
          />
        </View>

        <Text
          style={[
            styles.facultyTitle,
            {
              color:
                theme.text,
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <Text
          style={[
            styles.facultyCode,
            {
              color:
                color,
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

  if (
    isProfileLoading &&
    !profile
  ) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
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
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        {/* Header */}

        <View
          style={styles.header}
        >
          <View
            style={
              styles.welcomeContainer
            }
          >
            <Text
              style={[
                styles.welcomeText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Hello,
            </Text>

            <Text
              style={[
                styles.userName,
                {
                  color:
                    theme.primary,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {profile?.fullName
                ?.split(' ')[0] ||
                user?.displayName
                  ?.split(' ')[0] ||
                'Scholar'}
            </Text>
          </View>

          {/* Header actions */}

          <View
            style={
              styles.headerActions
            }
          >
            {/* Notification Bell */}

            <TouchableOpacity
              onPress={() =>
                router.push(
                  '/notifications'
                )
              }
              style={[
                styles.notificationButton,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={25}
                color={theme.primary}
              />

              {unreadNotificationCount >
                0 && (
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      backgroundColor:
                        Colors.error,

                      borderColor:
                        theme.card,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {unreadNotificationCount >
                    99
                      ? '99+'
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar */}

            <TouchableOpacity
              onPress={() =>
                router.push('/')
              }
              style={
                styles.avatarWrapper
              }
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
                      borderColor:
                        theme.background,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.initialAvatar,
                    {
                      backgroundColor:
                        `${theme.primary}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.initialText,
                      {
                        color:
                          theme.primary,
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

        {/* How to Play */}

        <View
          style={[
            styles.instructionCard,
            {
              backgroundColor:
                isDarkMode
                  ? theme.card
                  : '#F0F7FF',

              borderColor:
                isDarkMode
                  ? theme.border
                  : '#DCEBFA',
            },
          ]}
        >
          <View
            style={[
              styles.infoIconBox,
              {
                backgroundColor:
                  theme.background,
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.primary}
            />
          </View>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={[
                styles.infoTitle,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              How to play
            </Text>

            <Text
              style={[
                styles.infoText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Pick a faculty, select your
              department and course, then
              start your assessment.
            </Text>
          </View>
        </View>

        {/* Statistics */}

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor:
                theme.card,

              borderColor:
                theme.border,

              shadowColor:
                isDarkMode
                  ? '#000'
                  : '#444',

              elevation:
                isDarkMode ? 2 : 4,
            },
          ]}
        >
          <View
            style={styles.statItem}
          >
            <Ionicons
              name="book"
              size={20}
              color={theme.primary}
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {totalQuizzes}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
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
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <View
            style={styles.statItem}
          >
            <Ionicons
              name="star"
              size={20}
              color="#FFD700"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {totalScore}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
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
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <View
            style={styles.statItem}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color="#27AE60"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {correctAnswers}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Correct
            </Text>
          </View>
        </View>

        {/* Faculties */}

        <View
          style={
            styles.sectionContainer
          }
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
            Select Faculty
          </Text>

          {isLoadingFaculties ? (
            <View
              style={
                styles.loadingFaculties
              }
            >
              <ActivityIndicator
                size="small"
                color={theme.primary}
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
                Loading faculties...
              </Text>
            </View>
          ) : faculties.length ===
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
                name="school-outline"
                size={40}
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
                No faculties available
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
                We couldn't load the
                faculties right now.
              </Text>

              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                ]}
                onPress={
                  fetchFaculties
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
              data={faculties}
              renderItem={
                renderFaculty
              }
              keyExtractor={(item) =>
                item.id
              }
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={
                styles.row
              }
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
              backgroundColor:
                theme.primary,

              borderColor:
                `${theme.primary}CC`,
            },
          ]}
        >
          <View>
            <Text
              style={
                styles.bannerTitle
              }
            >
              Timed Challenge
            </Text>

            <Text
              style={
                styles.bannerSub
              }
            >
              Mixed Faculty Questions •
              20secs
            </Text>
          </View>

          <MaterialCommunityIcons
            name="timer-off-outline"
            size={35}
            color={Colors.white}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 20,
  },

  welcomeContainer: {
    flex: 1,
    marginRight: 15,
  },

  welcomeText: {
    fontFamily: 'Ubuntu-Light',
    fontSize: 16,
  },

  userName: {
    fontFamily: 'Archivo-Black',
    fontSize: 24,
    flexWrap: 'wrap',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
  },

  initialAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },

  initialText: {
    fontFamily: 'Archivo-Black',
    fontSize: 22,
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
    color: '#999',
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

  iconBox: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 15,
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
});