import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';

import { Colors } from '../../constants/colors';

import { useQuizHistoryQuery } from '../../hooks/useQuizHistoryQuery';

export default function HistoryScreen() {
  const router = useRouter();

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  const {
    data: history = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuizHistoryQuery();

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Recent Quiz';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Recent Quiz';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const renderHistoryItem = ({
    item,
  }) => {
    const totalQuestions =
      Number(item.totalQuestions) || 0;

    const correctCount =
      Number(
        item.correctAnswers ??
          item.correct
      ) || 0;

    /*
     * IMPORTANT:
     *
     * `score` is the POINT SCORE from
     * the backend.
     *
     * Example:
     *
     * 10/10 = 100 pts
     * 5/10  = 50 pts
     * 2/10  = 20 pts
     *
     * Do NOT use score as the percentage.
     */
    const score =
      Number(item.score) || 0;

    /*
     * The backend returns percentage
     * separately from score.
     *
     * New records should always use
     * item.percentage.
     *
     * If percentage is missing, calculate
     * it from the POINT SCORE instead of
     * correctAnswers.
     *
     * This is important for THEORY quizzes
     * because theory questions can receive
     * partial credit.
     *
     * Example:
     *
     * 35 points out of 50
     * = 70%
     *
     * Using correctAnswers would lose
     * the partial-credit information.
     */
    const percentage =
      item.percentage !== undefined &&
      item.percentage !== null
        ? Number(item.percentage)
        : totalQuestions > 0
          ? Number(
              (
                (score /
                  (totalQuestions * 10)) *
                100
              ).toFixed(2)
            )
          : 0;

    const courseName =
      item.courseTitle ||
      item.courseName ||
      'Assessment';

    const courseCode =
      String(
        item.courseCode ||
          item.course?.code ||
          item.category ||
          ''
      ).toUpperCase();

    const quizType =
      String(
        item.quizType || 'cbt'
      ).toLowerCase();

    const quizTypeLabel =
      quizType === 'theory'
        ? 'THEORY'
        : 'CBT';

    return (
      <View
        style={[
          styles.historyCard,
          {
            backgroundColor:
              theme.card,
          },
        ]}
      >
        <View
          style={
            styles.cardHeader
          }
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  isDarkMode
                    ? theme.border
                    : Colors.secondary +
                      '20',
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={24}
              color={theme.primary}
            />
          </View>

          <View
            style={
              styles.headerInfo
            }
          >
            <Text
              style={[
                styles.dateText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {formatDate(
                item.date ||
                  item.timestamp ||
                  item.createdAt
              )}
            </Text>

            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    theme.text,
                },
              ]}
              numberOfLines={1}
            >
              {courseCode
                ? `${courseCode} • ${courseName}`
                : courseName}
            </Text>

            <View
              style={[
                styles.quizTypeBadge,
                {
                  backgroundColor:
                    isDarkMode
                      ? theme.border
                      : theme.primary +
                        '10',
                },
              ]}
            >
              <Text
                style={[
                  styles.quizTypeText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                {quizTypeLabel}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.percentageBadge,
              {
                backgroundColor:
                  isDarkMode
                    ? '#1E293B'
                    : theme.primary +
                      '10',
              },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              {Math.round(
                percentage
              )}
              %
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statsRow,
            {
              backgroundColor:
                isDarkMode
                  ? theme.background
                  : '#FBFBFB',
            },
          ]}
        >
          <View
            style={
              styles.statDetail
            }
          >
            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Score
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {score} pts
            </Text>
          </View>

          <View
            style={[
              styles.statDivider,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <View
            style={
              styles.statDetail
            }
          >
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

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {correctCount}/
              {totalQuestions}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View
      style={
        styles.emptyContainer
      }
    >
      <Ionicons
        name="journal-outline"
        size={80}
        color={
          isDarkMode
            ? theme.border
            : '#E0E0E0'
        }
      />

      <Text
        style={[
          styles.emptyTitle,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        No History Yet
      </Text>

      <Text
        style={[
          styles.emptySub,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        Complete a quiz to see
        your performance history
        here.
      </Text>

      <TouchableOpacity
        style={[
          styles.startBtn,
          {
            backgroundColor:
              theme.primary,
          },
        ]}
        onPress={() =>
          router.push('/(main)')
        }
      >
        <Text
          style={
            styles.startBtnText
          }
        >
          Start a Quiz
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (
    isLoading &&
    history.length === 0
  ) {
    return (
      <View
        style={[
          styles.loadingContainer,
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
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme.card,
            borderBottomColor:
              theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color:
                theme.primary,
            },
          ]}
        >
          Quiz History
        </Text>

        <Text
          style={[
            styles.headerSub,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Tracking your growth
          over time
        </Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(
          item,
          index
        ) =>
          item.id?.toString() ||
          index.toString()
        }
        renderItem={
          renderHistoryItem
        }
        contentContainerStyle={
          styles.listContent
        }
        ListEmptyComponent={
          EmptyState
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    padding: 25,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontFamily:
      'Archivo-Black',
    fontSize: 26,
  },

  headerSub: {
    fontFamily:
      'Ubuntu-Regular',
    fontSize: 14,
    marginTop: 4,
  },

  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  historyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerInfo: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },

  dateText: {
    fontFamily:
      'Ubuntu-Regular',
    fontSize: 12,
  },

  categoryText: {
    fontFamily:
      'Ubuntu-Bold',
    fontSize: 16,
    marginTop: 2,
  },

  quizTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },

  quizTypeText: {
    fontFamily:
      'Ubuntu-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },

  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  percentageText: {
    fontFamily:
      'Ubuntu-Bold',
    fontSize: 14,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    borderRadius: 12,
    padding: 15,
  },

  statDetail: {
    flex: 1,
    alignItems: 'center',
  },

  statLabel: {
    fontFamily:
      'Ubuntu-Regular',
    fontSize: 11,
    marginBottom: 4,
  },

  statValue: {
    fontFamily:
      'Archivo-Black',
    fontSize: 16,
  },

  statDivider: {
    width: 1,
    height: '100%',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },

  emptyTitle: {
    fontFamily:
      'Archivo-Black',
    fontSize: 20,
    marginTop: 20,
  },

  emptySub: {
    fontFamily:
      'Ubuntu-Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 50,
    marginTop: 8,
  },

  startBtn: {
    marginTop: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },

  startBtnText: {
    color: '#FFF',
    fontFamily:
      'Ubuntu-Bold',
  },
});