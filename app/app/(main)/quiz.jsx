import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  AppState,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useLocalSearchParams,
  useRouter,
  useNavigation,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

import { useQuizStore } from '../../store/quizStore';

import { useAuthStore } from '../../store/authStore';

import { useThemeStore } from '../../store/themeStore';

import { useSubmitQuizMutation } from '../../hooks/useSubmitQuizMutation';

import * as Print from 'expo-print';

import * as Sharing from 'expo-sharing';

import { quizReportHTML } from '../../components/ui/quizReport';

const CBT_SECONDS_PER_QUESTION = 30;

const THEORY_SECONDS_PER_QUESTION = 100;

export default function QuizScreen() {
  const {
    courseId,
    courseTitle,
    courseCode,
    departmentName,
    level,
    semester,
    quizType,
  } = useLocalSearchParams();

  console.log(
    '===================================='
  );

  console.log(
    '[QUIZ SCREEN] ROUTE PARAMS'
  );

  console.log(
    'courseId:',
    courseId
  );

  console.log(
    'courseCode:',
    courseCode
  );

  console.log(
    'courseTitle:',
    courseTitle
  );

  console.log(
    'quizType:',
    quizType
  );

  console.log(
    '===================================='
  );

  const router = useRouter();

  const navigation = useNavigation();

  const user = useAuthStore(
    (state) => state.user
  );

  const profile = useAuthStore(
    (state) => state.profile
  );

  const fetchProfile = useAuthStore(
    (state) => state.fetchProfile
  );

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  const {
    fetchQuestions,
    abandonQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    setQuestionIndex,
    isFinished,
    questions,
    currentQuestionIndex,
    currentQuizType,
    serverGrading,
    applyServerGrading,
    answers,
    questionTimes,
  } = useQuizStore();

  const {
    mutateAsync: submitQuiz,
  } = useSubmitQuizMutation();

  const resolvedCourseId =
    Array.isArray(courseId)
      ? courseId[0]
      : courseId;

  const resolvedQuizType =
    String(
      Array.isArray(quizType)
        ? quizType[0]
        : quizType || 'cbt'
    ).toLowerCase();

  const isTheory =
    resolvedQuizType === 'theory';

  const secondsPerQuestion =
    isTheory
      ? THEORY_SECONDS_PER_QUESTION
      : CBT_SECONDS_PER_QUESTION;

  const [isStarted, setIsStarted] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isPreparing,
    setIsPreparing,
  ] = useState(true);

  const [
    noCourse,
    setNoCourse,
  ] = useState(false);

  const [
    noQuestions,
    setNoQuestions,
  ] = useState(false);

  const [
    selectedOption,
    setSelectedOption,
  ] = useState(null);

  const [
    theoryAnswer,
    setTheoryAnswer,
  ] = useState('');

  const [
    isAnswered,
    setIsAnswered,
  ] = useState(false);

  const [
    isReviewing,
    setIsReviewing,
  ] = useState(false);

  const [
    isEditingReview,
    setIsEditingReview,
  ] = useState(false);

  const [
    isSubmittingFinalQuiz,
    setIsSubmittingFinalQuiz,
  ] = useState(false);

  const [
    isResultShown,
    setIsResultShown,
  ] = useState(false);

  /*
   * =========================================================
   * GLOBAL ASSESSMENT TIMER
   * =========================================================
   *
   * This is intentionally local to the QuizScreen.
   *
   * CBT:
   *   30 seconds × number of questions
   *
   * Theory:
   *   100 seconds × number of questions
   *
   * The timer is ONE continuous timer for the entire
   * assessment. It does not reset between questions.
   *
   * It continues while:
   *
   *   active question -> YES
   *   review          -> YES
   *   moving forward  -> YES
   *   moving backward -> YES
   *
   * It stops permanently at 00:00.
   */
  const [
    assessmentTimeLeft,
    setAssessmentTimeLeft,
  ] = useState(0);

  /*
   * Local theory-answer drafts used while the user is editing
   * answers directly inside the vertical review list.
   *
   * Key = question ID
   * Value = current text
   */
  const [
    reviewDrafts,
    setReviewDrafts,
  ] = useState({});

  const progressAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const appState =
    useRef(
      AppState.currentState
    );

  const hasSubmittedQuiz =
    useRef(false);

  const pendingQuizDataRef =
    useRef(null);

  const initializationTimeoutRef =
    useRef(null);

  /*
   * Prevent multiple time-expiry handlers from running.
   */
  const hasHandledTimeExpiry =
    useRef(false);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatDuration = (
    seconds
  ) => {
    const safeSeconds =
      Math.max(
        0,
        Number(seconds) || 0
      );

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(
      minutes
    ).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  // =========================================================
  // TOTAL ASSESSMENT TIME
  // =========================================================

  const getTotalAssessmentSeconds =
    (questionCount) => {
      return (
        Number(questionCount || 0) *
        secondsPerQuestion
      );
    };

  // =========================================================
  // INITIALIZE ASSESSMENT
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const initializeQuiz =
      async () => {
        /*
         * Always abandon any previous quiz session before
         * initializing this one.
         */
        abandonQuiz();

        setIsStarted(false);

        setIsPreparing(true);

        setNoCourse(false);

        setNoQuestions(false);

        setSelectedOption(null);

        setTheoryAnswer('');

        setIsAnswered(false);

        setIsReviewing(false);

        setIsEditingReview(false);

        setIsSubmittingFinalQuiz(
          false
        );

        setIsResultShown(false);

        setReviewDrafts({});

        /*
         * Reset the local assessment timer before loading
         * the new assessment.
         */
        setAssessmentTimeLeft(0);

        hasSubmittedQuiz.current =
          false;

        hasHandledTimeExpiry.current =
          false;

        pendingQuizDataRef.current =
          null;

        if (!resolvedCourseId) {
          if (isMounted) {
            setIsLoading(false);

            setIsPreparing(false);

            setNoCourse(true);
          }

          return;
        }

        if (
          resolvedQuizType !==
            'cbt' &&
          resolvedQuizType !==
            'theory'
        ) {
          if (isMounted) {
            setIsLoading(false);

            setIsPreparing(false);

            setNoQuestions(true);
          }

          return;
        }

        setIsLoading(true);

        let res = {
          success: false,
        };

        try {
          const timeoutPromise =
            new Promise(
              (_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        'Network timeout'
                      )
                    ),
                  10000
                )
            );

          res =
            await Promise.race([
              fetchQuestions(
                resolvedCourseId,
                resolvedQuizType,
                Array.isArray(
                  courseCode
                )
                  ? courseCode[0]
                  : courseCode
              ),

              timeoutPromise,
            ]);
        } catch (err) {
          console.warn(
            'Fetch questions timed out or failed:',
            err
          );
        }

        if (!isMounted) {
          return;
        }

        const currentQuestions =
          useQuizStore.getState()
            .questions;

        const finalQuestionsCount =
          currentQuestions.length;

        if (
          res?.success &&
          finalQuestionsCount > 0
        ) {
          setIsLoading(false);

          /*
           * =====================================================
           * IMPORTANT:
           *
           * Calculate the TOTAL assessment time from the actual
           * number of questions returned by the server.
           *
           * CBT:
           *   5 questions × 30 seconds = 150 seconds = 02:30
           *
           * THEORY:
           *   5 questions × 100 seconds = 500 seconds = 08:20
           * =====================================================
           */
          const totalAssessmentSeconds =
            getTotalAssessmentSeconds(
              finalQuestionsCount
            );

          /*
           * Initialize the local global timer.
           *
           * The timer will NOT start counting down yet.
           * It starts only after the user presses
           * "I Understand, Start".
           */
          setAssessmentTimeLeft(
            totalAssessmentSeconds
          );

          /*
           * Keep preparation visible underneath
           * the Fair Play alert.
           */
          setIsPreparing(true);

          initializationTimeoutRef.current =
            setTimeout(() => {
              if (!isMounted) {
                return;
              }

              const currentState =
                useQuizStore.getState();

              const questionCount =
                currentState.questions
                  .length;

              const totalSeconds =
                getTotalAssessmentSeconds(
                  questionCount
                );

              Alert.alert(
                'Fair Play Rules 🛡️',

                `${
                  isTheory
                    ? 'Theory Assessment'
                    : 'Computer Based Test'
                }\n\n` +
                  `Questions: ${questionCount}\n` +
                  `Time per question: ${secondsPerQuestion} seconds\n` +
                  `Total assessment time: ${formatDuration(
                    totalSeconds
                  )}\n\n` +
                  `1. Leaving this screen clears your progress.\n` +
                  `2. Switching apps or minimizing terminates the assessment.\n` +
                  `3. The timer is one continuous assessment timer.\n` +
                  `4. You can move backward and forward between questions.\n` +
                  `5. You can review and edit your answers before final submission.\n` +
                  `6. Your assessment is graded securely by the server only after you submit.`,

                [
                  {
                    text: 'Go Back',

                    onPress: () => {
                      abandonQuiz();

                      setAssessmentTimeLeft(
                        0
                      );

                      setIsStarted(
                        false
                      );

                      router.back();
                    },

                    style: 'cancel',
                  },

                  {
                    text:
                      'I Understand, Start',

                    onPress: () => {
                      /*
                       * The timer was already initialized with the
                       * correct total duration above.
                       *
                       * Setting isStarted to true activates the
                       * global timer effect.
                       */
                      hasHandledTimeExpiry.current =
                        false;

                      setIsPreparing(
                        false
                      );

                      setIsStarted(
                        true
                      );
                    },
                  },
                ],

                {
                  cancelable:
                    false,
                }
              );
            }, 300);
        } else {
          setIsLoading(false);

          setIsPreparing(false);

          setNoQuestions(true);
        }
      };

    initializeQuiz();

    return () => {
      isMounted = false;

      if (
        initializationTimeoutRef.current
      ) {
        clearTimeout(
          initializationTimeoutRef.current
        );
      }

      abandonQuiz();
    };
  }, [
    resolvedCourseId,
    resolvedQuizType,
  ]);

  // =========================================================
  // APP STATE / ANTI-MINIMIZE
  // =========================================================

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        (nextAppState) => {
          /*
           * Only terminate while the user is actively answering.
           *
           * Review mode is intentionally allowed to continue.
           */
          if (
            isStarted &&
            !isFinished &&
            !isReviewing &&
            appState.current ===
              'active' &&
            nextAppState.match(
              /inactive|background/
            )
          ) {
            abandonQuiz();

            setAssessmentTimeLeft(
              0
            );

            setIsStarted(false);

            setIsReviewing(false);

            setIsEditingReview(false);

            router.replace(
              '/(main)'
            );

            setTimeout(() => {
              Alert.alert(
                'Terminated',
                isTheory
                  ? 'App minimized. Theory assessment progress cleared.'
                  : 'App minimized. Quiz progress cleared.'
              );
            }, 100);
          }

          appState.current =
            nextAppState;
        }
      );

    return () =>
      subscription.remove();
  }, [
    isStarted,
    isFinished,
    isReviewing,
    isTheory,
  ]);

  // =========================================================
  // NAVIGATION PROTECTION
  // =========================================================

  useEffect(() => {
    const unsubscribe =
      navigation.addListener(
        'beforeRemove',
        (e) => {
          /*
           * Once actual grading is happening, allow the
           * navigation system to complete its existing action.
           */
          if (
            isSubmittingFinalQuiz
          ) {
            return;
          }

          /*
           * If result has already been shown, navigation is safe.
           */
          if (
            isFinished &&
            !isReviewing
          ) {
            return;
          }

          /*
           * No active assessment.
           */
          if (
            !isStarted &&
            !isReviewing
          ) {
            return;
          }

          e.preventDefault();

          Alert.alert(
            isReviewing
              ? 'Leave Assessment Review?'
              : isTheory
                ? 'Abandon Theory Assessment?'
                : 'Abandon Quiz?',

            isReviewing
              ? 'Your answers have not been submitted yet. Leaving now will clear your progress.'
              : 'Progress will be lost.',

            [
              {
                text: 'Stay',

                style: 'cancel',
              },

              {
                text: 'Leave',

                style:
                  'destructive',

                onPress: () => {
                  abandonQuiz();

                  setAssessmentTimeLeft(
                    0
                  );

                  setIsStarted(
                    false
                  );

                  setIsReviewing(
                    false
                  );

                  setIsEditingReview(
                    false
                  );

                  navigation.dispatch(
                    e.data.action
                  );
                },
              },
            ]
          );
        }
      );

    return unsubscribe;
  }, [
    navigation,
    isFinished,
    isStarted,
    isReviewing,
    isTheory,
    isSubmittingFinalQuiz,
  ]);

  // =========================================================
  // GLOBAL ASSESSMENT TIMER
  // =========================================================

  useEffect(() => {
    /*
     * IMPORTANT:
     *
     * This is ONE GLOBAL ASSESSMENT TIMER.
     *
     * It runs:
     *
     *   active assessment -> YES
     *   review            -> YES
     *   answer selected   -> STILL YES
     *   moving questions  -> STILL YES
     *
     * It does NOT reset for each question.
     *
     * It does NOT use quizStore's tick/timeLeft.
     *
     * The timer is controlled entirely by assessmentTimeLeft.
     */
    if (
      (!isStarted &&
        !isReviewing) ||
      isSubmittingFinalQuiz ||
      isResultShown
    ) {
      return;
    }

    /*
     * Time has reached zero.
     *
     * Handle expiry exactly once.
     */
    if (
      Number(assessmentTimeLeft) <=
      0
    ) {
      if (
        !hasHandledTimeExpiry.current
      ) {
        hasHandledTimeExpiry.current =
          true;

        handleTimeExpired();
      }

      return;
    }

    const timer =
      setInterval(() => {
        setAssessmentTimeLeft(
          (previousTime) =>
            Math.max(
              0,
              Number(
                previousTime
              ) - 1
            )
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    assessmentTimeLeft,
    isStarted,
    isReviewing,
    isSubmittingFinalQuiz,
    isResultShown,
  ]);

  // =========================================================
  // PROGRESS ANIMATION
  // =========================================================

  useEffect(() => {
    if (
      questions.length > 0
    ) {
      Animated.timing(
        progressAnim,
        {
          toValue:
            (currentQuestionIndex +
              1) /
            questions.length,

          duration: 500,

          useNativeDriver:
            false,
        }
      ).start();
    }
  }, [
    currentQuestionIndex,
    questions.length,
  ]);

  // =========================================================
  // LOAD CURRENT ANSWER
  // =========================================================

  useEffect(() => {
    if (
      questions.length === 0
    ) {
      return;
    }

    const currentQuestion =
      questions[
        currentQuestionIndex
      ];

    if (!currentQuestion) {
      return;
    }

    const savedAnswer =
      answers.find(
        (item) =>
          item.questionId ===
          currentQuestion.id
      )?.answer ?? '';

    if (isTheory) {
      setTheoryAnswer(
        savedAnswer
      );

      setSelectedOption(
        null
      );
    } else {
      setSelectedOption(
        savedAnswer || null
      );

      setTheoryAnswer('');
    }

    setIsAnswered(
      Boolean(savedAnswer)
    );

    /*
     * Initialize the review draft for theory questions
     * without destroying an existing local draft.
     */
    if (
      isReviewing &&
      isTheory
    ) {
      setReviewDrafts(
        (previous) => {
          if (
            Object.prototype.hasOwnProperty.call(
              previous,
              currentQuestion.id
            )
          ) {
            return previous;
          }

          return {
            ...previous,
            [currentQuestion.id]:
              savedAnswer,
          };
        }
      );
    }
  }, [
    currentQuestionIndex,
    questions,
    answers,
    isTheory,
    isReviewing,
  ]);

  // =========================================================
  // INITIALIZE REVIEW DRAFTS
  // =========================================================

  useEffect(() => {
    if (
      !isReviewing ||
      questions.length === 0
    ) {
      return;
    }

    const drafts = {};

    questions.forEach(
      (question) => {
        const savedAnswer =
          answers.find(
            (item) =>
              item.questionId ===
              question.id
          )?.answer ?? '';

        drafts[question.id] =
          savedAnswer;
      }
    );

    setReviewDrafts(
      drafts
    );
  }, [
    isReviewing,
    questions.length,
  ]);

  // =========================================================
  // BUILD CURRENT QUIZ DATA
  // =========================================================

  const buildCurrentQuizData =
    () => {
      const state =
        useQuizStore.getState();

      return {
        courseId:
          state.currentCourseId ||
          resolvedCourseId,

        category:
          state.currentCategory ||
          (Array.isArray(
            courseCode
          )
            ? courseCode[0]
            : courseCode) ||
          'General',

        quizType:
          state.currentQuizType ||
          resolvedQuizType,

        answers:
          state.answers,

        totalQuestions:
          state.questions.length,
      };
    };

  // =========================================================
  // SAVE CURRENT THEORY ANSWER
  // =========================================================

  const saveCurrentTheoryAnswer =
    async () => {
      if (!isTheory) {
        return true;
      }

      const currentQuestion =
        useQuizStore.getState()
          .questions[
          useQuizStore.getState()
            .currentQuestionIndex
        ];

      if (!currentQuestion) {
        return true;
      }

      const result =
        await submitAnswer(
          theoryAnswer.trim()
        );

      return (
        result?.success !== false
      );
    };

  // =========================================================
  // SAVE ALL REVIEW THEORY DRAFTS
  // =========================================================

  const saveAllReviewDrafts =
    async () => {
      if (!isTheory) {
        return true;
      }

      const state =
        useQuizStore.getState();

      const originalIndex =
        state.currentQuestionIndex;

      try {
        for (
          let index = 0;
          index <
          state.questions.length;
          index++
        ) {
          const question =
            state.questions[
              index
            ];

          const draft =
            reviewDrafts[
              question.id
            ];

          /*
           * Only save questions that have a local draft.
           */
          if (
            draft === undefined
          ) {
            continue;
          }

          setQuestionIndex(
            index
          );

          const result =
            await submitAnswer(
              String(
                draft ?? ''
              ).trim()
            );

          if (
            !result?.success
          ) {
            setQuestionIndex(
              originalIndex
            );

            return false;
          }
        }

        setQuestionIndex(
          Math.min(
            originalIndex,
            state.questions.length -
              1
          )
        );

        return true;
      } catch (error) {
        console.error(
          'Saving review drafts failed:',
          error
        );

        setQuestionIndex(
          Math.min(
            originalIndex,
            state.questions.length -
              1
          )
        );

        return false;
      }
    };

  // =========================================================
  // TIME EXPIRED
  // =========================================================

  const handleTimeExpired =
    async () => {
      if (
        hasSubmittedQuiz.current ||
        isSubmittingFinalQuiz
      ) {
        return;
      }

      /*
       * If theory review contains unsaved text, attempt to save
       * the drafts before locking the review.
       */
      if (isReviewing) {
        await saveAllReviewDrafts();
      } else if (isTheory) {
        await saveCurrentTheoryAnswer();
      }

      const latestData =
        buildCurrentQuizData();

      pendingQuizDataRef.current =
        latestData;

      /*
       * Keep the timer at exactly 00:00.
       */
      setAssessmentTimeLeft(0);

      setIsStarted(false);

      setIsReviewing(true);

      setIsEditingReview(false);

      Alert.alert(
        'Time Elapsed ⏰',
        'Your assessment time has ended. Your answers are now read-only. Review your answers, then submit the assessment when you are ready.',
        [
          {
            text: 'Review Answers',
            onPress: () => {
              setQuestionIndex(0);
            },
          },
        ],
        {
          cancelable:
            false,
        }
      );
    };

  // =========================================================
  // CBT ANSWER
  // =========================================================

  const handleOptionPress =
    async (option) => {
      /*
       * Once time has reached zero, the review is read-only.
       */
      if (
        Number(
          assessmentTimeLeft
        ) <= 0 ||
        isSubmittingFinalQuiz
      ) {
        return;
      }

      setSelectedOption(
        option
      );

      setIsAnswered(true);

      const result =
        await submitAnswer(
          option
        );

      if (
        !result?.success
      ) {
        setIsAnswered(false);

        return;
      }

      /*
       * IMPORTANT:
       *
       * Do NOT automatically move to the next question.
       *
       * The user controls navigation using Previous/Next.
       */
      pendingQuizDataRef.current =
        buildCurrentQuizData();
    };

  // =========================================================
  // THEORY ANSWER
  // =========================================================

  const handleTheorySubmit =
    async () => {
      if (
        Number(
          assessmentTimeLeft
        ) <= 0 ||
        isSubmittingFinalQuiz
      ) {
        return;
      }

      const trimmedAnswer =
        theoryAnswer.trim();

      /*
       * Empty answers are allowed.
       * This makes it possible to skip a question and continue.
       */
      setIsAnswered(
        Boolean(trimmedAnswer)
      );

      const result =
        await submitAnswer(
          trimmedAnswer
        );

      if (
        !result?.success
      ) {
        setIsAnswered(false);

        return;
      }

      pendingQuizDataRef.current =
        buildCurrentQuizData();
    };

  // =========================================================
  // NORMAL PREVIOUS
  // =========================================================

  const handlePrevious =
    () => {
      if (
        isSubmittingFinalQuiz ||
        questions.length === 0
      ) {
        return;
      }

      if (
        currentQuestionIndex <=
        0
      ) {
        return;
      }

      /*
       * If the current theory answer has been typed but not saved,
       * save it before moving away.
       */
      if (
        isTheory &&
        theoryAnswer.trim()
      ) {
        saveCurrentTheoryAnswer();
      }

      setIsEditingReview(
        false
      );

      previousQuestion();
    };

  // =========================================================
  // NORMAL NEXT
  // =========================================================

  const handleNext =
    async () => {
      if (
        isSubmittingFinalQuiz ||
        questions.length === 0
      ) {
        return;
      }

      /*
       * If there is text in a theory answer that has not yet been
       * saved, save it before moving forward.
       */
      if (
        isTheory &&
        theoryAnswer.trim()
      ) {
        const saved =
          await saveCurrentTheoryAnswer();

        if (!saved) {
          Alert.alert(
            'Save Failed',
            'Your current answer could not be saved. Please try again.'
          );

          return;
        }
      }

      /*
       * LAST QUESTION
       *
       * Next becomes Review & Submit.
       *
       * Absolutely NO grading happens here.
       */
      if (
        currentQuestionIndex >=
        questions.length - 1
      ) {
        startReview();

        return;
      }

      setSelectedOption(
        null
      );

      setTheoryAnswer('');

      setIsAnswered(false);

      setIsEditingReview(
        false
      );

      nextQuestion();
    };

  // =========================================================
  // START REVIEW
  // =========================================================

  const startReview =
    async () => {
      /*
       * Save any current theory text first.
       */
      if (
        isTheory &&
        theoryAnswer.trim()
      ) {
        await saveCurrentTheoryAnswer();
      }

      const latestData =
        buildCurrentQuizData();

      pendingQuizDataRef.current =
        latestData;

      setIsReviewing(true);

      setIsEditingReview(
        false
      );

      /*
       * IMPORTANT:
       *
       * Do NOT reset assessmentTimeLeft.
       *
       * The same global timer continues during review.
       */
      setIsStarted(false);

      /*
       * Start the vertical review from Q1.
       */
      setQuestionIndex(0);
    };

  // =========================================================
  // REVIEW QUESTION SELECT
  // =========================================================

  const handleReviewQuestionPress =
    (index) => {
      if (
        index < 0 ||
        index >= questions.length
      ) {
        return;
      }

      setIsEditingReview(
        false
      );

      setQuestionIndex(
        index
      );
    };

  // =========================================================
  // REVIEW CBT ANSWER
  // =========================================================

  const handleReviewOptionPress =
    async (
      questionIndex,
      option
    ) => {
      if (
        Number(
          assessmentTimeLeft
        ) <= 0 ||
        isSubmittingFinalQuiz
      ) {
        return;
      }

      /*
       * Move the store temporarily to the question being edited.
       */
      setQuestionIndex(
        questionIndex
      );

      const result =
        await submitAnswer(
          option
        );

      if (
        !result?.success
      ) {
        Alert.alert(
          'Save Failed',
          'The answer could not be updated.'
        );

        return;
      }

      setSelectedOption(
        option
      );

      setIsAnswered(true);

      pendingQuizDataRef.current =
        buildCurrentQuizData();
    };

  // =========================================================
  // REVIEW THEORY TEXT CHANGE
  // =========================================================

  const handleReviewTheoryChange =
    (
      questionId,
      text
    ) => {
      if (
        Number(
          assessmentTimeLeft
        ) <= 0
      ) {
        return;
      }

      setReviewDrafts(
        (previous) => ({
          ...previous,
          [questionId]:
            text,
        })
      );
    };

  // =========================================================
  // SAVE REVIEW THEORY ANSWER
  // =========================================================

  const handleSaveReviewTheory =
    async (
      questionIndex,
      questionId
    ) => {
      if (
        Number(
          assessmentTimeLeft
        ) <= 0 ||
        isSubmittingFinalQuiz
      ) {
        return;
      }

      const draft =
        reviewDrafts[
          questionId
        ] ?? '';

      /*
       * Move the store to the question being edited.
       */
      setQuestionIndex(
        questionIndex
      );

      const result =
        await submitAnswer(
          draft.trim()
        );

      if (
        !result?.success
      ) {
        Alert.alert(
          'Save Failed',
          'The answer could not be updated.'
        );

        return;
      }

      pendingQuizDataRef.current =
        buildCurrentQuizData();

      setIsAnswered(
        Boolean(
          draft.trim()
        )
      );

      Alert.alert(
        'Answer Updated',
        `Your answer for Question ${
          questionIndex + 1
        } has been saved.`
      );
    };

  // =========================================================
  // CONFIRM FINAL SUBMISSION
  // =========================================================

  const handleSubmitAssessment =
    async () => {
      if (
        isSubmittingFinalQuiz ||
        hasSubmittedQuiz.current
      ) {
        return;
      }

      /*
       * Save any currently edited theory answers before showing
       * the confirmation alert.
       */
      if (isTheory) {
        const saved =
          await saveAllReviewDrafts();

        if (!saved) {
          Alert.alert(
            'Save Failed',
            'Some answers could not be saved. Please try again before submitting.'
          );

          return;
        }
      }

      const latestState =
        useQuizStore.getState();

      const latestAnswers =
        latestState.answers;

      /*
       * Make sure the payload always uses the latest edited answers.
       */
      const finalQuizData = {
        courseId:
          latestState.currentCourseId ||
          resolvedCourseId,

        category:
          latestState.currentCategory ||
          (Array.isArray(
            courseCode
          )
            ? courseCode[0]
            : courseCode) ||
          'General',

        quizType:
          latestState.currentQuizType ||
          resolvedQuizType,

        answers:
          latestAnswers,

        totalQuestions:
          latestState.questions.length,
      };

      pendingQuizDataRef.current =
        finalQuizData;

      Alert.alert(
        'Submit Assessment?',

        'Once submitted, your answers will be graded by the server and you will not be able to edit them again.',

        [
          {
            text: 'Continue Reviewing',

            style: 'cancel',
          },

          {
            text: 'Submit Assessment',

            onPress: async () => {
              await submitFinalQuiz(
                finalQuizData
              );
            },
          },
        ]
      );
    };

  // =========================================================
  // FINAL SUBMISSION
  // =========================================================

  const submitFinalQuiz =
    async (
      quizData
    ) => {
      if (
        hasSubmittedQuiz.current ||
        !quizData
      ) {
        return false;
      }

      const finalQuizData = {
        courseId:
          quizData.courseId ||
          resolvedCourseId,

        category:
          quizData.category ||
          (Array.isArray(
            courseCode
          )
            ? courseCode[0]
            : courseCode) ||
          'General',

        quizType:
          quizData.quizType ||
          resolvedQuizType,

        answers:
          quizData.answers || [],
      };

      console.log(
        '===================================='
      );

      console.log(
        '[QUIZ SUBMIT] Final payload:',
        JSON.stringify(
          finalQuizData,
          null,
          2
        )
      );

      console.log(
        '===================================='
      );

      /*
       * This is the ONLY point where the assessment becomes
       * officially submitted.
       */
      hasSubmittedQuiz.current =
        true;

      setIsSubmittingFinalQuiz(
        true
      );

      try {
        const response =
          await submitQuiz(
            finalQuizData
          );

        console.log(
          '[QUIZ SUBMIT] Raw mutation response:',
          JSON.stringify(
            response,
            null,
            2
          )
        );

        /*
         * Normalize both possible mutation response shapes.
         */
        const backendResult =
          response?.data?.grading
            ? response.data
            : response;

        console.log(
          '[QUIZ SUBMIT] Normalized backend result:',
          JSON.stringify(
            backendResult,
            null,
            2
          )
        );

        const grading =
          backendResult?.grading;

        const history =
          backendResult?.data;

        console.log(
          '[QUIZ SUBMIT] Grading:',
          JSON.stringify(
            grading,
            null,
            2
          )
        );

        console.log(
          '[QUIZ SUBMIT] History:',
          JSON.stringify(
            history,
            null,
            2
          )
        );

        if (!grading) {
          throw new Error(
            'The server did not return quiz grading results.'
          );
        }

        /*
         * Store server grading result.
         */
        applyServerGrading({
          grading,
          data: history,
        });

        setIsSubmittingFinalQuiz(
          false
        );

        setIsStarted(false);

        setIsReviewing(false);

        setIsEditingReview(
          false
        );

        /*
         * Sync profile/achievements after successful submission.
         */
        try {
          await fetchProfile();
        } catch (
          profileError
        ) {
          console.error(
            'Profile sync error after quiz submission:',
            profileError
          );
        }

        console.log(
          '[QUIZ SUBMIT] Quiz submitted and processed successfully.'
        );

        return true;
      } catch (error) {
        hasSubmittedQuiz.current =
          false;

        setIsSubmittingFinalQuiz(
          false
        );

        console.error(
          '[QUIZ SUBMIT] Quiz submission failed:',
          error
        );

        Alert.alert(
          'Submission Failed',

          'Your assessment could not be submitted. Please check your connection and try again.'
        );

        return false;
      }
    };

  // =========================================================
  // DOWNLOAD REPORT
  // =========================================================

  const handleDownloadReport =
    async () => {
      const grading =
        useQuizStore.getState()
          .serverGrading;

      const correctCount =
        Number(
          grading?.correctAnswers ||
            0
        );

      const totalQuestions =
        Number(
          grading?.totalQuestions ||
            questions.length
        );

      const scorePoints =
        Number(
          grading?.score || 0
        );

      const percentage =
        Number(
          grading?.percentage || 0
        );

      const htmlContent =
        quizReportHTML({
          categoryTitle:
            `${
              Array.isArray(
                courseCode
              )
                ? courseCode[0]
                : courseCode
            } • ${resolvedQuizType.toUpperCase()}`,

          /*
           * finalScore represents POINTS.
           * percentage is passed separately.
           */
          finalScore:
            scorePoints,

          percentage,

          correctCount,

          totalQuestions,

          profile,

          user,
        });

      try {
        const { uri } =
          await Print.printToFileAsync(
            {
              html:
                htmlContent,
            }
          );

        await Sharing.shareAsync(
          uri,
          {
            UTI: '.pdf',

            mimeType:
              'application/pdf',
          }
        );
      } catch (error) {
        console.error(
          'PDF generation or sharing failed:',
          error
        );

        Alert.alert(
          'Error',

          'Could not generate report file.'
        );
      }
    };

  // =========================================================
  // FINISH QUIZ / RESULT
  // =========================================================

  const finishQuiz =
    async () => {
      const grading =
        useQuizStore.getState()
          .serverGrading;

      if (!grading) {
        Alert.alert(
          'Result Unavailable',

          'The server has not returned the grading result yet.'
        );

        return;
      }

      const finalScore =
        Number(
          grading.percentage ?? 0
        );

      const scorePoints =
        Number(
          grading.score ?? 0
        );

      const correctCount =
        Number(
          grading.correctAnswers ??
            0
        );

      const totalQuestions =
        Number(
          grading.totalQuestions ??
            questions.length
        );

      const wrongCount =
        Number(
          grading.wrongAnswers ??
            Math.max(
              0,
              totalQuestions -
                correctCount
            )
        );

      setIsResultShown(
        true
      );

      Alert.alert(
        isTheory
          ? 'Theory Assessment Completed!'
          : 'Quiz Completed!',

        `Score: ${finalScore}%\n\nPoints: ${scorePoints}/${totalQuestions * 10}\n\nCorrect: ${correctCount}/${totalQuestions}\n\nWrong: ${wrongCount}`,

        [
          {
            text:
              'Share Report',

            onPress: () =>
              handleDownloadReport(),
          },

          {
            text: 'Done',

            onPress: () => {
              abandonQuiz();

              router.replace(
                '/(main)'
              );
            },
          },
        ],

        {
          cancelable:
            false,
        }
      );
    };

  // =========================================================
  // SHOW RESULT ONCE
  // =========================================================

  useEffect(() => {
    if (
      isFinished &&
      serverGrading &&
      !isSubmittingFinalQuiz &&
      !isResultShown
    ) {
      const timeout =
        setTimeout(() => {
          finishQuiz();
        }, 300);

      return () =>
        clearTimeout(timeout);
    }
  }, [
    isFinished,
    serverGrading,
    isSubmittingFinalQuiz,
    isResultShown,
  ]);

  // =========================================================
  // INVALID COURSE STATE
  // =========================================================

  if (noCourse) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <Ionicons
          name="school-outline"
          size={52}
          color={
            theme.primary
          }
        />

        <Text
          style={[
            styles.emptyTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          No Course Selected
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Please select a course before
          opening an assessment.
        </Text>

        <TouchableOpacity
          style={[
            styles.emptyButton,
            {
              backgroundColor:
                theme.primary,
            },
          ]}
          onPress={() =>
            router.replace(
              '/(main)'
            )
          }
        >
          <Text
            style={
              styles.emptyButtonText
            }
          >
            Back to Courses
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================================================
  // NO QUESTIONS STATE
  // =========================================================

  if (noQuestions) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <Ionicons
          name="document-text-outline"
          size={52}
          color={
            theme.primary
          }
        />

        <Text
          style={[
            styles.emptyTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          No Questions Found
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          There are currently no{' '}
          {resolvedQuizType} questions
          available for{' '}
          {Array.isArray(
            courseCode
          )
            ? courseCode[0]
            : courseCode ||
              'this course'}.
        </Text>

        <TouchableOpacity
          style={[
            styles.emptyButton,
            {
              backgroundColor:
                theme.primary,
            },
          ]}
          onPress={() =>
            router.replace(
              '/(main)'
            )
          }
        >
          <Text
            style={
              styles.emptyButtonText
            }
          >
            Back to Courses
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================================================
  // LOADING / PREPARING / SUBMITTING
  // =========================================================

  if (
    isLoading ||
    isPreparing ||
    isSubmittingFinalQuiz
  ) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            theme.primary
          }
        />

        <Text
          style={[
            styles.loadingTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          {isSubmittingFinalQuiz
            ? 'Calculating Assessment...'
            : isLoading
              ? `Loading ${
                  isTheory
                    ? 'Theory'
                    : 'CBT'
                } Questions...`
              : 'Preparing assessment...'}
        </Text>

        <Text
          style={[
            styles.loadingText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {isSubmittingFinalQuiz
            ? 'Your answers are being evaluated securely by the server.'
            : isLoading
              ? 'Please wait while your assessment is prepared.'
              : questions.length > 0
                ? `${questions.length} questions • ${secondsPerQuestion} seconds per question • ${formatDuration(
                    getTotalAssessmentSeconds(
                      questions.length
                    )
                  )} total`
                : 'Preparing your assessment...'}
        </Text>
      </View>
    );
  }

  // =========================================================
  // CURRENT QUESTION
  // =========================================================

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  if (
    !currentQuestion
  ) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            theme.primary
          }
        />

        <Text
          style={[
            styles.loadingTitle,
            {
              color:
                theme.text,
            },
          ]}
        >
          Preparing assessment...
        </Text>
      </View>
    );
  }

  // =========================================================
  // CURRENT SAVED ANSWER
  // =========================================================

  const currentSavedAnswer =
    answers.find(
      (item) =>
        item.questionId ===
        currentQuestion.id
    )?.answer ?? '';

  const assessmentTimeExpired =
    Number(
      assessmentTimeLeft
    ) <= 0;

  // =========================================================
  // ACTIVE QUIZ
  // =========================================================

  if (
    isStarted &&
    !isReviewing
  ) {
    const isFirstQuestion =
      currentQuestionIndex === 0;

    const isLastQuestion =
      currentQuestionIndex ===
      questions.length - 1;

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
        <KeyboardAvoidingView
          style={
            styles.keyboardContainer
          }
          behavior={
            Platform.OS ===
            'ios'
              ? 'padding'
              : undefined
          }
        >
          {/* HEADER */}
          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              onPress={() =>
                navigation.goBack()
              }
              disabled={
                isSubmittingFinalQuiz
              }
            >
              <Ionicons
                name="close"
                size={28}
                color={
                  theme.text
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.timerContainer,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  assessmentTimeLeft <
                  10
                    ? Colors.error
                    : theme.primary
                }
              />

              <Text
                style={[
                  styles.timerText,
                  {
                    color:
                      theme.primary,
                  },

                  assessmentTimeLeft <
                    10 && {
                    color:
                      Colors.error,
                  },
                ]}
              >
                {formatDuration(
                  assessmentTimeLeft
                )}
              </Text>
            </View>

            <Text
              style={[
                styles.progressText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {currentQuestionIndex +
                1}{' '}
              /{' '}
              {questions.length}
            </Text>
          </View>

          {/* PROGRESS */}
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor:
                    theme.primary,

                  width:
                    progressAnim.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],

                        outputRange: [
                          '0%',
                          '100%',
                        ],
                      }
                    ),
                },
              ]}
            />
          </View>

          {/* QUESTION CONTENT */}
          <ScrollView
            style={
              styles.scrollView
            }
            contentContainerStyle={
              styles.scrollContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text
              style={[
                styles.courseCode,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              {Array.isArray(
                courseCode
              )
                ? courseCode[0]
                : courseCode}{' '}
              •{' '}
              {resolvedQuizType.toUpperCase()}
            </Text>

            <Text
              style={[
                styles.courseTitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {Array.isArray(
                courseTitle
              )
                ? courseTitle[0]
                : courseTitle}
            </Text>

            <Text
              style={[
                styles.quizMeta,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {level} Level •{' '}
              {semester}{' '}
              Semester
            </Text>

            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    `${theme.primary}15`,
                },
              ]}
            >
              <Ionicons
                name={
                  isTheory
                    ? 'document-text-outline'
                    : 'checkbox-outline'
                }
                size={16}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.typeBadgeText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                {isTheory
                  ? 'Theory Assessment'
                  : 'Computer Based Test'}
              </Text>
            </View>

            {/* GLOBAL TIMER INFO */}
            <View
              style={[
                styles.questionTimeInfo,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Ionicons
                name="timer-outline"
                size={18}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.questionTimeText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                {formatDuration(
                  assessmentTimeLeft
                )}{' '}
                remaining for the assessment
              </Text>
            </View>

            <Text
              style={[
                styles.questionNumber,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Question{' '}
              {currentQuestionIndex +
                1}{' '}
              of{' '}
              {questions.length}
            </Text>

            <Text
              style={[
                styles.questionText,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {
                currentQuestion.question
              }
            </Text>

            {/* THEORY */}
            {isTheory ? (
              <View>
                <Text
                  style={[
                    styles.answerLabel,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Your Answer
                </Text>

                <TextInput
                  style={[
                    styles.theoryInput,
                    {
                      color:
                        theme.text,

                      backgroundColor:
                        theme.card,

                      borderColor:
                        theme.border,
                    },
                  ]}
                  value={
                    theoryAnswer
                  }
                  onChangeText={
                    setTheoryAnswer
                  }
                  placeholder="Type your answer here..."
                  placeholderTextColor={
                    theme.textSecondary
                  }
                  multiline
                  textAlignVertical="top"
                  editable={
                    !assessmentTimeExpired &&
                    !isSubmittingFinalQuiz
                  }
                />

                {!assessmentTimeExpired && (
                  <TouchableOpacity
                    style={[
                      styles.submitAnswerBtn,
                      {
                        backgroundColor:
                          theme.primary,
                      },
                    ]}
                    onPress={
                      handleTheorySubmit
                    }
                    disabled={
                      isSubmittingFinalQuiz
                    }
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={19}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.submitAnswerText
                      }
                    >
                      {isAnswered
                        ? 'Update Answer'
                        : 'Save Answer'}
                    </Text>
                  </TouchableOpacity>
                )}

                {isAnswered && (
                  <View
                    style={[
                      styles.answerSavedBox,
                      {
                        backgroundColor:
                          theme.card,

                        borderColor:
                          theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={23}
                      color={
                        theme.primary
                      }
                    />

                    <View
                      style={
                        styles.answerSavedContent
                      }
                    >
                      <Text
                        style={[
                          styles.answerSavedTitle,
                          {
                            color:
                              theme.text,
                          },
                        ]}
                      >
                        Answer Saved
                      </Text>

                      <Text
                        style={[
                          styles.answerSavedText,
                          {
                            color:
                              theme.textSecondary,
                          },
                        ]}
                      >
                        You can continue navigating and edit this answer during review.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* CBT OPTIONS */
              <View>
                {currentQuestion?.options?.map(
                  (
                    option,
                    index
                  ) => {
                    const isSelected =
                      option ===
                      selectedOption;

                    const buttonStyle = [
                      styles.optionBtn,

                      {
                        backgroundColor:
                          isSelected
                            ? isDarkMode
                              ? '#1E293B'
                              : '#E0E7FF'
                            : theme.card,

                        borderColor:
                          isSelected
                            ? theme.primary
                            : theme.border,
                      },

                      isSelected &&
                        styles.selectedOption,
                    ];

                    return (
                      <TouchableOpacity
                        key={
                          index
                        }
                        style={
                          buttonStyle
                        }
                        onPress={() =>
                          handleOptionPress(
                            option
                          )
                        }
                        disabled={
                          assessmentTimeExpired ||
                          isSubmittingFinalQuiz
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color:
                                theme.text,
                            },
                          ]}
                        >
                          {option}
                        </Text>

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={
                              theme.primary
                            }
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }
                )}

                {isAnswered && (
                  <View
                    style={[
                      styles.answerSavedBox,
                      {
                        backgroundColor:
                          theme.card,

                        borderColor:
                          theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={22}
                      color={
                        theme.primary
                      }
                    />

                    <Text
                      style={[
                        styles.answerSavedText,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      Answer saved. You can continue navigating and edit it before final submission.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* FIXED BOTTOM NAVIGATION */}
          <View
            style={[
              styles.quizBottomBar,
              {
                backgroundColor:
                  theme.background,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.bottomNavBtn,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },

                isFirstQuestion &&
                  styles.disabledBtn,
              ]}
              onPress={
                handlePrevious
              }
              disabled={
                isFirstQuestion ||
                isSubmittingFinalQuiz
              }
            >
              <Ionicons
                name="arrow-back"
                size={19}
                color={
                  isFirstQuestion
                    ? theme.textSecondary
                    : theme.text
                }
              />

              <Text
                style={[
                  styles.bottomNavText,
                  {
                    color:
                      isFirstQuestion
                        ? theme.textSecondary
                        : theme.text,
                  },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomNavBtn,
                {
                  backgroundColor:
                    theme.primary,

                  borderColor:
                    theme.primary,
                },
              ]}
              onPress={
                handleNext
              }
              disabled={
                isSubmittingFinalQuiz
              }
            >
              <Text
                style={
                  styles.bottomNavTextWhite
                }
              >
                {isLastQuestion
                  ? 'Review & Submit'
                  : 'Next'}
              </Text>

              <Ionicons
                name={
                  isLastQuestion
                    ? 'eye-outline'
                    : 'arrow-forward'
                }
                size={19}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {isSubmittingFinalQuiz && (
            <View
              style={[
                styles.submittingOverlay,
                {
                  backgroundColor:
                    theme.background,
                },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.submittingTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Calculating Assessment...
              </Text>

              <Text
                style={[
                  styles.submittingText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Your answers are being
                evaluated securely by the
                server.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // REVIEW SCREEN
  // =========================================================

  if (isReviewing) {
    const answeredCount =
      questions.filter(
        (question) => {
          const savedAnswer =
            answers.find(
              (item) =>
                item.questionId ===
                question.id
            )?.answer;

          return Boolean(
            savedAnswer &&
              String(
                savedAnswer
              ).trim()
          );
        }
      ).length;

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
        <KeyboardAvoidingView
          style={
            styles.keyboardContainer
          }
          behavior={
            Platform.OS ===
            'ios'
              ? 'padding'
              : undefined
          }
        >
          {/* REVIEW HEADER */}
          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              onPress={() =>
                navigation.goBack()
              }
            >
              <Ionicons
                name="close"
                size={28}
                color={
                  theme.text
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.reviewHeaderBadge,
                {
                  backgroundColor:
                    `${theme.primary}15`,
                },
              ]}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.reviewHeaderText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                Review Assessment
              </Text>
            </View>

            {/* GLOBAL REVIEW TIMER */}
            <View
              style={[
                styles.reviewTimerSmall,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={
                  assessmentTimeExpired
                    ? Colors.error
                    : theme.primary
                }
              />

              <Text
                style={[
                  styles.reviewTimerText,
                  {
                    color:
                      assessmentTimeExpired
                        ? Colors.error
                        : theme.primary,
                  },
                ]}
              >
                {formatDuration(
                  assessmentTimeLeft
                )}
              </Text>
            </View>
          </View>

          {/* REVIEW PROGRESS BAR */}
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor:
                    theme.primary,

                  width:
                    progressAnim.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],

                        outputRange: [
                          '0%',
                          '100%',
                        ],
                      }
                    ),
                },
              ]}
            />
          </View>

          {/* REVIEW LIST */}
          <ScrollView
            style={
              styles.scrollView
            }
            contentContainerStyle={[
              styles.reviewListContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* REVIEW NOTICE */}
            <View
              style={[
                styles.reviewNotice,
                {
                  backgroundColor:
                    theme.card,

                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Ionicons
                name={
                  assessmentTimeExpired
                    ? 'lock-closed-outline'
                    : 'information-circle-outline'
                }
                size={22}
                color={
                  assessmentTimeExpired
                    ? Colors.error
                    : theme.primary
                }
              />

              <View
                style={
                  styles.reviewNoticeContent
                }
              >
                <Text
                  style={[
                    styles.reviewNoticeTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {assessmentTimeExpired
                    ? 'Review Locked'
                    : 'Review Your Answers'}
                </Text>

                <Text
                  style={[
                    styles.reviewNoticeText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  {assessmentTimeExpired
                    ? 'Time has expired. Your answers are now read-only. Submit when you are ready.'
                    : 'Review all questions below. You can edit any answer while time remains.'}
                </Text>
              </View>
            </View>

            {/* COURSE INFORMATION */}
            <Text
              style={[
                styles.courseCode,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              {Array.isArray(
                courseCode
              )
                ? courseCode[0]
                : courseCode}{' '}
              •{' '}
              {resolvedQuizType.toUpperCase()}
            </Text>

            <Text
              style={[
                styles.courseTitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {Array.isArray(
                courseTitle
              )
                ? courseTitle[0]
                : courseTitle}
            </Text>

            <Text
              style={[
                styles.quizMeta,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {answeredCount} of{' '}
              {questions.length}{' '}
              questions answered
            </Text>

            {/* =================================================
                EVERY QUESTION
                ================================================= */}
            {questions.map(
              (
                question,
                questionIndex
              ) => {
                const savedAnswer =
                  answers.find(
                    (item) =>
                      item.questionId ===
                      question.id
                  )?.answer ?? '';

                const hasAnswer =
                  Boolean(
                    String(
                      savedAnswer
                    ).trim()
                  );

                const isCurrent =
                  currentQuestionIndex ===
                  questionIndex;

                const draftAnswer =
                  reviewDrafts[
                    question.id
                  ] ??
                  savedAnswer ??
                  '';

                return (
                  <View
                    key={
                      question.id ??
                      questionIndex
                    }
                    style={[
                      styles.reviewQuestionCard,
                      {
                        backgroundColor:
                          theme.card,

                        borderColor:
                          isCurrent
                            ? theme.primary
                            : theme.border,
                      },

                      isCurrent &&
                        styles.reviewQuestionCardActive,
                    ]}
                  >
                    {/* QUESTION TOP */}
                    <TouchableOpacity
                      onPress={() =>
                        handleReviewQuestionPress(
                          questionIndex
                        )
                      }
                      activeOpacity={
                        0.8
                      }
                    >
                      <View
                        style={
                          styles.reviewQuestionHeader
                        }
                      >
                        <View
                          style={[
                            styles.reviewQuestionNumber,
                            {
                              backgroundColor:
                                hasAnswer
                                  ? theme.primary
                                  : `${Colors.error}18`,
                            },
                          ]}
                        >
                          {hasAnswer ? (
                            <Ionicons
                              name="checkmark"
                              size={17}
                              color="#fff"
                            />
                          ) : (
                            <Text
                              style={[
                                styles.reviewQuestionNumberText,
                                {
                                  color:
                                    Colors.error,
                                },
                              ]}
                            >
                              {questionIndex +
                                1}
                            </Text>
                          )}
                        </View>

                        <View
                          style={
                            styles.reviewQuestionHeaderContent
                          }
                        >
                          <Text
                            style={[
                              styles.reviewQuestionLabel,
                              {
                                color:
                                  theme.text,
                              },
                            ]}
                          >
                            Question{' '}
                            {questionIndex +
                              1}
                          </Text>

                          <Text
                            style={[
                              styles.reviewQuestionStatus,
                              {
                                color:
                                  hasAnswer
                                    ? theme.primary
                                    : Colors.error,
                              },
                            ]}
                          >
                            {hasAnswer
                              ? 'Answered'
                              : 'Unanswered'}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={
                            theme.textSecondary
                          }
                        />
                      </View>
                    </TouchableOpacity>

                    {/* QUESTION TEXT */}
                    <Text
                      style={[
                        styles.reviewQuestionText,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {
                        question.question
                      }
                    </Text>

                    {/* THEORY REVIEW */}
                    {isTheory ? (
                      <View>
                        <Text
                          style={[
                            styles.reviewAnswerLabel,
                            {
                              color:
                                theme.textSecondary,
                            },
                          ]}
                        >
                          Your Answer
                        </Text>

                        <TextInput
                          style={[
                            styles.reviewTheoryInput,
                            {
                              color:
                                theme.text,

                              backgroundColor:
                                theme.background,

                              borderColor:
                                assessmentTimeExpired
                                  ? theme.border
                                  : isCurrent
                                    ? theme.primary
                                    : theme.border,
                            },
                          ]}
                          value={
                            draftAnswer
                          }
                          onChangeText={(
                            text
                          ) =>
                            handleReviewTheoryChange(
                              question.id,
                              text
                            )
                          }
                          placeholder="No answer provided. Type your answer here..."
                          placeholderTextColor={
                            theme.textSecondary
                          }
                          multiline
                          textAlignVertical="top"
                          editable={
                            !assessmentTimeExpired &&
                            !isSubmittingFinalQuiz
                          }
                        />

                        {!assessmentTimeExpired && (
                          <TouchableOpacity
                            style={[
                              styles.reviewSaveBtn,
                              {
                                backgroundColor:
                                  theme.primary,
                              },
                            ]}
                            onPress={() =>
                              handleSaveReviewTheory(
                                questionIndex,
                                question.id
                              )
                            }
                            disabled={
                              isSubmittingFinalQuiz
                            }
                          >
                            <Ionicons
                              name="save-outline"
                              size={18}
                              color="#fff"
                            />

                            <Text
                              style={
                                styles.reviewSaveBtnText
                              }
                            >
                              Save Answer
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      /* CBT REVIEW */
                      <View>
                        <Text
                          style={[
                            styles.reviewAnswerLabel,
                            {
                              color:
                                theme.textSecondary,
                            },
                          ]}
                        >
                          Select Your Answer
                        </Text>

                        {question.options?.map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const isSelected =
                              option ===
                              savedAnswer;

                            return (
                              <TouchableOpacity
                                key={
                                  optionIndex
                                }
                                style={[
                                  styles.reviewOptionBtn,
                                  {
                                    backgroundColor:
                                      isSelected
                                        ? isDarkMode
                                          ? '#1E293B'
                                          : '#E0E7FF'
                                        : theme.background,

                                    borderColor:
                                      isSelected
                                        ? theme.primary
                                        : theme.border,
                                  },
                                ]}
                                onPress={() =>
                                  handleReviewOptionPress(
                                    questionIndex,
                                    option
                                  )
                                }
                                disabled={
                                  assessmentTimeExpired ||
                                  isSubmittingFinalQuiz
                                }
                              >
                                <Text
                                  style={[
                                    styles.reviewOptionText,
                                    {
                                      color:
                                        theme.text,
                                    },
                                  ]}
                                >
                                  {option}
                                </Text>

                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={21}
                                    color={
                                      theme.primary
                                    }
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                    )}
                  </View>
                );
              }
            )}

            {/* EXTRA BOTTOM SPACE FOR FIXED SUBMIT BUTTON */}
            <View
              style={{
                height: 120,
              }}
            />
          </ScrollView>

          {/* FIXED REVIEW SUBMIT BUTTON */}
          <View
            style={[
              styles.reviewSubmitBar,
              {
                backgroundColor:
                  theme.background,
              },
            ]}
          >
            <View
              style={
                styles.reviewSummaryRow
              }
            >
              <View>
                <Text
                  style={[
                    styles.reviewSummaryTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {answeredCount}/
                  {questions.length}{' '}
                  answered
                </Text>

                <Text
                  style={[
                    styles.reviewSummaryText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  {assessmentTimeExpired
                    ? 'Time expired • answers locked'
                    : `${formatDuration(
                        assessmentTimeLeft
                      )} remaining`}
                </Text>
              </View>

              <Ionicons
                name={
                  assessmentTimeExpired
                    ? 'lock-closed-outline'
                    : 'time-outline'
                }
                size={22}
                color={
                  assessmentTimeExpired
                    ? Colors.error
                    : theme.primary
                }
              />
            </View>

            <TouchableOpacity
              style={[
                styles.finalSubmitBtn,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
              onPress={
                handleSubmitAssessment
              }
              disabled={
                isSubmittingFinalQuiz
              }
            >
              <Text
                style={
                  styles.finalSubmitText
                }
              >
                Submit Assessment
              </Text>

              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {isSubmittingFinalQuiz && (
            <View
              style={[
                styles.submittingOverlay,
                {
                  backgroundColor:
                    theme.background,
                },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.submittingTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Calculating Assessment...
              </Text>

              <Text
                style={[
                  styles.submittingText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Your answers are being
                evaluated securely by the
                server.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    keyboardContainer: {
      flex: 1,
    },

    centered: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 30,
    },

    loadingTitle: {
      marginTop: 14,

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 18,

      textAlign:
        'center',
    },

    loadingText: {
      marginTop: 8,

      fontFamily:
        'Ubuntu-Regular',

      fontSize: 14,

      lineHeight: 21,

      textAlign:
        'center',
    },

    emptyTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 21,

      marginTop: 16,

      textAlign:
        'center',
    },

    emptyText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 14,

      lineHeight: 21,

      marginTop: 8,

      textAlign:
        'center',
    },

    emptyButton: {
      marginTop: 24,

      paddingHorizontal: 25,

      paddingVertical: 15,

      borderRadius: 14,
    },

    emptyButtonText: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,
    },

    header: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      padding: 20,

      marginTop: 10,
    },

    timerContainer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      paddingHorizontal: 15,

      paddingVertical: 8,

      borderRadius: 20,
    },

    timerText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 16,
    },

    progressText: {
      fontFamily:
        'Ubuntu-Medium',
    },

    progressBarBg: {
      height: 6,

      borderRadius: 3,

      marginHorizontal: 20,
    },

    progressBarFill: {
      height: 6,

      borderRadius: 3,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      padding: 25,

      /*
       * Extra room because Previous/Next are fixed at the bottom.
       */
      paddingBottom: 150,
    },

    courseCode: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,

      letterSpacing: 1,

      textAlign:
        'center',
    },

    courseTitle: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 14,

      marginTop: 4,

      textAlign:
        'center',
    },

    quizMeta: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 12,

      marginTop: 4,

      marginBottom: 12,

      textAlign:
        'center',
    },

    typeBadge: {
      alignSelf:
        'center',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,

      paddingHorizontal: 12,

      paddingVertical: 7,

      borderRadius: 20,

      marginBottom: 20,
    },

    typeBadgeText: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 12,
    },

    questionTimeInfo: {
      flexDirection:
        'row',

      alignItems:
        'center',

      alignSelf:
        'center',

      gap: 7,

      paddingHorizontal: 13,

      paddingVertical: 8,

      borderRadius: 20,

      borderWidth: 1,

      marginBottom: 18,
    },

    questionTimeText: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 12,
    },

    questionNumber: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 13,

      marginBottom: 8,

      textAlign:
        'center',
    },

    questionText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 24,

      marginBottom: 30,

      lineHeight: 32,

      textAlign:
        'center',
    },

    answerLabel: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,

      marginBottom: 10,
    },

    theoryInput: {
      minHeight: 180,

      borderWidth: 1,

      borderRadius: 16,

      padding: 16,

      fontFamily:
        'Ubuntu-Regular',

      fontSize: 16,

      lineHeight: 24,
    },

    submitAnswerBtn: {
      flexDirection:
        'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 8,

      padding: 17,

      borderRadius: 15,

      marginTop: 15,
    },

    submitAnswerText: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 16,
    },

    answerSavedBox: {
      flexDirection:
        'row',

      alignItems:
        'center',

      padding: 16,

      borderRadius: 16,

      borderWidth: 1,

      marginTop: 18,
    },

    answerSavedContent: {
      flex: 1,

      marginLeft: 12,
    },

    answerSavedTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,

      marginBottom: 4,
    },

    answerSavedText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      lineHeight: 19,

      flex: 1,
    },

    optionBtn: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      padding: 20,

      borderRadius: 16,

      marginBottom: 15,

      borderWidth: 1,
    },

    selectedOption: {
      borderWidth: 1.5,
    },

    optionText: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 16,

      flex: 1,
    },

    /*
     * =========================================================
     * ACTIVE QUIZ FIXED BOTTOM NAVIGATION
     * =========================================================
     */

    quizBottomBar: {
      position:
        'absolute',

      bottom: 0,

      left: 0,

      right: 0,

      flexDirection:
        'row',

      gap: 12,

      paddingHorizontal: 20,

      paddingTop: 10,

      paddingBottom: 18,

      elevation: 8,

      shadowOpacity: 0.15,

      shadowRadius: 5,

      zIndex: 50,
    },

    bottomNavBtn: {
      flex: 1,

      minHeight: 54,

      borderRadius: 15,

      borderWidth: 1,

      flexDirection:
        'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 7,

      paddingHorizontal: 10,
    },

    bottomNavText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,
    },

    bottomNavTextWhite: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,
    },

    disabledBtn: {
      opacity: 0.45,
    },

    /*
     * =========================================================
     * REVIEW
     * =========================================================
     */

    reviewHeaderBadge: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 20,
    },

    reviewHeaderText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 13,
    },

    reviewTimerSmall: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,

      paddingHorizontal: 9,

      paddingVertical: 7,

      borderRadius: 18,
    },

    reviewTimerText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 13,
    },

    reviewListContent: {
      padding: 20,

      paddingBottom: 140,
    },

    reviewNotice: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      padding: 15,

      borderRadius: 15,

      borderWidth: 1,

      marginBottom: 22,

      gap: 10,
    },

    reviewNoticeContent: {
      flex: 1,
    },

    reviewNoticeTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,

      marginBottom: 4,
    },

    reviewNoticeText: {
      flex: 1,

      fontFamily:
        'Ubuntu-Regular',

      fontSize: 13,

      lineHeight: 19,
    },

    /*
     * Each question is now its own vertical review card.
     */

    reviewQuestionCard: {
      borderWidth: 1,

      borderRadius: 18,

      padding: 17,

      marginBottom: 18,
    },

    reviewQuestionCardActive: {
      borderWidth: 1.5,
    },

    reviewQuestionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 15,
    },

    reviewQuestionNumber: {
      width: 34,

      height: 34,

      borderRadius: 17,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    reviewQuestionNumberText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,
    },

    reviewQuestionHeaderContent: {
      flex: 1,

      marginLeft: 10,
    },

    reviewQuestionLabel: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 15,
    },

    reviewQuestionStatus: {
      fontFamily:
        'Ubuntu-Medium',

      fontSize: 12,

      marginTop: 2,
    },

    reviewQuestionText: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 17,

      lineHeight: 25,

      marginBottom: 18,
    },

    reviewAnswerLabel: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 13,

      marginBottom: 9,
    },

    reviewOptionBtn: {
      minHeight: 50,

      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      paddingHorizontal: 14,

      paddingVertical: 12,

      borderRadius: 13,

      borderWidth: 1,

      marginBottom: 10,
    },

    reviewOptionText: {
      flex: 1,

      fontFamily:
        'Ubuntu-Medium',

      fontSize: 14,

      lineHeight: 20,
    },

    reviewTheoryInput: {
      minHeight: 130,

      borderWidth: 1,

      borderRadius: 14,

      padding: 14,

      fontFamily:
        'Ubuntu-Regular',

      fontSize: 14,

      lineHeight: 21,
    },

    reviewSaveBtn: {
      flexDirection:
        'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 7,

      paddingVertical: 13,

      borderRadius: 13,

      marginTop: 10,
    },

    reviewSaveBtnText: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,
    },

    /*
     * =========================================================
     * REVIEW FIXED SUBMIT AREA
     * =========================================================
     */

    reviewSubmitBar: {
      position:
        'absolute',

      bottom: 0,

      left: 0,

      right: 0,

      paddingHorizontal: 20,

      paddingTop: 10,

      paddingBottom: 18,

      elevation: 10,

      shadowOpacity: 0.15,

      shadowRadius: 6,

      zIndex: 50,
    },

    reviewSummaryRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 9,
    },

    reviewSummaryTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 14,
    },

    reviewSummaryText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 12,

      marginTop: 2,
    },

    finalSubmitBtn: {
      minHeight: 54,

      borderRadius: 15,

      flexDirection:
        'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 8,
    },

    finalSubmitText: {
      color: '#fff',

      fontFamily:
        'Ubuntu-Bold',

      fontSize: 16,
    },

    /*
     * =========================================================
     * SUBMISSION OVERLAY
     * =========================================================
     */

    submittingOverlay: {
      position:
        'absolute',

      top: 0,

      left: 0,

      right: 0,

      bottom: 0,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 35,

      zIndex: 100,
    },

    submittingTitle: {
      fontFamily:
        'Ubuntu-Bold',

      fontSize: 20,

      marginTop: 18,

      textAlign:
        'center',
    },

    submittingText: {
      fontFamily:
        'Ubuntu-Regular',

      fontSize: 14,

      lineHeight: 21,

      marginTop: 8,

      textAlign:
        'center',
    },
  });