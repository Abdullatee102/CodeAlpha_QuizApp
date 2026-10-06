import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const { profile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('24h');

  const {
    data: leaderboard = [],
    isLoading,
    isFetching,
    refetch,
  } = useLeaderboardQuery(activeTab);

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

    // Faculty Code Resolution from configured user/item data or persistent global map
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

    // Map department codes to parent LAUTECH Faculty Codes if configured as department
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
      AEC: 'FAS', AEX: 'FAS', AGR: 'FAS', APB: 'FAS'
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

    const userInitial = (item.username || item.fullName || 'U')
      .charAt(0)
      .toUpperCase();

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

        {/* Avatar Circle: Configured Faculty Code OR First Letter Initial */}
        <View style={styles.avatarContainer}>
          {displayFacultyCode ? (
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
            @{item.username || 'user'} {isCurrentUser && '(You)'}
          </Text>
        </View>

        {/* Score Points */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme.primary }]}>
            {displayScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            pts
          </Text>
        </View>
      </View>
    );
  };

  // Loading state wrapped in Theme-Aware SafeAreaView
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
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          See where you stand among top players.
        </Text>

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
              No leaderboard data available.
            </Text>
          </View>
        }
      />
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
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 26, marginBottom: 2 },
  subtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 13, marginBottom: 10 },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontFamily: 'Ubuntu-Bold', fontSize: 13 },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  initialAvatar: { justifyContent: 'center', alignItems: 'center' },
  initialText: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  facultyAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 2,
  },
  facultyAvatarText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 11,
    textAlign: 'center',
  },
  userInfo: { flex: 1, marginRight: 10 },
  userName: { fontFamily: 'Ubuntu-Bold', fontSize: 15 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontFamily: 'Archivo-Black', fontSize: 18 },
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
    marginTop: 50,
  },
  emptyText: { fontFamily: 'Ubuntu-Medium', fontSize: 14, marginTop: 10 },
});
