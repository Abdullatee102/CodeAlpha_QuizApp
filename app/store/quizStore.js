import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import api from '../data/api';
import formatAxiosError from '../data/formatError';

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
      // --- ACTIVE GAMEPLAY STATE ---
      activeSessionId: null,
      questions: [],
      currentCategory: null,
      currentQuestionIndex: 0,
      score: 0,
      timeLeft: 20,
      isFinished: false,
      results: { correct: 0, wrong: 0, history: [], totalScore: 0 },
      isLoading: false,
      error: null,

      // --- PERSISTENT USER STATS & HISTORY ---
      totalQuizzesTaken: 0,
      totalCorrectAnswers: 0,
      badges: [],
      allTimeHistory: [],        
      unlockedAchievements: [],

      hydrateUserStats: (profileData) => {
        if (!profileData) return;
        
        // Normalize incoming history items to ensure both `correct` and `correctAnswers` exist
        const rawHistory = profileData.allTimeHistory || profileData.history || [];
        const normalizedHistory = rawHistory.map(item => ({
          ...item,
          correct: item.correct ?? item.correctAnswers ?? 0,
          correctAnswers: item.correctAnswers ?? item.correct ?? 0,
        }));

        set({
          totalQuizzesTaken: profileData.totalQuizzesTaken || profileData.quizzesCompleted || 0,
          totalCorrectAnswers: profileData.totalCorrectAnswers || profileData.totalCorrect || 0,
          badges: profileData.badges || [],
          allTimeHistory: normalizedHistory,
          unlockedAchievements: profileData.unlockedAchievements || [],
        });
      },

      // --- STANDARDIZED ADD QUIZ HISTORY ACTION ---
      addQuizHistory: (quizData) => {
        const { allTimeHistory } = get();
        const correctCount = quizData.correct ?? quizData.correctAnswers ?? 0;
        
        const standardizedEntry = {
          id: quizData.id || Math.random().toString(),
          userId: quizData.userId || (api.defaults?.headers?.common['Authorization'] ? 'synced' : 'local'),
          score: quizData.score || 0,
          correct: correctCount,
          correctAnswers: correctCount,
          totalQuestions: quizData.totalQuestions || 1,
          category: (quizData.category || 'General').toLowerCase(),
          date: quizData.date || new Date().toISOString(),
          timestamp: quizData.timestamp || Date.now(),
        };

        set({ allTimeHistory: [standardizedEntry, ...allTimeHistory] });
      },

      // --- FETCH QUESTIONS FROM BACKEND (DYNAMIC ROUTE MATCHING /api/auth/:categoryId) ---
      fetchQuestions: async (categoryId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/auth/${categoryId}`);
          const rawQuestions = response.data?.data || response.data?.questions || response.data || [];

          const fetchedQuestions = JSON.parse(JSON.stringify(rawQuestions));
          
          if (fetchedQuestions.length > 0) {
            set({ 
              questions: fetchedQuestions, 
              currentQuestionIndex: 0, 
              score: 0, 
              isLoading: false,
              currentCategory: categoryId.toLowerCase(),
              activeSessionId: `${categoryId}_${Date.now()}`,
              isFinished: false,
              timeLeft: 20,
              results: { correct: 0, wrong: 0, history: [], totalScore: 0 }
            });
            return { success: true, count: fetchedQuestions.length };
          }
          
          set({ isLoading: false });
          return { success: false, count: 0 };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      // Alias for dynamic fetching clarity
      getDynamicQuestions: async (categoryId) => {
        return await get().fetchQuestions(categoryId);
      },

      // --- FETCH ACHIEVEMENTS FROM BACKEND ---
      fetchAchievements: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/auth/achievements');
          const serverAchievements = response.data?.data || response.data?.achievements || response.data || [];
          
          set({ 
            unlockedAchievements: serverAchievements,
            isLoading: false 
          });
          return { success: true, data: serverAchievements };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      // --- UNLOCK SPECIFIC ACHIEVEMENT VIA BACKEND ---
      unlockAchievementBackend: async (achievementId) => {
        const { unlockedAchievements } = get();
        try {
          const response = await api.post('/auth/achievements/unlock', { achievementId });
          const updatedAchievements = response.data?.unlockedAchievements || response.data?.data || [...unlockedAchievements, achievementId];
          
          set({ unlockedAchievements: updatedAchievements });
          return { success: true };
        } catch (err) {
          const formatted = formatAxiosError(err);
          console.error("Failed to unlock achievement on backend:", formatted.message);
          return { success: false, error: formatted.message };
        }
      },

      // --- START NEW QUIZ SESSION (LOCAL FALLBACK) ---
      startQuiz: (categoryId, questionsData) => {
        set({
          activeSessionId: `${categoryId}_${Date.now()}`,
          currentCategory: categoryId.toLowerCase(),
          questions: questionsData,
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [], totalScore: 0 },
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
          results: { correct: 0, wrong: 0, history: [], totalScore: 0 },
          error: null,
        });
      },

      // --- ANSWER SUBMISSION ---
      submitAnswer: async (selectedOption) => {
        const {
          questions,
          currentQuestionIndex,
          results,
          score,
          currentCategory,
          unlockedAchievements: existingAchievements,
          addQuizHistory,
        } = get();

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const updatedResults = {
          ...results,
          correct: isCorrect ? results.correct + 1 : results.correct,
          wrong: !isCorrect ? results.wrong + 1 : results.wrong,
          history: [
            ...results.history,
            { questionId: currentQuestion.id, selectedOption, isCorrect },
          ],
        };

        const newScore = isCorrect ? score + 10 : score;
        updatedResults.totalScore = newScore;

        set({
          results: updatedResults,
          score: newScore,
        });

        if (currentQuestionIndex + 1 >= questions.length) {
          addQuizHistory({
            score: newScore,
            correct: updatedResults.correct,
            correctAnswers: updatedResults.correct,
            totalQuestions: questions.length,
            category: currentCategory || 'General',
          });

          set({ 
            isFinished: true,
            totalQuizzesTaken: get().totalQuizzesTaken + 1,
            totalCorrectAnswers: get().totalCorrectAnswers + updatedResults.correct,
          });
          
          try {
            const response = await api.post('/auth/quiz-history', {
              score: newScore,
              totalQuestions: questions.length,
              category: (currentCategory || 'General').toLowerCase(),
              correctAnswers: updatedResults.correct,
            });

            if (response.data?.allTimeHistory) {
              const rawHistory = response.data.allTimeHistory;
              const normalizedHistory = rawHistory.map(item => ({
                ...item,
                correct: item.correct ?? item.correctAnswers ?? 0,
                correctAnswers: item.correctAnswers ?? item.correct ?? 0,
              }));
              set({ allTimeHistory: normalizedHistory });
            }

            if (response.data?.unlockedAchievements) {
              const serverAchievements = response.data.unlockedAchievements;
              const newUnlocks = serverAchievements.filter(
                (ach) => !existingAchievements.includes(ach)
              );

              for (const achievement of newUnlocks) {
                const title = typeof achievement === 'string' ? achievement : achievement.title;
                const desc = typeof achievement === 'object' ? achievement.description : '';
                await notifyAchievement(title, desc);
              }

              set({ unlockedAchievements: serverAchievements });
            }
          } catch (err) {
            console.error("Failed to sync quiz history:", err);
          }
        }
      },

      // --- NEXT QUESTION ACTION ---
      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex + 1 < questions.length) {
          set({ 
            currentQuestionIndex: currentQuestionIndex + 1, 
            timeLeft: 20 
          });
        }
      },

      tick: () => {
        const { timeLeft, isFinished } = get();
        if (isFinished) return;
        if (timeLeft > 0) set({ timeLeft: timeLeft - 1 });
        else get().submitAnswer(null);
      },

      resetQuiz: () =>
        set({
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [], totalScore: 0 },
        }),

      // --- CLEAR USER SESSION (LOGOUT CLEANUP) ---
      clearUserSession: () =>
        set({
          activeSessionId: null,
          questions: [],
          currentCategory: null,
          currentQuestionIndex: 0,
          score: 0,
          timeLeft: 20,
          isFinished: false,
          results: { correct: 0, wrong: 0, history: [], totalScore: 0 },
          isLoading: false,
          error: null,
          totalQuizzesTaken: 0,
          totalCorrectAnswers: 0,
          badges: [],
          allTimeHistory: [],
          unlockedAchievements: [],
        }),
    }),
    {
      name: 'quiz-storage', 
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalQuizzesTaken: state.totalQuizzesTaken,
        totalCorrectAnswers: state.totalCorrectAnswers,
        badges: state.badges,
        allTimeHistory: state.allTimeHistory,
        unlockedAchievements: state.unlockedAchievements,
      }),
    }
  )
);