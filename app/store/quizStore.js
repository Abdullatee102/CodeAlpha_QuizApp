import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
 
// Notification handling...
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
      // --- STATE ---
      questions: [],
      unlockedAchievements: [], 
      currentCategory: null,
      currentQuestionIndex: 0,
      score: 0,
      totalScore: 0, 
      timeLeft: 20, 
      isFinished: false,
      streak: 0,
      lastPlayedDate: null,
      results: { correct: 0, wrong: 0, history: [] },
      allTimeHistory: [], 

      // --- ACHIEVEMENT LOGIC ---
      checkAchievements: () => {
        const { allTimeHistory, totalScore, streak, unlockedAchievements } = get();
        
        const achievementsList = [
          { id: '1', title: 'Fast Learner', desc: 'Complete 5 quizzes', condition: allTimeHistory.length >= 5 },
          { id: '2', title: 'Perfect Score', desc: 'Get 100% in any quiz', condition: allTimeHistory.some(q => q.score === 100) },
          { id: '3', title: 'Scholar Status', desc: 'Reach 1000 Total Pts', condition: totalScore >= 1000 },
          { id: '4', title: 'Math Master', desc: '10 Math quizzes', condition: allTimeHistory.filter(q => q.category === 'maths').length >= 10 },
          { id: '5', title: 'Consistency', desc: '7-day streak', condition: streak >= 7 },
          { id: '6', title: 'Night Owl', desc: 'Quiz after 10PM', condition: allTimeHistory.some(q => {
              const hour = new Date(q.timestamp).getHours();
              return hour >= 22 || hour <= 4;
            }) 
          },
        ];

        achievementsList.forEach(ach => {
          if (ach.condition && !unlockedAchievements.includes(ach.id)) {
            notifyAchievement(ach.title, ach.desc);
            set(state => ({
              unlockedAchievements: [...state.unlockedAchievements, ach.id]
            }));
          }
        });
      },

      // --- ACTIONS ---
      setQuestions: (data, categoryId) => set({ 
        questions: data, 
        currentCategory: categoryId, 
        currentQuestionIndex: 0, 
        score: 0, 
        isFinished: false,
        timeLeft: 20,
        results: { correct: 0, wrong: 0, history: [] } 
      }),

      submitAnswer: (selectedOption) => {
        const { questions, currentQuestionIndex, results, score, totalScore, allTimeHistory, currentCategory, streak, lastPlayedDate } = get();
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const updatedResults = {
          correct: isCorrect ? results.correct + 1 : results.correct,
          wrong: !isCorrect ? results.wrong + 1 : results.wrong,
          history: [...results.history, { questionId: currentQuestion.id, selectedOption, isCorrect }]
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
            newStreak = (lastPlayedDate === yesterday.toDateString()) ? streak + 1 : 1;
          }

          const sessionSummary = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            score: (updatedResults.correct / questions.length) * 100, 
            category: currentCategory, 
            totalQuestions: questions.length,
            correct: updatedResults.correct,
            timestamp: new Date().toISOString()
          };

          set({ 
            isFinished: true,
            allTimeHistory: [sessionSummary, ...allTimeHistory],
            streak: newStreak,
            lastPlayedDate: today
          });

          get().checkAchievements();
        }
      },

      tick: () => {
        const { timeLeft, isFinished } = get();
        if (isFinished) return;
        if (timeLeft > 0) set({ timeLeft: timeLeft - 1 });
        else get().submitAnswer(null); 
      },

      resetQuiz: () => set({
        currentQuestionIndex: 0,
        score: 0,
        timeLeft: 20,
        isFinished: false,
        results: { correct: 0, wrong: 0, history: [] }
      })
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);