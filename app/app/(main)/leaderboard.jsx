import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLeaderboardQuery } from '../../hooks/useLeaderboardQuery';

export default function LeaderboardScreen() {
  const { profile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('24h');

  const {
    data: leaderboard = [],
    isLoading,
    isFetching,
    refetch
  } = useLeaderboardQuery(activeTab);

  const renderItem = ({ item, index }) => {
    const isCurrentUser = profile?.id === item.id || profile?.username === item.username;
    const isTopThree = index < 3;
    const rank = index + 1;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    const displayScore = typeof item.totalScore === 'number'
      ? Number(item.totalScore.toFixed(1))
      : (item.totalScore || item.score || item.points || 0);

    return (
      <View style={[
        styles.row,
        { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9F9F9', borderColor: theme.border },
        isCurrentUser && { borderColor: theme.primary, borderWidth: 2 }
      ]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons name="trophy" size={22} color={rankColors[index]} />
          ) : (
            <Text style={[styles.rankText, { color: theme.textSecondary }]}>{rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialAvatar, { backgroundColor: isDarkMode ? theme.border : '#E0E7FF' }]}>
              <Text style={[styles.initialText, { color: theme.primary }]}>
                {(item.username || item.fullName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            @{item.username || 'user'} {isCurrentUser && '(You)'}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme.primary }]}>{displayScore}</Text>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>pts</Text>
        </View>
      </View>
    );
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>See where you stand among top players.</Text>

        <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#E5E7EB' }]}>
          {['24h', '30d', 'all'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && { backgroundColor: theme.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : theme.textSecondary }]}>
                {tab === '24h' ? '24 Hours' : tab === '30d' ? '30 Days' : 'All-Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="trophy-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No leaderboard data available.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 28, marginBottom: 5 },
  subtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 14, marginBottom: 15 },
  tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 5 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { fontFamily: 'Ubuntu-Bold', fontSize: 13 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30, gap: 12, paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1 },
  rankContainer: { width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankText: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  initialAvatar: { justifyContent: 'center', alignItems: 'center' },
  initialText: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  userInfo: { flex: 1, marginRight: 10 },
  userName: { fontFamily: 'Ubuntu-Bold', fontSize: 15 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontFamily: 'Archivo-Black', fontSize: 18 },
  scoreLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontFamily: 'Ubuntu-Medium', fontSize: 14, marginTop: 10 }
});
