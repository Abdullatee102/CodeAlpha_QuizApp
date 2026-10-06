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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLeaderboardQuery } from '../../hooks/useLeaderboardQuery';
import { getFacultyMeta } from '../../constants/academicIcons';

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

    // Faculty Distinction Resolution
    const facultyCode = (
      item.facultyCode ||
      item.faculty ||
      item.departmentCode ||
      item.department ||
      item.facultyName ||
      (isCurrentUser ? profile?.facultyCode || profile?.faculty : '') ||
      ''
    )
      .toString()
      .toUpperCase()
      .trim();

    const facultyMeta = getFacultyMeta({
      code: facultyCode,
      name: item.facultyName || item.faculty,
    });

    const displayFacultyBadge =
      facultyCode && facultyCode.length <= 6
        ? facultyCode
        : facultyMeta.family !== 'Academic Faculty'
        ? facultyMeta.family.split(' ')[0]
        : 'SCHOLAR';

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
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

        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.initialAvatar,
                { backgroundColor: `${facultyMeta.color}20` },
              ]}
            >
              <Text style={[styles.initialText, { color: facultyMeta.color }]}>
                {(item.username || item.fullName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* User Info & Faculty Distinction Badge */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            @{item.username || 'user'} {isCurrentUser && '(You)'}
          </Text>

          <View style={styles.facultyBadgeRow}>
            <View
              style={[
                styles.facultyBadge,
                { backgroundColor: `${facultyMeta.color}15` },
              ]}
            >
              <MaterialCommunityIcons
                name={facultyMeta.icon || 'school-outline'}
                size={12}
                color={facultyMeta.color}
              />
              <Text
                style={[
                  styles.facultyBadgeText,
                  { color: facultyMeta.color },
                ]}
              >
                {displayFacultyBadge}
              </Text>
            </View>
          </View>
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

  // Loading state wrapped in Theme-Aware SafeAreaView (Fixes White Top Bar Flash)
  if (isLoading && leaderboard.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: topInset },
        ]}
        edges={['left', 'right', 'bottom']}
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
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          See where you stand among top scholars.
        </Text>

        <View
          style={[
            styles.tabContainer,
            { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
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
                    color: activeTab === tab ? '#ffffff' : theme.textSecondary,
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
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 13, marginBottom: 14 },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: { fontFamily: 'Ubuntu-Bold', fontSize: 13 },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  initialAvatar: { justifyContent: 'center', alignItems: 'center' },
  initialText: { fontFamily: 'Ubuntu-Bold', fontSize: 17 },
  userInfo: { flex: 1, marginRight: 10, justifyContent: 'center' },
  userName: { fontFamily: 'Ubuntu-Bold', fontSize: 14, marginBottom: 3 },
  facultyBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  facultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  facultyBadgeText: { fontFamily: 'Ubuntu-Bold', fontSize: 10 },
  scoreContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  scoreText: { fontFamily: 'Archivo-Black', fontSize: 17 },
  scoreLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 10, marginTop: -2 },
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
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontFamily: 'Ubuntu-Medium', fontSize: 14, marginTop: 10 },
});
