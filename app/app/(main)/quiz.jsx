import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { QUIZ_DATA } from '../../data/questions';
import { useQuizStore } from '../../store/quizStore';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function QuizScreen() {
  const { categoryId, categoryTitle } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { theme, isDarkMode } = useThemeStore();

  const {
    startQuiz,
    abandonQuiz,
    submitAnswer,
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

  // 1. Initialize Fresh Quiz Instance on Navigation
  useEffect(() => {
    let isMounted = true;
    const rawQuestions = QUIZ_DATA[categoryId] || [];

    if (rawQuestions.length > 0) {
      startQuiz(categoryId, rawQuestions);
      if (isMounted) setIsLoading(false);

      setTimeout(() => {
        Alert.alert(
          "Fair Play Rules 🛡️",
          `Leaving this screen clears progress.\nSwitching apps or minimizing terminates the quiz.\nScores are only saved on completion.`,
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
      Alert.alert("Error", "No questions found for this category.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }

    return () => {
      isMounted = false;
      abandonQuiz();
    };
  }, [categoryId]);

  // 2. Anti-Cheat Hook
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

  // 3. Navigation Guard
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

  // 4. Timer Logic
  useEffect(() => {
    if (isAnswered || isFinished || !isStarted) return;

    if (timeLeft === 0) {
      handleAutoSkip();
      return;
    }

    const timer = setInterval(() => {
      tick(user?.uid);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isFinished, isStarted, user]);

  // 5. Progress Bar Animation
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
    setIsAnswered(true);
    setSelectedOption('timeout');
    submitAnswer(null, user?.uid);
  };

  const handleOptionPress = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    submitAnswer(option, user?.uid);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const handleDownloadReport = async (finalScore) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { color: #4F46E5; text-align: center; }
            .score-box { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 20px; background: #F3F4F6; borderRadius: 8px; }
            .details { margin-top: 30px; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>BrainBuzz Quiz Report Card</h1>
          <div class="score-box">
            Category: ${categoryTitle}<br/>
            Final Score: ${finalScore} XP 🎉
          </div>
          <div class="details">
            <p><strong>Player Name:</strong> ${profile?.fullName || user?.email || 'Player'}</p>
            <p><strong>Date Attempted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
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

    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { totalScore: increment(finalScore) });
      } catch (error) {
        console.error("Sync Error:", error);
      }
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
    justify: 'space-between',
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