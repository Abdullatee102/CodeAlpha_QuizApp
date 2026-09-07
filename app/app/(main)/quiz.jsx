import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { QUIZ_DATA } from '../../data/questions';
import { useQuizStore } from '../../store/quizStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { quizReportHTML } from '../../components/ui/quizReport';

export default function QuizScreen() {
  const { categoryId, categoryTitle } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const { theme, isDarkMode } = useThemeStore();

  const {
    startQuiz,
    fetchQuestions,
    abandonQuiz,
    submitAnswer,
    nextQuestion,
    tick,
    isFinished,
    questions,
    currentQuestionIndex,
    score,
    timeLeft,
  } = useQuizStore();

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let isMounted = true;

    const initializeQuiz = async () => {
      abandonQuiz();
      setSelectedOption(null);
      setIsAnswered(false);

      let res = { success: false };
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 10000)
        );
        res = await Promise.race([fetchQuestions(categoryId), timeoutPromise]);
      } catch (err) {
        console.warn("Fetch questions timed out or failed, falling back to local data:", err);
      }
      
      let finalQuestionsCount = 0;
      if (res && res.success) {
        const currentQuestions = useQuizStore.getState().questions;
        finalQuestionsCount = currentQuestions.length;
      }

      if (finalQuestionsCount === 0) {
        const rawQuestions = QUIZ_DATA[categoryId] || [];
        if (rawQuestions.length > 0) {
          startQuiz(categoryId, rawQuestions);
          finalQuestionsCount = rawQuestions.length;
        }
      }

      if (finalQuestionsCount > 0) {
        if (isMounted) setIsLoading(false);

        setTimeout(() => {
          Alert.alert(
            "Fair Play Rules 🛡️",
            `1. Leaving this screen clears progress.\n2. Switching apps or minimizing terminates the quiz.\n3. Scores are only saved on completion.`,
            [
              {
                text: "Go Back",
                onPress: () => {
                  abandonQuiz();
                  router.back();
                },
                style: "cancel",
              },
              { text: "I Understand, Start", onPress: () => setIsStarted(true) },
            ],
            { cancelable: false }
          );
        }, 300);
      } else {
        if (isMounted) {
          setIsLoading(false);
          Alert.alert("Error", "No questions found for this category.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      }
    };

    initializeQuiz();

    return () => {
      isMounted = false;
      abandonQuiz();
    };
  }, [categoryId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        isStarted &&
        !isFinished &&
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        abandonQuiz();
        setIsStarted(false);
        router.replace('/(main)');

        setTimeout(() => {
          Alert.alert("Terminated", "App minimized. Progress cleared.");
        }, 100);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isStarted, isFinished]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isFinished || !isStarted) return;

      e.preventDefault();

      Alert.alert(
        'Abandon Quiz?',
        'Progress will be lost.',
        [
          { text: "Stay", style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              abandonQuiz();
              setIsStarted(false);
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isFinished, isStarted]);

  useEffect(() => {
    if (isAnswered || isFinished || !isStarted) return;

    if (timeLeft === 0) {
      handleAutoSkip();
      return;
    }

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isFinished, isStarted]);

  useEffect(() => {
    if (questions.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (currentQuestionIndex + 1) / questions.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestionIndex, questions.length]);

  const handleAutoSkip = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption('timeout');
    submitAnswer(null);
  };

  const handleOptionPress = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    submitAnswer(option);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (currentQuestionIndex >= questions.length - 1) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  };

  const handleDownloadReport = async (finalScore) => {
    const correctCount = Math.floor(finalScore / 10);
    const htmlContent = quizReportHTML({
      categoryTitle,
      finalScore,
      correctCount,
      totalQuestions: questions.length,
      profile,
      user,
    });

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("PDF generation or sharing failed: ", error);
      Alert.alert("Error", "Could not generate report file.");
    }
  };

  const finishQuiz = async () => {
    const finalScore = score;
    setIsStarted(false);

    try {
      await fetchProfile();
    } catch (error) {
      console.error("Profile sync error after quiz finish:", error);
    }

    Alert.alert(
      "Quiz Completed!",
      `Score: ${finalScore} Points`,
      [
        { text: "Share Report", onPress: () => handleDownloadReport(finalScore) },
        {
          text: "Done",
          onPress: () => {
            abandonQuiz();
            router.replace('/(main)');
          },
        },
      ]
    );
  };

  if (isLoading || !isStarted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, fontFamily: 'Ubuntu-Medium', color: theme.text }}>
          {isLoading ? "Loading Questions..." : "Preparing assessment..."}
        </Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.timerContainer, { backgroundColor: theme.card }]}>
          <Ionicons
            name="time-outline"
            size={20}
            color={timeLeft < 6 ? Colors.error : theme.primary}
          />
          <Text
            style={[
              styles.timerText,
              { color: theme.primary },
              timeLeft < 6 && { color: Colors.error },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {currentQuestionIndex + 1} / {questions.length}
        </Text>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: theme.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.quizContent}>
        <Text style={[styles.categoryTitle, { color: theme.primary }]}>
          {categoryTitle}
        </Text>
        <Text style={[styles.questionText, { color: theme.text }]}>
          {currentQuestion?.question}
        </Text>

        {currentQuestion?.options.map((option, index) => {
          const isCorrect = option === currentQuestion.correctAnswer;
          const isSelected = option === selectedOption;

          let buttonStyle = [
            styles.optionBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ];
          let textStyle = [styles.optionText, { color: theme.text }];

          if (isAnswered) {
            if (isCorrect) {
              buttonStyle = [styles.optionBtn, styles.correctOption];
              textStyle = [styles.optionText, { color: '#fff' }];
            } else if (isSelected) {
              buttonStyle = [styles.optionBtn, styles.wrongOption];
              textStyle = [styles.optionText, { color: '#fff' }];
            }
          } else if (isSelected) {
            buttonStyle = [
              styles.optionBtn,
              styles.selectedOption,
              {
                borderColor: theme.primary,
                backgroundColor: isDarkMode ? '#1E293B' : '#E0E7FF',
              },
            ];
          }

          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleOptionPress(option)}
              disabled={isAnswered}
            >
              <Text style={textStyle}>{option}</Text>
              {isAnswered && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isAnswered && (
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentQuestionIndex === questions.length - 1
              ? "View Results"
              : "Next Question"}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  progressText: { fontFamily: 'Ubuntu-Medium' },
  progressBarBg: { height: 6, borderRadius: 3, marginHorizontal: 20 },
  progressBarFill: { height: 6, borderRadius: 3 },
  quizContent: { padding: 25, marginTop: 10 },
  categoryTitle: {
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 8,
    fontSize: 14,
    letterSpacing: 1,
  },
  questionText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 24,
    marginBottom: 30,
    lineHeight: 32,
    textAlign: 'center',
  },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  selectedOption: { borderWidth: 1.5 },
  correctOption: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  wrongOption: { backgroundColor: Colors.error, borderColor: Colors.error },
  optionText: { fontFamily: 'Ubuntu-Medium', fontSize: 16 },
  nextBtn: {
    position: 'absolute',
    bottom: 40,
    left: 25,
    right: 25,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nextBtnText: { color: '#fff', fontFamily: 'Ubuntu-Bold', fontSize: 18 },
});