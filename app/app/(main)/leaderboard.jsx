import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

export default function LeaderboardScreen() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, isDarkMode } = useThemeStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaders(leaderboardData);
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeader = ({ item, index }) => {
    const isTopThree = index < 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; 

    // Formatting score cleanly to round decimals if any fractional scores exist
    const displayScore = typeof item.totalScore === 'number' 
      ? Number(item.totalScore.toFixed(1)) 
      : (item.totalScore || 0);

    return (
      <View style={[styles.leaderRow, { backgroundColor: theme.card }]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons name="trophy" size={20} color={rankColors[index]} />
          ) : (
            <Text style={[styles.rankText, { color: theme.textSecondary }]}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialAvatar, { backgroundColor: isDarkMode ? theme.border : '#E0E7FF' }]}>
              <Text style={[styles.initialText, { color: theme.primary }]}>{item.fullName?.charAt(0) || 'S'}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{item.fullName || "Anonymous"}</Text>
          <Text style={[styles.userRole, { color: theme.textSecondary }]}>Scholar</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme.primary }]}>{displayScore}</Text>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading && leaders.length === 0) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top Performers of Brain Buzz</Text>
      </View>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={renderLeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchLeaderboard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 40
  },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 28, color: '#FFF' },
  headerSub: { fontFamily: 'Ubuntu-Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  listContent: { padding: 20, paddingTop: 10 },
  leaderRow: { 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 18, 
    alignItems: 'center', 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  rankContainer: { width: 30, alignItems: 'center' },
  rankText: { fontFamily: 'Ubuntu-Bold' },
  avatarContainer: { marginHorizontal: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  initialAvatar: { justifyContent: 'center', alignItems: 'center' },
  initialText: { fontFamily: 'Ubuntu-Bold' },
  infoContainer: { flex: 1 },
  userName: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  userRole: { fontFamily: 'Ubuntu-Regular', fontSize: 12 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontFamily: 'Archivo-Black', fontSize: 18 },
  scoreLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 10 }
});