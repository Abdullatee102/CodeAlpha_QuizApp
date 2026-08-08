import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const notifyAchievement = async (title, desc) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Achievement Unlocked! 🏆",
      body: `You've earned the "${title}" badge!`,
      data: { url: '/(profile)/achievements' },
    },
    trigger: null,
  });
};

export const useQuizStore = create(
  persist(
    (set, get) => ({
      // --- ACTIVE SESSION STATE ---
      activeSessionId: null,
      questions: [],
      currentCategory: null,
      currentQuestionIndex: 0,
      score: 0,
      timeLeft: 20,
      isFinished: false,
      results: { correct: 0, wrong: 0, history: [] },

      // --- PERSISTENT USER DATA ---
      unlockedAchievements: [],
      totalScore: 0,
      streak: 0,
      lastPlayedDate: null,
      allTimeHistory: [],

      // --- START NEW QUIZ SESSION ---
      startQuiz: (categoryId, questionsData) => {
        set({
          activeSessionId: `${categoryId}_${Date.now()}`,
          currentCategory: categoryId,
          questions: questionsData,
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [] },
        });
      },

      // --- ABANDON / CLEAR ACTIVE QUIZ ---
      abandonQuiz: () => {
        set({
          activeSessionId: null,
          questions: [],
          currentCategory: null,
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [] },
        });
      },

      // --- ACCOUNT SWITCHING CLEARER ---
      clearUserSession: () =>
        set({
          activeSessionId: null,
          questions: [],
          currentCategory: null,
          currentQuestionIndex: 0,
          score: 0,
          totalScore: 0,
          streak: 0,
          lastPlayedDate: null,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [] },
        }),

      // --- HYDRATE USER STATS ON LOGIN ---
      hydrateUserStats: (profileData) => {
        if (!profileData) return;
        set({
          totalScore: profileData.totalScore || 0,
          streak: profileData.streak || 0,
          lastPlayedDate: profileData.lastPlayedDate || null,
        });
      },

      // --- ACHIEVEMENT LOGIC ---
      checkAchievements: (userId) => {
        if (!userId) return;
        const { allTimeHistory, totalScore, streak, unlockedAchievements } = get();

        const userHistory = allTimeHistory.filter((q) => q.userId === userId);
        const userAchievements =
          unlockedAchievements.find((ua) => ua.userId === userId)?.achievementIds || [];

        const achievementsList = [
          { id: '1', title: 'Fast Learner', desc: 'Complete 5 quizzes', condition: userHistory.length >= 5 },
          { id: '2', title: 'Perfect Score', desc: 'Get 100% in any quiz', condition: userHistory.some((q) => q.score === 100) },
          { id: '3', title: 'Scholar Status', desc: 'Reach 1000 Total Pts', condition: totalScore >= 1000 },
          { id: '4', title: 'Math Master', desc: '10 Math quizzes', condition: userHistory.filter((q) => q.category === 'maths').length >= 10 },
          { id: '5', title: 'Consistency', desc: '7-day streak', condition: streak >= 7 },
          {
            id: '6',
            title: 'Night Owl',
            desc: 'Quiz after 10PM',
            condition: userHistory.some((q) => {
              const dateSource = q.date || q.timestamp;
              if (!dateSource) return false;
              const hour = new Date(dateSource).getHours();
              return hour >= 22 || hour <= 4;
            }),
          },
        ];

        let updatedIds = [...userAchievements];
        let hasNewUnlocks = false;

        achievementsList.forEach((ach) => {
          if (ach.condition && !updatedIds.includes(ach.id)) {
            notifyAchievement(ach.title, ach.desc);
            updatedIds.push(ach.id);
            hasNewUnlocks = true;
          }
        });

        if (hasNewUnlocks) {
          const otherUsersAchievements = unlockedAchievements.filter((ua) => ua.userId !== userId);
          set({
            unlockedAchievements: [
              ...otherUsersAchievements,
              { userId, achievementIds: updatedIds },
            ],
          });
        }
      },

      // --- ANSWER SUBMISSION ---
      submitAnswer: (selectedOption, userId) => {
        const {
          questions,
          currentQuestionIndex,
          results,
          score,
          totalScore,
          allTimeHistory,
          currentCategory,
          streak,
          lastPlayedDate,
          activeSessionId,
        } = get();

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const updatedResults = {
          correct: isCorrect ? results.correct + 1 : results.correct,
          wrong: !isCorrect ? results.wrong + 1 : results.wrong,
          history: [
            ...results.history,
            { questionId: currentQuestion.id, selectedOption, isCorrect },
          ],
        };

        const newScore = isCorrect ? score + 10 : score;

        set({
          results: updatedResults,
          score: newScore,
          totalScore: isCorrect ? totalScore + 10 : totalScore,
        });

        if (currentQuestionIndex + 1 < questions.length) {
          set({ currentQuestionIndex: currentQuestionIndex + 1, timeLeft: 20 });
        } else {
          const today = new Date().toDateString();
          let newStreak = streak;

          if (lastPlayedDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            newStreak = lastPlayedDate === yesterday.toDateString() ? streak + 1 : 1;
          }

          const calculatedScore = Number(
            ((updatedResults.correct / questions.length) * 100).toFixed(2)
          );

          const sessionSummary = {
            id: activeSessionId || Date.now().toString(),
            userId: userId || 'anonymous',
            date: new Date().toISOString(),
            score: calculatedScore,
            category: currentCategory,
            totalQuestions: questions.length,
            correct: updatedResults.correct,
            timestamp: new Date().toISOString(),
          };

          set({
            isFinished: true,
            allTimeHistory: [sessionSummary, ...allTimeHistory],
            streak: newStreak,
            lastPlayedDate: today,
          });

          get().checkAchievements(userId);
        }
      },

      tick: (userId) => {
        const { timeLeft, isFinished } = get();
        if (isFinished) return;
        if (timeLeft > 0) set({ timeLeft: timeLeft - 1 });
        else get().submitAnswer(null, userId);
      },

      resetQuiz: () =>
        set({
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [] },
        }),
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unlockedAchievements: state.unlockedAchievements,
        allTimeHistory: state.allTimeHistory,
        totalScore: state.totalScore,
        streak: state.streak,
        lastPlayedDate: state.lastPlayedDate,
      }),
    }
  )
);