import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLeaderboardQuery } from '../../hooks/useLeaderboardQuery';
import { getFacultyMeta } from '../../constants/academicIcons';
import {
  getGlobalUserFaculty,
  saveGlobalUserFaculty,
} from '../../utils/mmkvStorage';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { profile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();

  const [activeTab, setActiveTab] = useState('24h');
  const [activeScope, setActiveScope] = useState('global');

  const {
    data: leaderboard = [],
    isLoading,
    isFetching,
    refetch,
  } = useLeaderboardQuery(activeTab, activeScope);

  const standing = leaderboard?.standing || null;

  const renderItem = ({ item, index }) => {
    const isCurrentUser =
      profile?.id === item.id || profile?.username === item.username;
    const isTopThree = index < 3;
    const rank = index + 1;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    const displayScore =
      typeof item.totalScore === 'number'
        ? Number(item.totalScore.toFixed(1))
        : item.totalScore || item.score || item.points || 0;

    const isAnonymous =
      String(item.username || '').startsWith('scholar_') ||
      String(item.fullName || '').startsWith('Scholar #');

    // Save current user's profile faculty globally whenever available
    if (
      isCurrentUser &&
      (profile?.facultyCode ||
        profile?.departmentCode ||
        profile?.faculty ||
        profile?.department)
    ) {
      const myFac =
        profile?.facultyCode ||
        profile?.departmentCode ||
        profile?.faculty ||
        profile?.department;
      if (myFac) {
        saveGlobalUserFaculty(profile?.username || item.username, myFac);
      }
    }

    // Faculty Code Resolution
    let rawFac = (
      item.facultyCode ||
      item.faculty?.code ||
      (typeof item.faculty === 'string' ? item.faculty : '') ||
      item.departmentCode ||
      item.department?.code ||
      (typeof item.department === 'string' ? item.department : '') ||
      item.facultyName ||
      item.departmentName ||
      getGlobalUserFaculty(item.username) ||
      (isCurrentUser
        ? profile?.facultyCode ||
          profile?.faculty?.code ||
          profile?.department?.faculty?.code ||
          profile?.departmentCode ||
          profile?.faculty ||
          profile?.department ||
          profile?.facultyName ||
          profile?.departmentName
        : '') ||
      ''
    )
      .toString()
      .toUpperCase()
      .trim();

    const deptToFac = {
      CSC: 'FCI', CYB: 'FCI', INS: 'FCI',
      EEE: 'FET', MEE: 'FET', CVE: 'FET', CHE: 'FET', AGE: 'FET', CPE: 'FET', FDE: 'FET',
      MTH: 'FPAS', PHY: 'FPAS', CHM: 'FPAS', BCH: 'FPAS', MCB: 'FPAS', SLT: 'FPAS', STA: 'FPAS',
      ACC: 'FMS', BUS: 'FMS', FNA: 'FMS', MKT: 'FMS', PAD: 'FMS',
      ARC: 'FES', URP: 'FES', EST: 'FES', EVS: 'FES', SVG: 'FES',
      FST: 'FFCS', CS: 'FFCS',
      ELS: 'FASS', HIS: 'FASS', SOC: 'FASS', ECO: 'FASS',
      ANA: 'FBMS', PHS: 'FBMS', MLS: 'FBMS',
      NUR: 'FNS', MHN: 'FNS', MSN: 'FNS',
      AEC: 'FAS', AEX: 'FAS', AGR: 'FAS', APB: 'FAS',
    };

    let resolvedCode = deptToFac[rawFac] || rawFac;
    const knownFaculties = ['FCI', 'FET', 'FES', 'FFCS', 'FMS', 'FPAS', 'FASS', 'FBMS', 'FBCS', 'FCS', 'FNS', 'FRNR', 'FAS'];

    let displayFacultyCode = null;

    if (knownFaculties.includes(resolvedCode)) {
      displayFacultyCode = resolvedCode;
    } else if (rawFac.length > 0) {
      const lower = rawFac.toLowerCase();
      if (lower.includes('comput') || lower.includes('informatic')) displayFacultyCode = 'FCI';
      else if (lower.includes('engin') || lower.includes('technol')) displayFacultyCode = 'FET';
      else if (lower.includes('environ')) displayFacultyCode = 'FES';
      else if (lower.includes('food') || lower.includes('consum')) displayFacultyCode = 'FFCS';
      else if (lower.includes('manag') || lower.includes('busin')) displayFacultyCode = 'FMS';
      else if (lower.includes('pure') || lower.includes('science')) displayFacultyCode = 'FPAS';
      else if (lower.includes('art') || lower.includes('social')) displayFacultyCode = 'FASS';
      else if (lower.includes('agric')) displayFacultyCode = 'FAS';
      else if (rawFac.length <= 5) {
        displayFacultyCode = rawFac;
      }
    }

    const facultyMeta = getFacultyMeta({
      code: displayFacultyCode || 'MIXED',
      name:
        item.facultyName ||
        item.faculty ||
        (isCurrentUser ? profile?.facultyName || profile?.departmentName : ''),
    });

    const userInitial = (item.fullName || item.username || 'U')
      .charAt(0)
      .toUpperCase();

    // Display Name handling
    let displayName = `@${item.username || 'user'}`;
    if (isAnonymous) {
      displayName = item.fullName || 'Scholar';
    } else if (item.fullName && !item.fullName.startsWith('@')) {
      displayName = `${item.fullName} (@${item.username})`;
    }

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#F9F9F9',
            borderColor: theme.border,
          },
          isCurrentUser && { borderColor: theme.primary, borderWidth: 2 },
        ]}
      >
        {/* Rank / Trophy */}
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons name="trophy" size={22} color={rankColors[index]} />
          ) : (
            <Text style={[styles.rankText, { color: theme.textSecondary }]}>
              {rank}
            </Text>
          )}
        </View>

        {/* Avatar Circle */}
        <View style={styles.avatarContainer}>
          {isAnonymous ? (
            <View
              style={[
                styles.avatar,
                styles.initialAvatar,
                {
                  backgroundColor: isDarkMode ? '#2D3748' : '#EDF2F7',
                },
              ]}
            >
              <Ionicons name="school-outline" size={20} color={theme.primary} />
            </View>
          ) : displayFacultyCode ? (
            <View
              style={[
                styles.avatar,
                styles.facultyAvatar,
                {
                  backgroundColor: `${facultyMeta.color}22`,
                  borderColor: `${facultyMeta.color}45`,
                },
              ]}
            >
              <Text
                style={[
                  styles.facultyAvatarText,
                  { color: facultyMeta.color },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {displayFacultyCode}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.avatar,
                styles.initialAvatar,
                {
                  backgroundColor: isDarkMode ? theme.border : '#E0E7FF',
                },
              ]}
            >
              <Text style={[styles.initialText, { color: theme.primary }]}>
                {userInitial}
              </Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {displayName} {isCurrentUser && '(You)'}
          </Text>
          {isCurrentUser && (
            <Text style={[styles.userTagline, { color: theme.textSecondary }]}>
              Academic Practice Rank
            </Text>
          )}
        </View>

        {/* Score Points */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme.primary }]}>
            {displayScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            XP
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: topInset },
        ]}
        edges={['left', 'right']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading Leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
      edges={['left', 'right']}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>
              Leaderboard
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Mastery XP rankings among LAUTECH scholars.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.privacyPill, { backgroundColor: isDarkMode ? '#2D3748' : '#EDF2F7' }]}
            onPress={() => router.push('/leaderboard-privacy')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
            <Text style={[styles.privacyPillText, { color: theme.text }]}>
              Privacy
            </Text>
          </TouchableOpacity>
        </View>

        {/* SCOPE TABS */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#E5E7EB', marginBottom: 6 },
          ]}
        >
          {[
            { key: 'global', label: 'Campus' },
            { key: 'faculty', label: 'My Faculty' },
            { key: 'department', label: 'My Dept' },
          ].map((scope) => (
            <TouchableOpacity
              key={scope.key}
              style={[
                styles.tabButton,
                activeScope === scope.key && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveScope(scope.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeScope === scope.key ? '#fff' : theme.textSecondary,
                  },
                ]}
              >
                {scope.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TIME RANGE TABS */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#E5E7EB' },
          ]}
        >
          {['24h', '30d', 'all'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? '#fff' : theme.textSecondary,
                  },
                ]}
              >
                {tab === '24h'
                  ? '24 Hours'
                  : tab === '30d'
                  ? '30 Days'
                  : 'All-Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SCOPE NOTICE BANNER (IF AFFILIATION MISSING) */}
        {standing?.scopeNotice && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: isDarkMode ? '#2C2010' : '#FEF3C7',
                borderColor: '#F59E0B',
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
            <Text
              style={[
                styles.noticeText,
                { color: isDarkMode ? '#FDE68A' : '#92400E' },
              ]}
            >
              {standing.scopeNotice}
            </Text>
            <TouchableOpacity
              style={styles.noticeBtn}
              onPress={() => router.push('/edit-profile')}
            >
              <Text style={styles.noticeBtnText}>Set Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item, index) =>
          item.id?.toString() || item._id?.toString() || index.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons
              name="trophy-outline"
              size={48}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {standing?.scopeNotice
                ? 'Affiliation needed to display rankings.'
                : 'No leaderboard scores recorded for this filter yet.'}
            </Text>
          </View>
        }
      />

      {/* PERSONAL STANDING STICKY FOOTER */}
      {standing && typeof standing.rank === 'number' && (
        <View
          style={[
            styles.standingFooter,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={styles.standingLeft}>
            <View
              style={[
                styles.standingRankBadge,
                { backgroundColor: `${theme.primary}25` },
              ]}
            >
              <Text style={[styles.standingRankText, { color: theme.primary }]}>
                #{standing.rank}
              </Text>
            </View>
            <View style={styles.standingMeta}>
              <View style={styles.standingHeaderRow}>
                <Text style={[styles.standingTitle, { color: theme.text }]}>
                  Your Standing
                </Text>
                {standing.isExcluded && (
                  <View style={styles.privatePill}>
                    <Text style={styles.privatePillText}>Private Mode</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.standingSub, { color: theme.textSecondary }]}>
                {standing.percentile
                  ? `Top ${Math.max(1, 100 - standing.percentile)}% of participants`
                  : 'Active participant'}
              </Text>
            </View>
          </View>
          <View style={styles.standingRight}>
            <Text style={[styles.standingScore, { color: theme.primary }]}>
              {standing.totalScore}
            </Text>
            <Text style={[styles.standingScoreLabel, { color: theme.textSecondary }]}>
              XP • {standing.accuracy}% acc
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 24, marginBottom: 2 },
  subtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 12 },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  privacyPillText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: { fontFamily: 'Ubuntu-Bold', fontSize: 12 },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
  },
  noticeBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noticeBtnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 11,
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 85,
    gap: 10,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  avatarContainer: { marginRight: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  initialAvatar: { justifyContent: 'center', alignItems: 'center' },
  initialText: { fontFamily: 'Ubuntu-Bold', fontSize: 15 },
  facultyAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 2,
  },
  facultyAvatarText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 10,
    textAlign: 'center',
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  userTagline: { fontFamily: 'Ubuntu-Regular', fontSize: 11, marginTop: 1 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontFamily: 'Archivo-Black', fontSize: 16 },
  scoreLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: { fontFamily: 'Ubuntu-Medium', fontSize: 13, marginTop: 10, textAlign: 'center' },
  standingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  standingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  standingRankBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  standingRankText: {
    fontFamily: 'Archivo-Black',
    fontSize: 14,
  },
  standingMeta: {
    flex: 1,
  },
  standingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standingTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },
  privatePill: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privatePillText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 9,
    color: '#FFF',
  },
  standingSub: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 1,
  },
  standingRight: {
    alignItems: 'flex-end',
  },
  standingScore: {
    fontFamily: 'Archivo-Black',
    fontSize: 16,
  },
  standingScoreLabel: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
  },
});
