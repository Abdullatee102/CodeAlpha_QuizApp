import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore'; 

export default function AchievementScreen() {
  const router = useRouter();
  const { allTimeHistory, unlockedAchievements, fetchAchievements } = useQuizStore();
  const { theme, isDarkMode } = useThemeStore(); 
  const { user, profile } = useAuthStore(); 

  const [isLoading, setIsLoading] = useState(true);

  const activeUserId = user?.id || user?.uid;

  useEffect(() => {
    let isMounted = true;
    const loadAchievementsData = async () => {
      if (typeof fetchAchievements === 'function') {
        try {
          await fetchAchievements();
        } catch (error) {
          console.error('Failed to sync achievements:', error);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadAchievementsData();

    return () => {
      isMounted = false;
    };
  }, [fetchAchievements]);

  const currentUserHistory = useMemo(() => {
    return (allTimeHistory || []).filter(quiz => {
      if (!quiz.userId || quiz.userId === 'local' || quiz.userId === 'synced') return true;
      if (!activeUserId) return true;
      return String(quiz.userId) === String(activeUserId);
    });
  }, [allTimeHistory, activeUserId]);

  const userTotalScore = profile?.totalScore ?? currentUserHistory.reduce((acc, q) => acc + (q.score || 0), 0);
  const userStreak = profile?.streak || 0;

  const activeUserUnlockedIds = useMemo(() => {
    const rawIds = unlockedAchievements || [];
    
    return rawIds.map(item => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      return String(item.achievementKey || item.key || item.id || '');
    });
  }, [unlockedAchievements]);

  const ACHIEVEMENTS = useMemo(() => [
    { 
      id: '1', title: 'Fast Learner', desc: 'Complete 5 quizzes', icon: 'speedometer', color: '#4834D4',
      unlocked: activeUserUnlockedIds.includes('1') || currentUserHistory.length >= 5
    },
    { 
      id: '2', title: 'Perfect Score', desc: 'Get 100% in any quiz', icon: 'trophy', color: '#FF9F43',
      unlocked: activeUserUnlockedIds.includes('2') || currentUserHistory.some(quiz => {
        const total = quiz.totalQuestions || 1;
        const correctCount = quiz.correct ?? quiz.correctAnswers ?? 0;
        const percentage = Math.round((correctCount / total) * 100);
        return percentage === 100 || quiz.score === 100;
      }) 
    },
    { 
      id: '3', title: 'Scholar Status', desc: 'Reach 1000 Total Pts', icon: 'school', color: '#6AB04C',
      unlocked: activeUserUnlockedIds.includes('3') || userTotalScore >= 1000 
    },
    { 
      id: '4', title: 'Math Master', desc: 'Complete 10 Math quizzes', icon: 'calculator', color: '#27AE60',
      unlocked: activeUserUnlockedIds.includes('4') || currentUserHistory.filter(q => {
        const cat = q.category?.toLowerCase() || '';
        return cat.includes('math');
      }).length >= 10
    },
    { 
      id: '5', title: 'Consistency', desc: 'Achieve a 7-day streak', icon: 'fire', color: '#FF5E57',
      unlocked: activeUserUnlockedIds.includes('5') || userStreak >= 7
    },
    { 
      id: '6', title: 'Night Owl', desc: 'Take a quiz after 10PM', icon: 'weather-moonset', color: '#EB4D4B',
      unlocked: activeUserUnlockedIds.includes('6') || currentUserHistory.some(quiz => {
        const dateObj = quiz.date ? new Date(quiz.date) : (quiz.timestamp ? new Date(quiz.timestamp) : (quiz.createdAt ? new Date(quiz.createdAt) : null));
        if (!dateObj || isNaN(dateObj.getTime())) return false;
        const hour = dateObj.getHours();
        return hour >= 22 || hour <= 4;
      })
    },
  ], [currentUserHistory, userTotalScore, userStreak, activeUserUnlockedIds]);

  const renderItem = ({ item }) => (
    <View style={[
      styles.card, 
      { backgroundColor: theme.card, borderColor: theme.border },
      !item.unlocked && (isDarkMode ? styles.lockedCardDark : styles.lockedCardLight)
    ]}>
      <View style={[styles.iconBox, { backgroundColor: item.unlocked ? item.color + '20' : (isDarkMode ? '#334155' : '#F5F5F5') }]}>
        <MaterialCommunityIcons 
          name={item.unlocked ? item.icon : 'lock'} 
          size={32} 
          color={item.unlocked ? item.color : (isDarkMode ? '#64748B' : '#CCC')} 
        />
      </View>
      <Text style={[styles.title, { color: theme.text }, !item.unlocked && { color: isDarkMode ? '#64748B' : '#AAA' }]}>
        {item.title}
      </Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>{item.desc}</Text>
      {item.unlocked && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#27AE60" />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary || '#4834D4'} />
        </View>
      ) : (
        <FlatList
          data={ACHIEVEMENTS}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 20 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  card: { width: '47%', borderRadius: 22, padding: 20, alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  lockedCardLight: { backgroundColor: '#FAFAFA', opacity: 0.7 },
  lockedCardDark: { backgroundColor: '#1E293B', opacity: 0.6 },
  iconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: 'Ubuntu-Bold', fontSize: 14, textAlign: 'center' },
  desc: { fontFamily: 'Ubuntu-Regular', fontSize: 10, textAlign: 'center', marginTop: 4 },
  checkBadge: { position: 'absolute', top: 10, right: 10 }
});