// src/app/(main)/profile.jsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useProfileQuery } from '../../hooks/useProfileQuery';
import { useQuizHistoryQuery } from '../../hooks/useQuizHistoryQuery';
import { useAchievementsQuery } from '../../hooks/useAchievementsQuery';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, updateProfile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();

  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: profile } = useProfileQuery();
  const { data: history = [] } = useQuizHistoryQuery();
  const { data: achievements = [] } = useAchievementsQuery();

  // =====================================================
  // DERIVED TRUTHFUL METRICS
  // =====================================================

  const totalQuizzes = history.length || profile?.quizzesCompleted || 0;

  const { averageScore, bestScore, streak } = useMemo(() => {
    if (!history || history.length === 0) {
      return { averageScore: 0, bestScore: 0, streak: 0 };
    }

    const percentages = history.map((item) => {
      if (item.percentage !== undefined && item.percentage !== null) {
        return Number(item.percentage);
      }
      const totalQ = Number(item.totalQuestions || 0);
      const score = Number(item.score || 0);
      return totalQ > 0 ? (score / (totalQ * 10)) * 100 : 0;
    });

    const sum = percentages.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round(sum / percentages.length);
    const best = Math.round(Math.max(...percentages));

    // Real streak calculation from unique consecutive dates
    const uniqueDates = [
      ...new Set(
        history
          .map((h) => {
            const raw = h.createdAt || h.date || h.timestamp;
            if (!raw) return null;
            const d = new Date(raw);
            return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
          })
          .filter(Boolean)
      ),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let calculatedStreak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        calculatedStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const diffDays = Math.round(
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            calculatedStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      averageScore: avg,
      bestScore: best,
      streak: calculatedStreak,
    };
  }, [history]);

  // Identity
  const userInitial = (
    profile?.fullName ||
    user?.fullName ||
    user?.displayName ||
    'S'
  )
    .charAt(0)
    .toUpperCase();

  const profileImage = profile?.photoURL || user?.photoURL;
  const username = profile?.username || user?.username;

  // Academic values (truthful extraction supporting both object and string shapes)
  const facultyObj =
    profile?.faculty && typeof profile.faculty === 'object'
      ? profile.faculty
      : null;
  const facultyName =
    facultyObj?.name ||
    (typeof profile?.faculty === 'string' ? profile.faculty : null) ||
    profile?.facultyName ||
    null;
  const facultyCode = facultyObj?.code || profile?.facultyCode || null;
  const displayFaculty = facultyName
    ? facultyCode && !facultyName.includes(facultyCode)
      ? `${facultyName} (${facultyCode})`
      : facultyName
    : null;

  const departmentObj =
    profile?.department && typeof profile.department === 'object'
      ? profile.department
      : null;
  const departmentName =
    departmentObj?.name ||
    (typeof profile?.department === 'string' ? profile.department : null) ||
    profile?.departmentName ||
    null;
  const departmentCode = departmentObj?.code || profile?.departmentCode || null;
  const displayDepartment = departmentName
    ? departmentCode && !departmentName.includes(departmentCode)
      ? `${departmentName} (${departmentCode})`
      : departmentName
    : null;

  const studentLevel = profile?.level ? Number(profile.level) : null;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera roll permissions are required to upload an avatar.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      try {
        setUploading(true);
        await updateProfile({ photoURL: result.assets[0].uri });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (err) {
        Alert.alert('Upload Failed', err?.message || 'Could not update photo.');
      } finally {
        setUploading(false);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Header with Profile title & Settings / Edit Icons */}
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>
          Scholar Profile
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            style={[styles.settingsButton, { backgroundColor: `${theme.primary}12` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.settingsButton, { backgroundColor: `${theme.primary}12` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =====================================================
            1. PROFILE HEADER
            ===================================================== */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.initialAvatar,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.initialText, { color: theme.primary }]}>
                  {userInitial}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.primary, borderColor: theme.background },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {profile?.fullName || user?.fullName || 'LAUTECH Scholar'}
          </Text>

          {profile?.email ? (
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {profile.email}
            </Text>
          ) : null}

          {profile?.bio ? (
            <Text style={[styles.userBio, { color: theme.textSecondary }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* =====================================================
            2. ACADEMIC INFORMATION (Truthful State)
            ===================================================== */}
        <View style={styles.sectionBlock}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              Academic Information
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="create-outline" size={16} color={theme.primary} />
              <Text style={{ fontFamily: 'Ubuntu-Medium', fontSize: 13, color: theme.primary }}>
                {displayFaculty || displayDepartment || studentLevel ? 'Edit' : 'Configure'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.academicCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {displayFaculty || displayDepartment || studentLevel ? (
              <View style={styles.academicRowList}>
                {displayFaculty && (
                  <View style={styles.academicItem}>
                    <View
                      style={[
                        styles.academicIconBox,
                        { backgroundColor: `${theme.primary}14` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.academicTextContent}>
                      <Text
                        style={[
                          styles.academicLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Faculty
                      </Text>
                      <Text
                        style={[styles.academicValue, { color: theme.text }]}
                      >
                        {displayFaculty}
                      </Text>
                    </View>
                  </View>
                )}

                {displayDepartment && (
                  <View style={styles.academicItem}>
                    <View
                      style={[
                        styles.academicIconBox,
                        { backgroundColor: `${theme.primary}14` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="school-outline"
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.academicTextContent}>
                      <Text
                        style={[
                          styles.academicLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Department / Programme
                      </Text>
                      <Text
                        style={[styles.academicValue, { color: theme.text }]}
                      >
                        {displayDepartment}
                      </Text>
                    </View>
                  </View>
                )}

                {studentLevel && (
                  <View style={styles.academicItem}>
                    <View
                      style={[
                        styles.academicIconBox,
                        { backgroundColor: `${theme.primary}14` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="stairs-up"
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.academicTextContent}>
                      <Text
                        style={[
                          styles.academicLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Academic Level
                      </Text>
                      <Text
                        style={[styles.academicValue, { color: theme.text }]}
                      >
                        {studentLevel} Level
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.unconfiguredAcademic}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.unconfiguredIconBox,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="school-outline"
                    size={28}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.unconfiguredTitle, { color: theme.text }]}>
                    Academic Profile Not Configured
                  </Text>
                  <Text
                    style={[
                      styles.unconfiguredDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Tap here to select your faculty, department, and level for personalized courses.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* =====================================================
            3. QUIZ OVERVIEW (Real Calculated Metrics)
            ===================================================== */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quiz Overview
          </Text>

          <View
            style={[
              styles.metricsGrid,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.metricBox}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: `${theme.primary}18` },
                ]}
              >
                <Ionicons name="book-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                {totalQuizzes}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Quizzes Taken
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.metricBox}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: '#05966918' },
                ]}
              >
                <Ionicons name="trending-up" size={18} color="#059669" />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                {averageScore}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Average Score
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.metricBox}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: '#EAB30818' },
                ]}
              >
                <Ionicons name="trophy-outline" size={18} color="#D97706" />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                {bestScore}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Best Score
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.metricBox}>
              <View
                style={[
                  styles.metricIconWrap,
                  { backgroundColor: '#DC262618' },
                ]}
              >
                <MaterialCommunityIcons
                  name="fire"
                  size={20}
                  color="#DC2626"
                />
              </View>
              <Text style={[styles.metricNumber, { color: theme.text }]}>
                {streak}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Day Streak
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            4. ACHIEVEMENTS PREVIEW
            ===================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Achievements
            </Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All ({achievements.length})
              </Text>
            </TouchableOpacity>
          </View>

          {achievements.length === 0 ? (
            <View
              style={[
                styles.emptySectionCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <MaterialCommunityIcons
                name="medal-outline"
                size={30}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                Complete quizzes and score well to unlock academic badges.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {achievements.slice(0, 6).map((ach) => (
                <View
                  key={ach.id || ach.achievementKey}
                  style={[
                    styles.achievementBadge,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIconBox,
                      { backgroundColor: '#F59E0B20' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={ach.icon || 'trophy'}
                      size={24}
                      color="#D97706"
                    />
                  </View>
                  <Text
                    style={[styles.badgeTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {ach.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* =====================================================
            5. RECENT ACTIVITY / QUIZ HISTORY PREVIEW
            ===================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                Full History →
              </Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View
              style={[
                styles.emptySectionCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <MaterialCommunityIcons
                name="clipboard-text-clock-outline"
                size={30}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                No completed assessments yet. Start a quiz to track your performance history.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.slice(0, 3).map((item) => {
                const isCbt = (item.quizType || 'cbt') === 'cbt';
                const percent = Math.round(
                  item.percentage ??
                    (item.totalQuestions > 0
                      ? (item.score / (item.totalQuestions * 10)) * 100
                      : 0)
                );

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.historyItemCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.historyIconBox,
                        {
                          backgroundColor: isCbt
                            ? '#2563EB15'
                            : '#7C3AED15',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isCbt ? 'checkbox-marked-circle-outline' : 'text-box-outline'}
                        size={22}
                        color={isCbt ? '#2563EB' : '#7C3AED'}
                      />
                    </View>

                    <View style={styles.historyDetails}>
                      <View style={styles.historyTitleRow}>
                        <Text
                          style={[styles.historyCourseCode, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {item.courseCode || item.category || 'Assessment'}
                        </Text>
                        <View
                          style={[
                            styles.typeBadge,
                            {
                              backgroundColor: isCbt
                                ? '#2563EB15'
                                : '#7C3AED15',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              {
                                color: isCbt ? '#2563EB' : '#7C3AED',
                              },
                            ]}
                          >
                            {isCbt ? 'CBT' : 'THEORY'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[styles.historyCourseTitle, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.courseTitle || 'Course Assessment'} • {formatDate(item.createdAt || item.date)}
                      </Text>
                    </View>

                    <View style={styles.historyScoreBox}>
                      <Text
                        style={[
                          styles.historyPercent,
                          {
                            color:
                              percent >= 70
                                ? '#059669'
                                : percent >= 45
                                ? '#D97706'
                                : '#DC2626',
                          },
                        ]}
                      >
                        {percent}%
                      </Text>
                      <Text
                        style={[
                          styles.historyFraction,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.correctAnswers ?? 0}/{item.totalQuestions ?? 0}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* =====================================================
            6. SECONDARY NAVIGATION / SUPPORT LINKS
            ===================================================== */}
        <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Scholar Resources
          </Text>

          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(main)/message')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name="chat-processing-outline"
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>
                  Academic Discussions
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: theme.textSecondary }]}
                >
                  Join student forums for your faculty and level
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/support')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: '#05966915' },
                ]}
              >
                <Ionicons
                  name="help-buoy-outline"
                  size={20}
                  color="#059669"
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>
                  Help & Support Center
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: theme.textSecondary }]}
                >
                  FAQs, exam guidelines, and support
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  initialAvatar: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 34,
    fontFamily: 'Ubuntu-Bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 19,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: -0.2,
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  userBio: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
    lineHeight: 18,
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  editProfileText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  sectionBlock: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  academicCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  academicRowList: {
    gap: 14,
  },
  academicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  academicIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  academicTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  academicLabel: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  academicValue: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Medium',
    lineHeight: 20,
    flexShrink: 1,
  },
  unconfiguredAcademic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unconfiguredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unconfiguredTitle: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
  },
  unconfiguredDesc: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricNumber: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 36,
  },
  achievementsScroll: {
    gap: 10,
  },
  achievementBadge: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    textAlign: 'center',
  },
  emptySectionCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptySectionText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  historyList: {
    gap: 8,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCourseCode: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
    marginRight: 6,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'Ubuntu-Bold',
  },
  historyCourseTitle: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  historyScoreBox: {
    alignItems: 'flex-end',
  },
  historyPercent: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
  },
  historyFraction: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 1,
  },
  menuContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 62,
  },
});