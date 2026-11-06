import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import {
  useFeedbackEligibilityQuery,
  useSubmitFeedbackMutation,
} from '../../hooks/useFeedbackQuery';

const USAGE_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'several_times_week', label: '2–4 days/week' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'exam_season', label: 'Exam season only' },
  { id: 'rarely', label: 'Rarely' },
];

const FEATURES_LIST = [
  { id: 'cbtQuizzes', label: 'Single Course CBT Practice' },
  { id: 'mixedQuestions', label: 'Mixed Questions Quiz' },
  { id: 'theoryPractice', label: 'Theory / Essay Practice' },
  { id: 'quizReview', label: 'Answer Review & Explanations' },
  { id: 'studyStreaks', label: 'Study Streaks' },
  { id: 'leaderboards', label: 'Campus Leaderboards' },
  { id: 'opportunities', label: 'Scholarships & Opportunities' },
];

const CBT_EXPERIENCE_OPTIONS = [
  { id: 'smooth', label: 'Smooth & responsive' },
  { id: 'moderate', label: 'Acceptable with minor lag' },
  { id: 'difficult', label: 'Encountered timer/freeze issues' },
];

const TECHNICAL_FRICTIONS = [
  { id: 'none_smooth', label: 'None — app ran smoothly' },
  { id: 'app_freeze', label: 'App freeze or crash' },
  { id: 'network_timeout', label: 'Network timeout or lost progress' },
  { id: 'slow_loading', label: 'Slow loading or images not displaying' },
  { id: 'timer_session_issues', label: 'Timer or quiz session problems' },
  { id: 'incorrect_content', label: 'Incorrect questions or answers' },
  { id: 'navigation_issues', label: 'Difficulty finding courses/navigating' },
  { id: 'readability_issues', label: 'Font size or readability problems' },
  { id: 'battery_drain', label: 'Battery drain or phone heating' },
  { id: 'session_login_issues', label: 'Login or session problems' },
  { id: 'other', label: 'Other issue' },
];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme } = useThemeStore();

  const {
    data: eligibility,
    isLoading: isCheckingEligibility,
    isError: isEligibilityError,
    refetch: refetchEligibility,
  } = useFeedbackEligibilityQuery('1.0');

  const submitMutation = useSubmitFeedbackMutation();

  // Form state
  const [usageFrequency, setUsageFrequency] = useState('several_times_week');
  const [selectedFeatures, setSelectedFeatures] = useState([
    'cbtQuizzes',
    'quizReview',
  ]);
  const [featureRatings, setFeatureRatings] = useState({
    cbtQuizzes: 4,
    quizReview: 4,
  });
  const [courseDiscoveryScore, setCourseDiscoveryScore] = useState(4);
  const [cbtSessionExperience, setCbtSessionExperience] = useState('smooth');
  const [answerReviewScore, setAnswerReviewScore] = useState(4);
  const [progressTrackingScore, setProgressTrackingScore] = useState(4);
  const [competitionFairnessScore, setCompetitionFairnessScore] = useState(4);
  const [contentAccuracyScore, setContentAccuracyScore] = useState(4);
  const [selectedFrictions, setSelectedFrictions] = useState(['none_smooth']);
  const [frictionDetails, setFrictionDetails] = useState('');
  const [overallSatisfaction, setOverallSatisfaction] = useState(5);
  const [suggestions, setSuggestions] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Toggle feature selection
  const toggleFeature = (featId) => {
    setSelectedFeatures((prev) => {
      const exists = prev.includes(featId);
      if (exists) {
        const next = prev.filter((id) => id !== featId);
        setFeatureRatings((ratings) => {
          const updated = { ...ratings };
          delete updated[featId];
          return updated;
        });
        return next;
      } else {
        setFeatureRatings((ratings) => ({
          ...ratings,
          [featId]: 3, // Default to 3 (Very Useful)
        }));
        return [...prev, featId];
      }
    });
  };

  const setFeatureRatingValue = (featId, rating) => {
    setFeatureRatings((prev) => ({
      ...prev,
      [featId]: rating,
    }));
  };

  // Toggle technical frictions with mutual exclusion for 'none_smooth'
  const toggleFriction = (frictionId) => {
    setSelectedFrictions((prev) => {
      if (frictionId === 'none_smooth') {
        return ['none_smooth'];
      }

      // If choosing a friction, remove 'none_smooth'
      const withoutSmooth = prev.filter((id) => id !== 'none_smooth');
      const alreadySelected = withoutSmooth.includes(frictionId);

      if (alreadySelected) {
        const remaining = withoutSmooth.filter((id) => id !== frictionId);
        return remaining.length === 0 ? ['none_smooth'] : remaining;
      } else {
        return [...withoutSmooth, frictionId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!overallSatisfaction) {
      Alert.alert('Required Field', 'Please rate your overall satisfaction.');
      return;
    }

    // Build complete feature ratings mapping: evaluated = rating, not used = 0
    const finalFeatureRatings = {};
    FEATURES_LIST.forEach((feat) => {
      if (selectedFeatures.includes(feat.id)) {
        finalFeatureRatings[feat.id] = featureRatings[feat.id] || 3;
      } else {
        finalFeatureRatings[feat.id] = 0;
      }
    });

    const featuresNotUsed = FEATURES_LIST.filter(
      (feat) => !selectedFeatures.includes(feat.id)
    ).map((f) => f.id);

    const payload = {
      surveyVersion: '1.0',
      overallSatisfaction,
      usageFrequency,
      contentAccuracyRating: contentAccuracyScore,
      fairnessRating: competitionFairnessScore,
      technicalFrictions: selectedFrictions,
      frictionDetails: frictionDetails.trim() || null,
      featureRatings: finalFeatureRatings,
      structuredAnswers: {
        usageFrequency,
        featuresEvaluated: selectedFeatures,
        courseDiscoveryScore,
        cbtSessionExperience,
        answerReviewScore,
        progressTrackingScore,
        technicalFrictions: selectedFrictions,
        frictionDetails: frictionDetails.trim() || null,
        contentAccuracyScore,
        competitionFairnessScore,
        overallSatisfaction,
        featuresNotUsed,
      },
      suggestions: suggestions.trim() || null,
      clientMetadata: {
        appVersion: '1.0.0',
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      },
    };

    try {
      await submitMutation.mutateAsync(payload);
      setSubmittedSuccess(true);
    } catch (err) {
      Alert.alert(
        'Submission Failed',
        err.message || 'Could not submit feedback. Please check your network.'
      );
    }
  };

  // Helper Star Rating Component
  const StarRating = ({ value, onChange, max = 5, label }) => (
    <View style={styles.starRatingContainer}>
      {label && (
        <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].slice(0, max).map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starTouch}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={30}
              color={star <= value ? '#F59E0B' : theme.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Share Feedback
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Brain Buzz • Survey v1.0
          </Text>
        </View>
      </View>

      {/* Loading Eligibility */}
      {isCheckingEligibility && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Checking feedback eligibility...
          </Text>
        </View>
      )}

      {/* Eligibility Error */}
      {!isCheckingEligibility && isEligibilityError && (
        <View style={styles.centeredState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Connection Error
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Could not verify your eligibility. Please check your connection.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => refetchEligibility()}
          >
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ineligible: No Completed Quizzes */}
      {!isCheckingEligibility &&
        !isEligibilityError &&
        eligibility &&
        !eligibility.hasCompletedQuiz && (
          <View style={styles.centeredState}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="school-outline" size={42} color="#4F46E5" />
            </View>
            <Text style={[styles.stateTitle, { color: theme.text }]}>
              Quiz Practice Required
            </Text>
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>
              To provide authentic feedback on question quality, scoring, and
              CBT navigation, you must complete at least one practice quiz first.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryBtnText}>Explore Practice Courses</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Ineligible: Already Submitted v1.0 */}
      {!isCheckingEligibility &&
        !isEligibilityError &&
        eligibility &&
        eligibility.hasSubmittedFeedback &&
        !submittedSuccess && (
          <View style={styles.centeredState}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color="#10B981"
              />
            </View>
            <Text style={[styles.stateTitle, { color: theme.text }]}>
              Feedback Received!
            </Text>
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>
              You have already completed the Survey v1.0 feedback. Your
              responses are directly helping improve Brain Buzz for LAUTECH
              students.
            </Text>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                Return to Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Success Modal / Screen */}
      {submittedSuccess && (
        <View style={styles.centeredState}>
          <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="sparkles" size={44} color="#10B981" />
          </View>
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Thank You!
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Your feedback has been saved securely to our research repository.
            Together we are building a better learning experience.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Eligible: Render Questionnaire */}
      {!isCheckingEligibility &&
        !isEligibilityError &&
        eligibility &&
        eligibility.eligible &&
        !submittedSuccess && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Privacy Notice Box */}
            <View
              style={[
                styles.noticeBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#4F46E5"
              />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                Your feedback is <Text style={styles.boldText}>pseudonymous</Text>. We
                never collect your matriculation number, full name, or phone number.
              </Text>
            </View>

            {/* Topic 1: Usage Frequency */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                1. How frequently do you use Brain Buzz?
              </Text>
              <View style={styles.pillsWrap}>
                {USAGE_FREQUENCIES.map((freq) => {
                  const isSelected = usageFrequency === freq.id;
                  return (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.background,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                      onPress={() => setUsageFrequency(freq.id)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Topic 2: Features Evaluated & Adaptive Ratings */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                2. Which features have you used? Rate their usefulness:
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Unchecked features will be marked as &quot;Have Not Used&quot;.
              </Text>

              {FEATURES_LIST.map((feat) => {
                const isChecked = selectedFeatures.includes(feat.id);
                const currentRating = featureRatings[feat.id] || 3;

                return (
                  <View key={feat.id} style={styles.featureItem}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => toggleFeature(feat.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.featureLabel,
                          {
                            color: isChecked
                              ? theme.text
                              : theme.textSecondary,
                            fontWeight: isChecked ? '600' : '400',
                          },
                        ]}
                      >
                        {feat.label}
                      </Text>
                    </TouchableOpacity>

                    {/* Adaptive Rating Slider/Pills (only if checked) */}
                    {isChecked && (
                      <View style={styles.ratingPillsRow}>
                        {[
                          { val: 1, label: 'Not Useful' },
                          { val: 2, label: 'Somewhat' },
                          { val: 3, label: 'Very Useful' },
                          { val: 4, label: 'Essential' },
                        ].map((rate) => {
                          const active = currentRating === rate.val;
                          return (
                            <TouchableOpacity
                              key={rate.val}
                              onPress={() =>
                                setFeatureRatingValue(feat.id, rate.val)
                              }
                              style={[
                                styles.smallPill,
                                {
                                  backgroundColor: active
                                    ? theme.primary
                                    : theme.background,
                                  borderColor: active
                                    ? theme.primary
                                    : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallPillText,
                                  {
                                    color: active ? '#FFFFFF' : theme.text,
                                  },
                                ]}
                              >
                                {rate.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Topic 3: Course Discovery & Navigation */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                3. Course Discovery & Search
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How easy is it to find courses for your department and level?
              </Text>
              <StarRating
                value={courseDiscoveryScore}
                onChange={setCourseDiscoveryScore}
              />
            </View>

            {/* Topic 4: CBT Session Experience */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                4. Starting & Completing CBT Sessions
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How smooth is the quiz test environment and timer?
              </Text>
              <View style={styles.radioList}>
                {CBT_EXPERIENCE_OPTIONS.map((opt) => {
                  const isSelected = cbtSessionExperience === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.radioItem,
                        {
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                      onPress={() => setCbtSessionExperience(opt.id)}
                    >
                      <Ionicons
                        name={
                          isSelected ? 'radio-button-on' : 'radio-button-off'
                        }
                        size={20}
                        color={isSelected ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.radioLabel,
                          {
                            color: isSelected ? theme.text : theme.textSecondary,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Topic 5: Answer Review & Explanations */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                5. Answer Review & Explanations
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How helpful are the post-quiz explanations and solutions?
              </Text>
              <StarRating
                value={answerReviewScore}
                onChange={setAnswerReviewScore}
              />
            </View>

            {/* Topic 6: Progress Tracking & Streaks */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                6. Progress Tracking & Study Streaks
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How well does Brain Buzz help you monitor your study habits?
              </Text>
              <StarRating
                value={progressTrackingScore}
                onChange={setProgressTrackingScore}
              />
            </View>

            {/* Topic 7: Scoring & Competition Fairness */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                7. Scoring & Leaderboard Fairness
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Do you find quiz scoring and student rankings fair and trustworthy?
              </Text>
              <StarRating
                value={competitionFairnessScore}
                onChange={setCompetitionFairnessScore}
              />
            </View>

            {/* Topic 8: Technical Frictions */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                8. Technical Difficulties & Frictions
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Select any issues you have experienced (mutually exclusive with &quot;None&quot;):
              </Text>

              {TECHNICAL_FRICTIONS.map((fric) => {
                const isSelected = selectedFrictions.includes(fric.id);
                return (
                  <TouchableOpacity
                    key={fric.id}
                    style={styles.checkboxRow}
                    onPress={() => toggleFriction(fric.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.featureLabel,
                        {
                          color: isSelected ? theme.text : theme.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {fric.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Optional Friction Explanation */}
              <Text
                style={[
                  styles.subLabel,
                  { color: theme.textSecondary, marginTop: 14 },
                ]}
              >
                Friction Details (Optional):
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                    minHeight: 70,
                  },
                ]}
                placeholder="Briefly explain any device or network issues..."
                placeholderTextColor={theme.textSecondary}
                value={frictionDetails}
                onChangeText={setFrictionDetails}
                maxLength={500}
                multiline
              />
            </View>

            {/* Topic 9: Content Accuracy & Trust */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                9. Content Accuracy & Quality
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How accurate are the academic questions and answers?
              </Text>
              <StarRating
                value={contentAccuracyScore}
                onChange={setContentAccuracyScore}
              />
            </View>

            {/* Topic 10: Overall Satisfaction */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                10. Overall Satisfaction (Required)
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                How would you rate your overall experience with Brain Buzz?
              </Text>
              <StarRating
                value={overallSatisfaction}
                onChange={setOverallSatisfaction}
              />
              <Text
                style={[
                  styles.satisfactionLabel,
                  { color: theme.primary, textAlign: 'center', marginTop: 8 },
                ]}
              >
                {
                  [
                    '',
                    '1 — Poor',
                    '2 — Fair',
                    '3 — Good',
                    '4 — Very Good',
                    '5 — Excellent',
                  ][overallSatisfaction]
                }
              </Text>
            </View>

            {/* Topic 11: Suggestions & Improvements */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                11. Suggestions for Improvement (Optional)
              </Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                What features or improvements would help your studies most? (Please do
                not include your matric number or personal contact details).
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                    minHeight: 100,
                  },
                ]}
                placeholder="Share your thoughts with the Brain Buzz team..."
                placeholderTextColor={theme.textSecondary}
                value={suggestions}
                onChangeText={setSuggestions}
                maxLength={1000}
                multiline
              />
              <Text
                style={[
                  styles.charCounter,
                  { color: theme.textSecondary },
                ]}
              >
                {suggestions.length}/1000
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: submitMutation.isPending ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              activeOpacity={0.8}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 17,
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  featureItem: {
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureLabel: {
    fontSize: 14,
    flex: 1,
  },
  ratingPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 32,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  starRatingContainer: {
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  starTouch: {
    padding: 4,
  },
  radioList: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  radioLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  satisfactionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  textArea: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
});

