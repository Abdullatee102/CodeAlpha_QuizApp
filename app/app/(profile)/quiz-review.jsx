import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';
import { Colors } from '../../constants/colors';
import api from '../../data/api';

export default function QuizReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    historyId,
    courseId,
    courseCode,
    courseTitle,
    quizType = 'cbt',
    score = '0',
    percentage = '0',
    correctAnswers = '0',
    totalQuestions = '0',
    createdAt,
  } = params;

  const { theme, isDarkMode } = useThemeStore();
  const getQuizReview = useQuizStore((state) => state.getQuizReview);

  const [review, setReview] = useState(null);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [fallbackQuestions, setFallbackQuestions] = useState([]);

  useEffect(() => {
    // 1. Try to load from store / MMKV
    const cached = getQuizReview(historyId);
    if (cached) {
      setReview(cached);
      return;
    }

    // 2. If not in local cache, attempt to fetch questions for this course to show assessment review
    if (courseId) {
      setIsLoadingFallback(true);
      api
        .get(`/auth/courses/${courseId}/questions`, {
          params: { type: quizType },
        })
        .then((res) => {
          const fetched = res.data?.data || res.data?.questions || [];
          setFallbackQuestions(fetched);
        })
        .catch((err) => {
          console.warn('[QUIZ REVIEW] Could not fetch fallback questions:', err);
        })
        .finally(() => {
          setIsLoadingFallback(false);
        });
    }
  }, [historyId, courseId, quizType, getQuizReview]);

  const questionsList = review?.questions || fallbackQuestions;
  const userAnswersMap = new Map(
    (review?.answers || []).map((a) => [a.questionId, a.answer])
  );
  const resultsMap = new Map(
    (review?.results || []).map((r) => [r.questionId, r])
  );

  const parsedScore = Number(review?.score ?? score);
  const parsedPercentage = Number(review?.percentage ?? percentage);
  const parsedCorrect = Number(review?.correctAnswers ?? correctAnswers);
  const parsedTotal = Number(
    review?.totalQuestions ?? (totalQuestions || questionsList.length)
  );
  const parsedWrong = Math.max(0, parsedTotal - parsedCorrect);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Completed Quiz';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Completed Quiz';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isDarkMode ? theme.card : '#F1F5F9',
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Review Completed Work
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Read-only review of your answers & grading
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Overview Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.courseBadgeRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDarkMode
                      ? theme.border
                      : `${theme.primary}18`,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {String(courseCode || 'COURSE').toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                    marginLeft: 6,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                  {String(quizType).toUpperCase()}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.percentPill,
                {
                  backgroundColor:
                    parsedPercentage >= 70
                      ? '#10B98120'
                      : parsedPercentage >= 50
                      ? '#F59E0B20'
                      : '#EF444420',
                },
              ]}
            >
              <Text
                style={[
                  styles.percentPillText,
                  {
                    color:
                      parsedPercentage >= 70
                        ? '#10B981'
                        : parsedPercentage >= 50
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              >
                {Math.round(parsedPercentage)}%
              </Text>
            </View>
          </View>

          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            {courseTitle || 'Assessment Review'}
          </Text>

          <Text style={[styles.summaryDate, { color: theme.textSecondary }]}>
            Completed on {formatDate(createdAt || review?.createdAt)}
          </Text>

          {/* Quick Metrics Bar */}
          <View
            style={[
              styles.metricsBar,
              {
                backgroundColor: isDarkMode ? theme.background : '#F8FAFC',
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Score
              </Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {parsedScore} pts
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Correct
              </Text>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>
                {parsedCorrect} / {parsedTotal}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Missed
              </Text>
              <Text style={[styles.metricVal, { color: Colors.error }]}>
                {parsedWrong}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Question by Question Breakdown
          </Text>
          <Text style={[styles.readOnlyNote, { color: theme.textSecondary }]}>
            (View only - answers cannot be edited)
          </Text>
        </View>

        {isLoadingFallback ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingTxt, { color: theme.textSecondary }]}>
              Retrieving question details...
            </Text>
          </View>
        ) : questionsList.length === 0 ? (
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={32}
              color={theme.primary}
            />
            <Text style={[styles.noticeTitle, { color: theme.text }]}>
              Assessment Summary Saved
            </Text>
            <Text style={[styles.noticeDesc, { color: theme.textSecondary }]}>
              Your final score of {parsedScore} pts ({Math.round(parsedPercentage)}%) was securely recorded. Detailed per-question answer snapshots are available for quizzes completed on this device.
            </Text>
          </View>
        ) : (
          questionsList.map((q, index) => {
            const userAnswer = userAnswersMap.get(q.id);
            const grading = resultsMap.get(q.id);
            const isCorrect =
              grading !== undefined
                ? Boolean(grading.isCorrect)
                : parsedPercentage === 100
                ? true
                : undefined;

            return (
              <View
                key={q.id || `q_${index}`}
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor:
                      isCorrect === true
                        ? '#10B98150'
                        : isCorrect === false
                        ? '#EF444450'
                        : theme.border,
                  },
                ]}
              >
                {/* Question Card Header */}
                <View style={styles.qHeader}>
                  <Text style={[styles.qNum, { color: theme.primary }]}>
                    Question {index + 1}
                  </Text>

                  {isCorrect !== undefined && (
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isCorrect ? '#10B98115' : '#EF444415',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={isCorrect ? '#10B981' : '#EF4444'}
                      />
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isCorrect ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isCorrect ? 'Correct' : 'Missed'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Question Text */}
                <Text style={[styles.qText, { color: theme.text }]}>
                  {q.question}
                </Text>

                {/* Options List for CBT */}
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <View style={styles.optionsList}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === opt;
                      const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

                      let optBg = isDarkMode ? theme.background : '#F8FAFC';
                      let optBorder = theme.border;
                      let textColor = theme.text;
                      let badge = null;

                      if (isSelected) {
                        if (isCorrect === true) {
                          optBg = '#10B98118';
                          optBorder = '#10B981';
                          textColor = '#10B981';
                          badge = (
                            <View style={styles.optBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color="#10B981"
                              />
                              <Text style={[styles.optBadgeText, { color: '#10B981' }]}>
                                Your Answer
                              </Text>
                            </View>
                          );
                        } else if (isCorrect === false) {
                          optBg = '#EF444418';
                          optBorder = '#EF4444';
                          textColor = '#EF4444';
                          badge = (
                            <View style={styles.optBadge}>
                              <Ionicons
                                name="close-circle"
                                size={14}
                                color="#EF4444"
                              />
                              <Text style={[styles.optBadgeText, { color: '#EF4444' }]}>
                                Your Answer
                              </Text>
                            </View>
                          );
                        } else {
                          optBg = `${theme.primary}18`;
                          optBorder = theme.primary;
                          badge = (
                            <View style={styles.optBadge}>
                              <Text style={[styles.optBadgeText, { color: theme.primary }]}>
                                Selected
                              </Text>
                            </View>
                          );
                        }
                      }

                      return (
                        <View
                          key={optIdx}
                          style={[
                            styles.optionItem,
                            {
                              backgroundColor: optBg,
                              borderColor: optBorder,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.optLetterBox,
                              {
                                backgroundColor: isSelected
                                  ? isCorrect === true
                                    ? '#10B981'
                                    : isCorrect === false
                                    ? '#EF4444'
                                    : theme.primary
                                  : isDarkMode
                                  ? theme.border
                                  : '#E2E8F0',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.optLetterText,
                                {
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : theme.textSecondary,
                                },
                              ]}
                            >
                              {optLabel}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.optText,
                              { color: textColor, flex: 1 },
                            ]}
                          >
                            {opt}
                          </Text>

                          {badge}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Theory Answer View (if theory) */}
                {quizType === 'theory' && userAnswer && (
                  <View
                    style={[
                      styles.theoryBox,
                      {
                        backgroundColor: isDarkMode
                          ? theme.background
                          : '#F8FAFC',
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.theoryLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Your Submitted Answer:
                    </Text>
                    <Text style={[styles.theoryText, { color: theme.text }]}>
                      {userAnswer}
                    </Text>

                    {grading?.feedback && (
                      <View style={styles.feedbackWrap}>
                        <Text
                          style={[
                            styles.feedbackLabel,
                            { color: theme.primary },
                          ]}
                        >
                          Evaluation Feedback:
                        </Text>
                        <Text
                          style={[
                            styles.feedbackText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {grading.feedback}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Back to History Button */}
        <TouchableOpacity
          style={[
            styles.backToHistoryBtn,
            { backgroundColor: theme.primary },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backToHistoryBtnText}>
            Back to Quiz History
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
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
    fontSize: 22,
    fontFamily: 'Ubuntu-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: 0.5,
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentPillText: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginBottom: 14,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
  },
  readOnlyNote: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingTxt: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 8,
  },
  noticeCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
    marginTop: 10,
    marginBottom: 6,
  },
  noticeDesc: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  questionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qNum: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    marginLeft: 4,
  },
  qText: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  optionsList: {
    marginTop: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  optLetterBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optLetterText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  optText: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
  },
  optBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  optBadgeText: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    marginLeft: 3,
  },
  theoryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  theoryLabel: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  theoryText: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    lineHeight: 20,
  },
  feedbackWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  feedbackLabel: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    lineHeight: 18,
  },
  backToHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  backToHistoryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
    marginLeft: 8,
  },
});
