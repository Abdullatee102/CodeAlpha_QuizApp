import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/colors';
import { useQuizHistoryQuery } from '../../hooks/useQuizHistoryQuery';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
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

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReviewPress = (item) => {
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

    const quizType = String(item.quizType || 'cbt').toLowerCase();
    const totalQuestions = Number(item.totalQuestions) || 0;
    const correctCount = Number(item.correctAnswers ?? item.correct) || 0;
    const score = Number(item.score) || 0;
    const percentage =
      item.percentage !== undefined && item.percentage !== null
        ? Number(item.percentage)
        : totalQuestions > 0
        ? Number(((score / (totalQuestions * 10)) * 100).toFixed(2))
        : 0;

    router.push({
      pathname: '/(profile)/quiz-review',
      params: {
        historyId: item.id || '',
        courseId: item.courseId || '',
        courseCode,
        courseTitle: courseName,
        quizType,
        score: String(score),
        percentage: String(Math.round(percentage)),
        correctAnswers: String(correctCount),
        totalQuestions: String(totalQuestions),
        createdAt: item.createdAt || item.date || '',
      },
    });
  };

  const renderHistoryItem = ({ item }) => {
    const totalQuestions = Number(item.totalQuestions) || 0;
    const correctCount =
      Number(item.correctAnswers ?? item.correct) || 0;
    const score = Number(item.score) || 0;

    const percentage =
      item.percentage !== undefined && item.percentage !== null
        ? Number(item.percentage)
        : totalQuestions > 0
        ? Number(((score / (totalQuestions * 10)) * 100).toFixed(2))
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

    const quizType = String(item.quizType || 'cbt').toLowerCase();
    const quizTypeLabel = quizType === 'theory' ? 'THEORY' : 'CBT';

    return (
      <TouchableOpacity
        style={[
          styles.historyCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleReviewPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDarkMode
                  ? theme.border
                  : Colors.secondary + '20',
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={24}
              color={theme.primary}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.dateText,
                { color: theme.textSecondary },
              ]}
            >
              {formatDate(item.date || item.timestamp || item.createdAt)}
            </Text>

            <Text
              style={[
                styles.categoryText,
                { color: theme.text },
              ]}
              numberOfLines={1}
            >
              {courseCode
                ? `${courseCode} | ${courseName}`
                : courseName}
            </Text>

            <View
              style={[
                styles.quizTypeBadge,
                {
                  backgroundColor: isDarkMode
                    ? theme.border
                    : theme.primary + '10',
                },
              ]}
            >
              <Text
                style={[
                  styles.quizTypeText,
                  { color: theme.primary },
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
                backgroundColor: isDarkMode
                  ? '#1E293B'
                  : theme.primary + '10',
              },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                { color: theme.primary },
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: isDarkMode
                ? theme.background
                : '#FBFBFB',
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.statDetail}>
            <Text
              style={[
                styles.statLabel,
                { color: theme.textSecondary },
              ]}
            >
              Score
            </Text>
            <Text
              style={[
                styles.statValue,
                { color: theme.text },
              ]}
            >
              {score} pts
            </Text>
          </View>

          <View style={styles.statDetail}>
            <Text
              style={[
                styles.statLabel,
                { color: theme.textSecondary },
              ]}
            >
              Correct
            </Text>
            <Text
              style={[
                styles.statValue,
                { color: theme.text },
              ]}
            >
              {correctCount}/{totalQuestions}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.reviewSmallBtn,
              {
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}30`,
              },
            ]}
            onPress={() => handleReviewPress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={15} color={theme.primary} />
            <Text style={[styles.reviewSmallBtnText, { color: theme.primary }]}>
              Review
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="history"
        size={64}
        color={theme.textSecondary}
      />
      <Text
        style={[
          styles.emptyTitle,
          { color: theme.text },
        ]}
      >
        No History Yet
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: theme.textSecondary },
        ]}
      >
        Complete your first quiz to begin tracking your academic assessment growth over time.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[
        styles.container,
        { backgroundColor: theme.background },,
        { paddingTop: topInset },
      ]}
     edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: isDarkMode
                ? theme.card
                : '#F1F5F9',
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.primary },
            ]}
          >
            Quiz History
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary },
            ]}
          >
            Tracking your academic assessment growth over time
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading your assessment history...
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) =>
            item.id ? String(item.id) : `history_${index}`
          }
          renderItem={renderHistoryItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  quizTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quizTypeText: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: 0.5,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  percentageText: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statDetail: {
    alignItems: 'center',
    minWidth: 70,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
  },
  reviewSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewSmallBtnText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Ubuntu-Bold',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 12,
  },
});
