import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import { mmkvStorage } from '../utils/mmkvStorage';
import api from '../data/api';
import formatAxiosError from '../data/formatError';

const createTheoryGradingState = () => ({
  status: 'idle',
  score: 0,
  maxScore: 10,
  correct: false,
  feedback: '',
  answer: '',
});

const createResultsState = () => ({
  correct: 0,
  wrong: 0,
  history: [],
  totalScore: 0,
  percentage: 0,
});

export const useQuizStore = create(
  persist(
    (set, get) => ({
      // =====================================================
      // QUIZ SESSION STATE
      // =====================================================

      activeSessionId: null,

      questions: [],

      currentCourseId: null,

      currentCategory: null,

      // CBT or theory
      currentQuizType: 'cbt',

      currentQuestionIndex: 0,

      // This is now the SERVER-GRADED score in POINTS.
      score: 0,

      /*
       * IMPORTANT:
       *
       * Quiz timing is NOT managed by this store.
       *
       * QuizScreen owns the assessment countdown:
       *
       * CBT:
       *   30 seconds × number of questions
       *
       * Theory:
       *   100 seconds × number of questions
       *
       * The timer continues as one global assessment timer
       * while the user moves between questions.
       *
       * Do NOT add a per-question timer here.
       */

      isFinished: false,

      // =====================================================
      // ANSWERS
      // =====================================================

      /*
       * Every question in the quiz is represented here.
       *
       * Example:
       *
       * [
       *   {
       *     questionId: 'uuid-1',
       *     answer: 'Option A'
       *   },
       *   {
       *     questionId: 'uuid-2',
       *     answer: ''
       *   }
       * ]
       *
       * The backend uses these answers to perform the
       * actual grading.
       */
      answers: [],

      // =====================================================
      // SERVER GRADING RESULT
      // =====================================================

      /*
       * This is populated only after the backend grades
       * the complete quiz.
       *
       * The frontend does NOT calculate the score itself.
       *
       * score      = points
       * percentage = percentage representation
       */
      serverGrading: null,

      results: createResultsState(),

      // =====================================================
      // LEGACY THEORY GRADING STATE
      // =====================================================

      /*
       * Kept for compatibility with any existing screen/store
       * references.
       *
       * The new backend flow does NOT grade theory questions
       * individually anymore.
       */
      theoryGrading: createTheoryGradingState(),

      isLoading: false,

      error: null,

      // =====================================================
      // HIERARCHICAL CURRICULUM STATES
      // =====================================================

      faculties: [],

      departments: [],

      courses: [],

      isLoadingFaculties: false,

      isLoadingDepartments: false,

      isLoadingCourses: false,

      // =====================================================
      // USER STATS
      // =====================================================

      totalQuizzesTaken: 0,

      totalCorrectAnswers: 0,

      badges: [],

      allTimeHistory: [],

      unlockedAchievements: [],

      // =====================================================
      // HYDRATE USER STATS
      // =====================================================

      hydrateUserStats: (profileData) => {
        if (!profileData) return;

        const rawHistory =
          profileData.allTimeHistory ||
          profileData.history ||
          [];

        const normalizedHistory =
          rawHistory.map((item) => ({
            ...item,

            correct:
              item.correct ??
              item.correctAnswers ??
              0,

            correctAnswers:
              item.correctAnswers ??
              item.correct ??
              0,

            quizType:
              item.quizType ??
              item.type ??
              'cbt',
          }));

        set({
          totalQuizzesTaken:
            profileData.totalQuizzesTaken ||
            profileData.quizzesCompleted ||
            0,

          totalCorrectAnswers:
            profileData.totalCorrectAnswers ||
            profileData.totalCorrect ||
            0,

          badges:
            profileData.badges ||
            [],

          allTimeHistory:
            normalizedHistory,

          unlockedAchievements:
            profileData.unlockedAchievements ||
            [],
        });
      },

      // =====================================================
      // FETCH QUIZ HISTORY
      // =====================================================

      fetchQuizHistory: async () => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response =
            await api.get(
              '/auth/quiz-history'
            );

          const rawHistory =
            response.data?.data ||
            response.data ||
            [];

          const normalizedHistory =
            rawHistory.map((item) => ({
              ...item,

              correct:
                item.correct ??
                item.correctAnswers ??
                0,

              correctAnswers:
                item.correctAnswers ??
                item.correct ??
                0,

              quizType:
                item.quizType ??
                item.type ??
                'cbt',
            }));

          set({
            allTimeHistory:
              normalizedHistory,

            isLoading: false,
          });

          return {
            success: true,
            data: normalizedHistory,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error: formatted.message,
          });

          return {
            success: false,
            error: formatted.message,
          };
        }
      },

      // =====================================================
      // ADD QUIZ HISTORY LOCALLY
      // =====================================================

      /*
       * This is now called using the SERVER result.
       *
       * It should never be used to calculate the score.
       */
      addQuizHistory: (quizData) => {
        const {
          allTimeHistory,
        } = get();

        const correctCount =
          quizData.correct ??
          quizData.correctAnswers ??
          0;

        const quizType =
          (
            quizData.quizType ||
            quizData.type ||
            'cbt'
          ).toLowerCase();

        const category =
          quizData.category ||
          'General';

        const totalQuestions =
          Number(
            quizData.totalQuestions ||
              0
          );

        const score =
          Number(
            quizData.score || 0
          );

        /*
         * Prefer the percentage returned by
         * the backend.
         *
         * The fallback uses the point score
         * because score is stored as points.
         */
        const percentage =
          quizData.percentage !==
            undefined &&
          quizData.percentage !==
            null
            ? Number(
                quizData.percentage
              )
            : totalQuestions > 0
              ? Number(
                  (
                    (score /
                      (totalQuestions *
                        10)) *
                    100
                  ).toFixed(2)
                )
              : 0;

        const standardizedEntry = {
          id:
            quizData.id ||
            Math.random().toString(),

          userId:
            quizData.userId ||
            'synced',

          courseId:
            quizData.courseId ||
            null,

          score,

          percentage,

          correct:
            correctCount,

          correctAnswers:
            correctCount,

          totalQuestions,

          category,

          quizType,

          date:
            quizData.createdAt ||
            quizData.date ||
            new Date().toISOString(),

          timestamp:
            quizData.createdAt
              ? new Date(
                  quizData.createdAt
                ).getTime()
              : Date.now(),
        };

        /*
         * Prevent accidental duplicate insertion when the
         * backend response is already present in history.
         */
        const alreadyExists =
          standardizedEntry.id &&
          allTimeHistory.some(
            (item) =>
              item.id ===
              standardizedEntry.id
          );

        if (alreadyExists) {
          return;
        }

        set({
          allTimeHistory: [
            standardizedEntry,
            ...allTimeHistory,
          ],
        });
      },

      // =====================================================
      // APPLY SERVER GRADING
      // =====================================================

      applyServerGrading: (
        gradingResponse
      ) => {
        if (!gradingResponse) {
          return;
        }

        const grading =
          gradingResponse.grading ||
          gradingResponse.data?.grading ||
          gradingResponse;

        const history =
          gradingResponse.data ||
          gradingResponse.history ||
          null;

        /*
         * IMPORTANT:
         *
         * score is POINTS, not percentage.
         *
         * Example:
         *
         * 10 questions:
         * 100% = 100 points
         * 75%  = 75 points
         * 50%  = 50 points
         */
        const score =
          Number(
            grading?.score ??
              history?.score ??
              0
          );

        const totalQuestions =
          Number(
            grading?.totalQuestions ??
              history?.totalQuestions ??
              0
          );

        const percentage =
          grading?.percentage !==
            undefined &&
          grading?.percentage !==
            null
            ? Number(
                grading.percentage
              )
            : history?.percentage !==
                  undefined &&
              history?.percentage !==
                null
              ? Number(
                  history.percentage
                )
              : totalQuestions > 0
                ? Number(
                    (
                      (score /
                        (totalQuestions *
                          10)) *
                      100
                    ).toFixed(2)
                  )
                : 0;

        const correctAnswers =
          Number(
            grading?.correctAnswers ??
              history?.correctAnswers ??
              0
          );

        const wrongAnswers =
          Number(
            grading?.wrongAnswers ??
              Math.max(
                0,
                totalQuestions -
                  correctAnswers
              )
          );

        set({
          score,

          serverGrading: {
            ...grading,

            score,

            percentage,

            correctAnswers,

            totalQuestions,

            wrongAnswers,
          },

          results: {
            correct:
              correctAnswers,

            wrong:
              wrongAnswers,

            history:
              grading?.results ||
              [],

            totalScore:
              score,

            percentage,
          },

          isFinished: true,
        });

        /*
         * Save the exact server-generated history record
         * locally for immediate UI updates.
         */
        if (history) {
          get().addQuizHistory({
            ...history,

            percentage:
              history.percentage ??
              percentage,
          });
        }
      },

      // =====================================================
      // FETCH FACULTIES
      // =====================================================

      fetchFaculties: async (force = false) => {
        const existing = get().faculties;
        if (!force && Array.isArray(existing) && existing.length > 0) {
          return {
            success: true,
            data: existing,
          };
        }

        set({
          isLoadingFaculties: true,
          error: null,
        });

        try {
          const response =
            await api.get(
              '/auth/faculties'
            );

          const rawFaculties =
            response.data?.data ||
            response.data?.faculties ||
            response.data ||
            [];

          const facultiesArray =
            Array.isArray(
              rawFaculties
            )
              ? rawFaculties
              : [];

          set({
            faculties:
              facultiesArray,

            isLoadingFaculties:
              false,
          });

          return {
            success: true,
            data: facultiesArray,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoadingFaculties:
              false,

            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // FETCH DEPARTMENTS
      // =====================================================

      fetchDepartments: async (
        facultyId
      ) => {
        set({
          isLoadingDepartments:
            true,

          error: null,

          departments: [],
        });

        try {
          const response =
            await api.get(
              `/auth/faculties/${facultyId}/departments`
            );

          const rawDepartments =
            response.data?.data ||
            response.data?.departments ||
            response.data ||
            [];

          const departmentsArray =
            Array.isArray(
              rawDepartments
            )
              ? rawDepartments
              : [];

          set({
            departments:
              departmentsArray,

            isLoadingDepartments:
              false,
          });

          return {
            success: true,
            data: departmentsArray,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoadingDepartments:
              false,

            error:
              formatted.message,

            departments: [],
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // FETCH COURSES
      // =====================================================

      fetchCourses: async (
        departmentId,
        level,
        semester
      ) => {
        set({
          isLoadingCourses: true,

          error: null,

          courses: [],
        });

        try {
          const params = {};

          if (
            level !== undefined
          ) {
            params.level = level;
          }

          if (semester) {
            params.semester =
              semester;
          }

          const response =
            await api.get(
              `/auth/departments/${departmentId}/courses`,
              {
                params,
              }
            );

          const rawCourses =
            response.data?.data ||
            response.data?.courses ||
            response.data ||
            [];

          const coursesArray =
            Array.isArray(
              rawCourses
            )
              ? rawCourses
              : [];

          set({
            courses:
              coursesArray,

            isLoadingCourses:
              false,
          });

          return {
            success: true,
            data: coursesArray,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoadingCourses:
              false,

            error:
              formatted.message,

            courses: [],
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // FETCH QUESTIONS
      // =====================================================

      fetchQuestions: async (
        courseId,
        type = 'cbt',
        courseCode = null
      ) => {
        const normalizedType =
          String(
            type || 'cbt'
          ).toLowerCase();

        set({
          isLoading: true,

          error: null,

          currentQuizType:
            normalizedType,

          answers: [],

          serverGrading: null,

          theoryGrading:
            createTheoryGradingState(),
        });

        try {
          const response =
            await api.get(
              `/auth/courses/${courseId}/questions`,
              {
                params: {
                  type:
                    normalizedType,
                },
              }
            );

          const rawQuestions =
            response.data?.data ||
            response.data?.questions ||
            response.data ||
            [];

          /*
           * The backend deliberately does NOT send
           * correctAnswer anymore.
           */
          const fetchedQuestions =
            JSON.parse(
              JSON.stringify(
                rawQuestions
              )
            );

          if (
            fetchedQuestions.length >
            0
          ) {
            const totalQuestions =
              fetchedQuestions.length;

            set({
              questions:
                fetchedQuestions,

              currentQuestionIndex:
                0,

              score: 0,

              isLoading: false,

              currentCourseId:
                courseId,

              currentCategory:
                String(
                  courseCode ||
                    courseId
                ).toLowerCase(),

              currentQuizType:
                normalizedType,

              activeSessionId:
                `${courseId}_${normalizedType}_${Date.now()}`,

              isFinished: false,

              answers: [],

              serverGrading: null,

              theoryGrading:
                createTheoryGradingState(),

              results:
                createResultsState(),
            });

            return {
              success: true,

              count:
                fetchedQuestions.length,

              totalQuestions,
            };
          }

          set({
            isLoading: false,

            questions: [],
          });

          return {
            success: false,
            count: 0,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,

            error:
              formatted.message,

            questions: [],
          });

          return {
            success: false,

            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // LEGACY COMPATIBILITY
      // =====================================================

      getDynamicQuestions:
        async (
          categoryId
        ) => {
          return await get()
            .fetchQuestions(
              categoryId
            );
        },

      // =====================================================
      // ACHIEVEMENTS
      // =====================================================

      fetchAchievements:
        async () => {
          set({
            isLoading: true,
            error: null,
          });

          try {
            const response =
              await api.get(
                '/auth/achievements'
              );

            const serverAchievements =
              response.data?.data ||
              response.data?.achievements ||
              response.data ||
              [];

            set({
              unlockedAchievements:
                serverAchievements,

              isLoading: false,
            });

            return {
              success: true,

              data:
                serverAchievements,
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            set({
              isLoading: false,

              error:
                formatted.message,
            });

            return {
              success: false,

              error:
                formatted.message,
            };
          }
        },

      // =====================================================
      // UNLOCK ACHIEVEMENT
      // =====================================================

      unlockAchievementBackend:
        async (
          achievementId
        ) => {
          const {
            unlockedAchievements,
          } = get();

          try {
            const response =
              await api.post(
                '/auth/achievements/unlock',
                {
                  achievementId,
                }
              );

            const updatedAchievements =
              response.data
                ?.unlockedAchievements ||
              response.data?.data ||
              [
                ...unlockedAchievements,
                achievementId,
              ];

            set({
              unlockedAchievements:
                updatedAchievements,
            });

            return {
              success: true,
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.error(
              'Failed to unlock achievement on backend:',
              formatted.message
            );

            return {
              success: false,

              error:
                formatted.message,
            };
          }
        },

      // =====================================================
      // START QUIZ
      // =====================================================

      startQuiz: (
        categoryId,
        questionsData,
        quizType = 'cbt'
      ) => {
        const normalizedType =
          String(
            quizType || 'cbt'
          ).toLowerCase();

        set({
          activeSessionId:
            `${categoryId}_${normalizedType}_${Date.now()}`,

          currentCategory:
            categoryId.toLowerCase(),

          currentCourseId: null,

          currentQuizType:
            normalizedType,

          questions:
            questionsData,

          currentQuestionIndex: 0,

          score: 0,

          isFinished: false,

          answers: [],

          serverGrading: null,

          theoryGrading:
            createTheoryGradingState(),

          results:
            createResultsState(),
        });
      },

      // =====================================================
      // ABANDON QUIZ
      // =====================================================

      abandonQuiz: () => {
        set({
          activeSessionId: null,

          questions: [],

          currentCourseId: null,

          currentCategory: null,

          currentQuizType: 'cbt',

          currentQuestionIndex: 0,

          score: 0,

          isFinished: false,

          answers: [],

          serverGrading: null,

          theoryGrading:
            createTheoryGradingState(),

          results:
            createResultsState(),

          error: null,
        });
      },

      // =====================================================
      // SUBMIT / SAVE ANSWER
      // =====================================================

      /*
       * This function DOES NOT grade anything.
       *
       * It simply creates or replaces the answer for the
       * current question.
       *
       * The last question returns isFinished=true only as a
       * signal that all questions have now been answered.
       *
       * The QuizScreen decides whether to enter review mode
       * or actually submit to the backend.
       */
      submitAnswer: async (
        selectedOption
      ) => {
        const {
          questions,
          currentQuestionIndex,
          answers,
          currentQuizType,
          currentCourseId,
          currentCategory,
        } = get();

        const currentQuestion =
          questions[
            currentQuestionIndex
          ];

        if (!currentQuestion) {
          return {
            success: false,

            isFinished: false,
          };
        }

        const answer =
          String(
            selectedOption ?? ''
          ).trim();

        const questionId =
          currentQuestion.id;

        /*
         * Replace an existing answer when the user edits
         * a previously answered question.
         */
        const existingIndex =
          answers.findIndex(
            (item) =>
              item.questionId ===
              questionId
          );

        let updatedAnswers;

        if (
          existingIndex >= 0
        ) {
          updatedAnswers = [
            ...answers,
          ];

          updatedAnswers[
            existingIndex
          ] = {
            questionId,
            answer,
          };
        } else {
          updatedAnswers = [
            ...answers,
            {
              questionId,
              answer,
            },
          ];
        }

        set({
          answers:
            updatedAnswers,
        });

        const isLastQuestion =
          currentQuestionIndex + 1 >=
          questions.length;

        if (!isLastQuestion) {
          return {
            success: true,

            isFinished: false,

            awaitingGrading: false,

            questionId,

            answer,

            answers:
              updatedAnswers,
          };
        }

        /*
         * IMPORTANT:
         *
         * Do NOT submit to the backend here.
         *
         * The user must be able to review and edit all
         * questions before final submission.
         */
        return {
          success: true,

          isFinished: true,

          awaitingGrading: true,

          questionId,

          answer,

          quizData: {
            courseId:
              currentCourseId,

            category:
              currentCategory ||
              'General',

            quizType:
              String(
                currentQuizType ||
                  'cbt'
              ).toLowerCase(),

            answers:
              updatedAnswers,

            totalQuestions:
              questions.length,
          },

          answers:
            updatedAnswers,
        };
      },

      // =====================================================
      // APPLY THEORY GRADING
      // =====================================================

      /*
       * Retained only for compatibility.
       *
       * Theory grading now happens through the final
       * backend submission.
       */
      applyTheoryGrading:
        async () => {
          return {
            success: false,

            message:
              'Theory answers are graded when the complete assessment is submitted.',
          };
        },

      // =====================================================
      // NEXT QUESTION
      // =====================================================

      /*
       * IMPORTANT:
       *
       * Navigation does NOT control the assessment timer.
       *
       * QuizScreen owns the single global assessment countdown.
       *
       * Moving to the next question must never reset a timer.
       */
      nextQuestion: () => {
        const {
          currentQuestionIndex,
          questions,
        } = get();

        if (
          currentQuestionIndex + 1 <
          questions.length
        ) {
          const nextIndex =
            currentQuestionIndex + 1;

          set({
            currentQuestionIndex:
              nextIndex,

            theoryGrading:
              createTheoryGradingState(),
          });
        }
      },

      // =====================================================
      // PREVIOUS QUESTION
      // =====================================================

      /*
       * Allows the user to move backward through the
       * assessment.
       *
       * The assessment timer remains controlled entirely
       * by QuizScreen.
       */
      previousQuestion: () => {
        const {
          currentQuestionIndex,
        } = get();

        if (
          currentQuestionIndex >
          0
        ) {
          const previousIndex =
            currentQuestionIndex - 1;

          set({
            currentQuestionIndex:
              previousIndex,

            theoryGrading:
              createTheoryGradingState(),
          });

          return true;
        }

        return false;
      },

      // =====================================================
      // GO TO SPECIFIC QUESTION
      // =====================================================

      /*
       * Used by the review screen to jump directly to any
       * question.
       *
       * The assessment timer continues independently in
       * QuizScreen.
       */
      setQuestionIndex: (
        index
      ) => {
        const {
          questions,
        } = get();

        if (
          index < 0 ||
          index >= questions.length
        ) {
          return false;
        }

        set({
          currentQuestionIndex:
            index,

          theoryGrading:
            createTheoryGradingState(),
        });

        return true;
      },

      // =====================================================
      // GET ANSWER FOR QUESTION
      // =====================================================

      getAnswerForQuestion: (
        questionId
      ) => {
        const {
          answers,
        } = get();

        const found =
          answers.find(
            (item) =>
              item.questionId ===
              questionId
          );

        return found?.answer ?? '';
      },

      // =====================================================
      // RESET QUIZ
      // =====================================================

      /*
       * Resets quiz state only.
       *
       * It does NOT create or reset a timer.
       *
       * QuizScreen initializes its own assessment timer
       * when the assessment starts.
       */
      resetQuiz: () => {
        set({
          currentQuestionIndex: 0,

          score: 0,

          isFinished: false,

          answers: [],

          serverGrading: null,

          theoryGrading:
            createTheoryGradingState(),

          results:
            createResultsState(),
        });
      },

      // =====================================================
      // CLEAR USER SESSION
      // =====================================================

      clearUserSession: () =>
        set({
          activeSessionId: null,

          questions: [],

          currentCourseId: null,

          currentCategory: null,

          currentQuizType: 'cbt',

          currentQuestionIndex: 0,

          score: 0,

          isFinished: false,

          answers: [],

          serverGrading: null,

          theoryGrading:
            createTheoryGradingState(),

          results:
            createResultsState(),

          isLoading: false,

          error: null,

          faculties: [],

          departments: [],

          courses: [],

          isLoadingFaculties: false,

          isLoadingDepartments: false,

          isLoadingCourses: false,

          totalQuizzesTaken: 0,

          totalCorrectAnswers: 0,

          badges: [],

          allTimeHistory: [],

          unlockedAchievements: [],
        }),
    }),

    // =======================================================
    // PERSISTENCE
    // =======================================================

    {
      name: 'quiz-storage',

      storage:
        createJSONStorage(
          () => mmkvStorage
        ),

      /*
       * Active quiz answers are intentionally NOT persisted.
       *
       * This prevents a partially completed assessment from
       * being restored after leaving/reopening the app.
       */
      partialize: (state) => ({
        totalQuizzesTaken:
          state.totalQuizzesTaken,

        totalCorrectAnswers:
          state.totalCorrectAnswers,

        badges:
          state.badges,

        allTimeHistory:
          state.allTimeHistory,

        unlockedAchievements:
          state.unlockedAchievements,
      }),
    }
  )
);