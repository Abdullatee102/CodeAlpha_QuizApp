import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function AssessmentExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assessmentId } = useLocalSearchParams();
  const { theme, isDarkMode } = useThemeStore();
  const {
    startOrResumeAttempt,
    saveAttemptAnswers,
    sendAttemptHeartbeat,
    submitAssessmentAttempt,
  } = useQuizStore();

  // Loading & Initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

  // Attempt & Questions state
  const [attemptData, setAttemptData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers state: map of assessmentQuestionId -> { answer: string, isFlagged: boolean, clientVersion: number }
  const [answersMap, setAnswersMap] = useState({});

  // Timer & Autosave state
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState('SAVED'); // 'SAVED' | 'SAVING' | 'ERROR'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);

  // Modals
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

  // Refs for timers & pending saves
  const timerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const answersMapRef = useRef(answersMap);
  answersMapRef.current = answersMap;
  const handleAutoSubmitRef = useRef(null);

  // Intercept hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (!isSubmitted) {
        Alert.alert(
          'Examination in Progress',
          'Leaving this screen will not pause the examination clock. Your answers are auto-saved. Are you sure you want to exit?',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => router.back() },
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isSubmitted, router]);

  // 1. Initial Load / Resume Attempt
  const initializeExam = useCallback(async () => {
    if (!assessmentId) {
      setInitError('Assessment ID is required.');
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    setInitError(null);

    const result = await startOrResumeAttempt(assessmentId);
    if (!result.success || !result.data) {
      setInitError(result.error?.message || 'Failed to start or resume assessment.');
      setIsInitializing(false);
      return;
    }

    const { attempt, questions: fetchedQuestions = [], savedAnswers = {} } = result.data;

    // Check if attempt is already finalized
    if (attempt.status === 'SUBMITTED') {
      setIsSubmitted(true);
      setSubmissionReceipt({
        submittedAt: attempt.submittedAt || new Date().toISOString(),
        attemptId: attempt.id,
      });
      setIsInitializing(false);
      return;
    }

    if (attempt.status === 'TIMED_OUT') {
      setInitError('This assessment attempt has timed out.');
      setIsInitializing(false);
      return;
    }

    setAttemptData(attempt);
    setQuestions(fetchedQuestions);
    setRemainingSeconds(attempt.remainingSeconds || 0);

    // Populate initial answers map
    const initialMap = {};
    if (savedAnswers && typeof savedAnswers === 'object') {
      Object.entries(savedAnswers).forEach(([qId, val]) => {
        initialMap[qId] = {
          answer: val.answer || '',
          isFlagged: !!val.isFlagged,
          clientVersion: val.clientVersion || 1,
        };
      });
    }
    setAnswersMap(initialMap);
    setIsInitializing(false);
  }, [assessmentId, startOrResumeAttempt]);

  useEffect(() => {
    initializeExam();
  }, [initializeExam]);

  // 2. Countdown Timer
  useEffect(() => {
    if (isInitializing || isSubmitted || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, isSubmitted]);

  // 3. Heartbeat loop (every 30 seconds)
  useEffect(() => {
    if (isInitializing || isSubmitted || !attemptData?.id) return;

    heartbeatRef.current = setInterval(async () => {
      const hb = await sendAttemptHeartbeat(assessmentId, attemptData.id);
      if (hb.success && hb.data?.attempt) {
        if (hb.data.attempt.status === 'TIMED_OUT') {
          clearInterval(heartbeatRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          Alert.alert('Session Expired', 'The server has finalized this assessment as timed out.');
          router.replace('/(assessments)');
        }
      }
    }, 30000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isInitializing, isSubmitted, attemptData?.id, assessmentId, sendAttemptHeartbeat, router]);

  // Format timer display
  const formatTimer = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // 4. Answer Selection & Autosave
  const persistAnswerChange = async (qId, questionId, newAnswer, isFlagged, version) => {
    setSaveStatus('SAVING');
    const payload = [
      {
        assessmentQuestionId: qId,
        questionId: questionId,
        answer: newAnswer,
        isFlagged: isFlagged,
        clientVersion: version,
      },
    ];

    const res = await saveAttemptAnswers(assessmentId, attemptData?.id, payload);
    if (res.success) {
      setSaveStatus('SAVED');
    } else {
      setSaveStatus('ERROR');
    }
  };

  const handleSelectOption = (optionValue) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const qId = currentQ.assessmentQuestionId;
    const existing = answersMap[qId] || { answer: '', isFlagged: false, clientVersion: 0 };
    const nextVersion = (existing.clientVersion || 0) + 1;

    const updated = {
      ...existing,
      answer: optionValue,
      clientVersion: nextVersion,
    };

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: updated,
    }));

    // Immediate autosave for MCQ selection
    persistAnswerChange(qId, currentQ.questionId, optionValue, updated.isFlagged, nextVersion);
  };

  const handleTextChange = (text) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const qId = currentQ.assessmentQuestionId;
    const existing = answersMap[qId] || { answer: '', isFlagged: false, clientVersion: 0 };
    const nextVersion = (existing.clientVersion || 0) + 1;

    const updated = {
      ...existing,
      answer: text,
      clientVersion: nextVersion,
    };

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: updated,
    }));

    // Debounced autosave for Theory text (500ms debounce)
    setSaveStatus('SAVING');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistAnswerChange(qId, currentQ.questionId, text, updated.isFlagged, nextVersion);
    }, 600);
  };

  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const qId = currentQ.assessmentQuestionId;
    const existing = answersMap[qId] || { answer: '', isFlagged: false, clientVersion: 0 };
    const nextFlag = !existing.isFlagged;
    const nextVersion = (existing.clientVersion || 0) + 1;

    const updated = {
      ...existing,
      isFlagged: nextFlag,
      clientVersion: nextVersion,
    };

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: updated,
    }));

    persistAnswerChange(qId, currentQ.questionId, existing.answer || '', nextFlag, nextVersion);
  };

  // 5. Final Submission Handlers
  const handleAutoSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setSubmitModalVisible(false);

    const formattedAnswers = Object.entries(answersMapRef.current).map(([qId, val]) => {
      const q = questions.find((item) => item.assessmentQuestionId === qId);
      return {
        assessmentQuestionId: qId,
        questionId: q ? q.questionId : qId,
        answer: val.answer || '',
        isFlagged: val.isFlagged,
        clientVersion: val.clientVersion,
      };
    });

    const result = await submitAssessmentAttempt(assessmentId, attemptData?.id, formattedAnswers);
    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
      setSubmissionReceipt({
        submittedAt: new Date().toISOString(),
        attemptId: attemptData?.id,
        isAutoSubmitted: true,
      });
    } else {
      Alert.alert(
        'Time Expired',
        'Your time has ended. The server will finalize your submitted answers.',
        [{ text: 'OK', onPress: () => router.replace('/(assessments)') }]
      );
    }
  };
  handleAutoSubmitRef.current = handleAutoSubmit;

  const handleManualSubmit = async () => {
    setIsSubmitting(true);

    const formattedAnswers = Object.entries(answersMapRef.current).map(([qId, val]) => {
      const q = questions.find((item) => item.assessmentQuestionId === qId);
      return {
        assessmentQuestionId: qId,
        questionId: q ? q.questionId : qId,
        answer: val.answer || '',
        isFlagged: val.isFlagged,
        clientVersion: val.clientVersion,
      };
    });

    const result = await submitAssessmentAttempt(assessmentId, attemptData?.id, formattedAnswers);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitModalVisible(false);
      setIsSubmitted(true);
      setSubmissionReceipt({
        submittedAt: new Date().toISOString(),
        attemptId: attemptData?.id,
        isAutoSubmitted: false,
      });
    } else {
      Alert.alert(
        'Submission Error',
        result.error?.message || 'Failed to submit examination. Please verify your connection and try again.'
      );
    }
  };

  // Stats calculation for question palette & summary
  const summary = useMemo(() => {
    let answered = 0;
    let flagged = 0;

    questions.forEach((q) => {
      const ans = answersMap[q.assessmentQuestionId];
      if (ans && ans.answer !== null && ans.answer !== undefined && ans.answer.trim() !== '') {
        answered++;
      }
      if (ans && ans.isFlagged) {
        flagged++;
      }
    });

    return {
      total: questions.length,
      answered,
      unanswered: Math.max(0, questions.length - answered),
      flagged,
    };
  }, [questions, answersMap]);

  // Loading Screen
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Preparing your examination environment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error Screen
  if (initError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Cannot Access Examination
          </Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary || '#6B7280' }]}>
            {initError}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/(assessments)')}
          >
            <Text style={styles.actionButtonText}>Back to Assessments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 6. Submission Receipt View
  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.centeredReceipt}>
          <View style={styles.receiptCheckCircle}>
            <Ionicons name="checkmark-done" size={48} color="#10B981" />
          </View>

          <Text style={[styles.receiptTitle, { color: theme.text || '#111827' }]}>
            Assessment Submitted
          </Text>

          <Text style={[styles.receiptSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            {submissionReceipt?.isAutoSubmitted
              ? 'Your examination time ended and all answered questions were automatically saved and submitted.'
              : 'Your examination answers have been securely recorded on the server.'}
          </Text>

          {/* Receipt Details Card */}
          <View style={[styles.receiptCard, { backgroundColor: theme.card || '#FFFFFF', borderColor: theme.border || '#E5E7EB' }]}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary || '#6B7280' }]}>Submitted At</Text>
              <Text style={[styles.receiptVal, { color: theme.text || '#111827' }]}>
                {submissionReceipt?.submittedAt
                  ? new Date(submissionReceipt.submittedAt).toLocaleTimeString('en-GB', {
                      timeZone: 'Africa/Lagos',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }) + ' (WAT)'
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary || '#6B7280' }]}>Questions Answered</Text>
              <Text style={[styles.receiptVal, { color: theme.text || '#111827' }]}>
                {summary.answered} of {summary.total}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary || '#6B7280' }]}>Attempt ID</Text>
              <Text style={[styles.receiptVal, { color: theme.text || '#111827', fontSize: 11 }]}>
                {attemptData?.id?.substring(0, 13)}...
              </Text>
            </View>
          </View>

          {/* Academic Policy Notice */}
          <View style={[styles.gradingNotice, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.gradingNoticeText, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>
              Official scores and grading will be reviewed by your course lecturer and released in accordance with the department’s results policy.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.receiptBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/(assessments)')}
          >
            <Text style={styles.receiptBtnText}>Return to Assessments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active Question Data
  const currentQuestion = questions[currentIndex];
  const currentQId = currentQuestion?.assessmentQuestionId;
  const currentAnswerObj = currentQId ? answersMap[currentQId] : null;
  const currentAnswerText = currentAnswerObj?.answer || '';
  const isCurrentFlagged = !!currentAnswerObj?.isFlagged;

  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 0; // <= 5 minutes

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#F3F4F6' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Top Header Bar */}
      <View style={[styles.examHeader, { backgroundColor: theme.card || '#FFFFFF', borderBottomColor: theme.border || '#E5E7EB' }]}>
        {/* Question Counter Button (opens palette) */}
        <TouchableOpacity
          style={[styles.paletteButton, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
          onPress={() => setPaletteVisible(true)}
        >
          <Ionicons name="grid-outline" size={16} color={theme.text || '#111827'} style={{ marginRight: 6 }} />
          <Text style={[styles.paletteButtonText, { color: theme.text || '#111827' }]}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </TouchableOpacity>

        {/* Server-Authoritative Countdown Timer */}
        <View style={[styles.timerBadge, { backgroundColor: isLowTime ? '#FEE2E2' : (isDarkMode ? '#374151' : `${theme.primary}12`) }]}>
          <Ionicons
            name="time-outline"
            size={16}
            color={isLowTime ? '#EF4444' : (theme.primary)}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.timerText,
              { color: isLowTime ? '#DC2626' : (theme.primary), fontWeight: isLowTime ? '800' : '700' },
            ]}
          >
            {formatTimer(remainingSeconds)}
          </Text>
        </View>

        {/* Autosave & Flag Indicators */}
        <View style={styles.headerRightActions}>
          <View style={styles.autosaveIndicator}>
            {saveStatus === 'SAVING' ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : saveStatus === 'ERROR' ? (
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
            ) : (
              <Ionicons name="cloud-done-outline" size={18} color="#10B981" />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.flagBtn,
              { backgroundColor: isCurrentFlagged ? '#FEF3C7' : (isDarkMode ? '#374151' : '#F3F4F6') },
            ]}
            onPress={handleToggleFlag}
          >
            <Ionicons
              name={isCurrentFlagged ? 'flag' : 'flag-outline'}
              size={18}
              color={isCurrentFlagged ? '#D97706' : (theme.textSecondary || '#6B7280')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Question Body */}
      {currentQuestion ? (
        <ScrollView
          style={styles.questionScrollView}
          contentContainerStyle={[styles.questionContent, { paddingBottom: Math.max(insets.bottom + 90, 110) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Metadata Bar */}
          <View style={styles.questionMetaRow}>
            <View style={styles.qTypePill}>
              <Text style={styles.qTypePillText}>
                {String(currentQuestion.type).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.marksText, { color: theme.textSecondary || '#6B7280' }]}>
              {currentQuestion.allocatedMarks || 1} mark{currentQuestion.allocatedMarks > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Question Text */}
          <Text style={[styles.questionText, { color: theme.text || '#111827' }]}>
            {currentQuestion.question}
          </Text>

          {/* Question Answer Inputs */}
          {currentQuestion.type === 'cbt' ? (
            <View style={styles.optionsContainer}>
              {Array.isArray(currentQuestion.options) &&
                currentQuestion.options.map((opt, optIdx) => {
                  const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt));
                  const isSelected = currentAnswerText === optText;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? (isDarkMode ? `${theme.primary}20` : `${theme.primary}12`)
                            : (theme.card || '#FFFFFF'),
                          borderColor: isSelected
                            ? (theme.primary)
                            : (theme.border || '#E5E7EB'),
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectOption(optText)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? (theme.primary)
                              : (theme.border || '#D1D5DB'),
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: theme.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected ? (theme.primary) : (theme.text || '#1F2937'),
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {optText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          ) : (
            /* Theory / Essay Response Input */
            <View style={styles.theoryContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary || '#6B7280' }]}>
                Type your comprehensive response below:
              </Text>
              <TextInput
                style={[
                  styles.theoryInput,
                  {
                    backgroundColor: theme.card || '#FFFFFF',
                    borderColor: theme.border || '#E5E7EB',
                    color: theme.text || '#111827',
                  },
                ]}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholder="Write your explanation or working here..."
                placeholderTextColor={theme.textSecondary || '#9CA3AF'}
                value={currentAnswerText}
                onChangeText={handleTextChange}
              />
              <Text style={[styles.wordCount, { color: theme.textSecondary || '#9CA3AF' }]}>
                {currentAnswerText ? currentAnswerText.trim().split(/\s+/).length : 0} words
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.errorMessage, { color: theme.textSecondary || '#6B7280' }]}>
            No question found.
          </Text>
        </View>
      )}

      {/* Bottom Sticky Navigation & Finish Bar */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.card || '#FFFFFF',
            borderTopColor: theme.border || '#E5E7EB',
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', opacity: currentIndex === 0 ? 0.4 : 1 },
          ]}
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text || '#111827'} />
          <Text style={[styles.navButtonText, { color: theme.text || '#111827' }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: '#10B981' }]}
          onPress={() => setSubmitModalVisible(true)}
        >
          <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.finishButtonText}>Finish Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: theme.primary,
              opacity: currentIndex === questions.length - 1 ? 0.4 : 1,
            },
          ]}
          onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Question Palette Modal */}
      <Modal
        visible={paletteVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaletteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card || '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>
                Question Navigator
              </Text>
              <TouchableOpacity onPress={() => setPaletteVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text || '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary || '#6B7280' }]}>Answered ({summary.answered})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary || '#6B7280' }]}>Flagged ({summary.flagged})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { borderColor: '#D1D5DB', borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary || '#6B7280' }]}>Unanswered ({summary.unanswered})</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.paletteGrid}>
              {questions.map((q, idx) => {
                const ans = answersMap[q.assessmentQuestionId];
                const hasAnswer = ans && ans.answer !== null && ans.answer !== undefined && ans.answer.trim() !== '';
                const isFlagged = ans && ans.isFlagged;
                const isCurrent = idx === currentIndex;

                let itemBg = isDarkMode ? '#374151' : '#F3F4F6';
                let textColor = theme.text || '#111827';
                let borderColor = 'transparent';

                if (hasAnswer) {
                  itemBg = theme.primary;
                  textColor = '#FFFFFF';
                }
                if (isFlagged) {
                  itemBg = '#F59E0B';
                  textColor = '#FFFFFF';
                }
                if (isCurrent) {
                  borderColor = '#111827';
                }

                return (
                  <TouchableOpacity
                    key={q.assessmentQuestionId}
                    style={[
                      styles.paletteItem,
                      {
                        backgroundColor: itemBg,
                        borderColor: isCurrent ? (theme.primary || '#111827') : borderColor,
                        borderWidth: isCurrent ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      setCurrentIndex(idx);
                      setPaletteVisible(false);
                    }}
                  >
                    <Text style={[styles.paletteItemText, { color: textColor }]}>
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation & Submit Modal */}
      <Modal
        visible={submitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmitting && setSubmitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.submitDialogCard, { backgroundColor: theme.card || '#FFFFFF' }]}>
            <View style={styles.submitDialogHeader}>
              <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
              <Text style={[styles.submitDialogTitle, { color: theme.text || '#111827' }]}>
                Submit Examination?
              </Text>
            </View>

            <Text style={[styles.submitDialogText, { color: theme.textSecondary || '#6B7280' }]}>
              Please verify your answers before final submission. Once submitted, your answers cannot be altered.
            </Text>

            {/* Summary Grid in Modal */}
            <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#10B981' }]}>{summary.answered}</Text>
                <Text style={[styles.summaryLbl, { color: theme.textSecondary || '#6B7280' }]}>Answered</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#EF4444' }]}>{summary.unanswered}</Text>
                <Text style={[styles.summaryLbl, { color: theme.textSecondary || '#6B7280' }]}>Unanswered</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>{summary.flagged}</Text>
                <Text style={[styles.summaryLbl, { color: theme.textSecondary || '#6B7280' }]}>Flagged</Text>
              </View>
            </View>

            {summary.unanswered > 0 && (
              <Text style={styles.unansweredWarning}>
                Warning: You have {summary.unanswered} unanswered question{summary.unanswered > 1 ? 's' : ''}!
              </Text>
            )}

            <View style={styles.submitDialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelBtn, { borderColor: theme.border || '#D1D5DB' }]}
                onPress={() => setSubmitModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.dialogCancelText, { color: theme.text || '#111827' }]}>
                  Continue Exam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: '#10B981' }]}
                onPress={handleManualSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogConfirmText}>Confirm & Submit</Text>
                )}
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
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paletteButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autosaveIndicator: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBtn: {
    padding: 6,
    borderRadius: 8,
  },
  questionScrollView: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qTypePill: {
    backgroundColor: 'rgba(0, 93, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  marksText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  theoryContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  theoryInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
  },
  wordCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 24,
  },
  paletteItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitDialogCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
  },
  submitDialogHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  submitDialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  submitDialogText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  unansweredWarning: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  submitDialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  dialogCancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centeredReceipt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  receiptCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  receiptSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  receiptCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  receiptLabel: {
    fontSize: 13,
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  gradingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    width: '100%',
  },
  gradingNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  receiptBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  receiptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
