import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore'; 
import { Colors } from '../../constants/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const { allTimeHistory } = useQuizStore();
  const { theme, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const userFilteredHistory = useMemo(() => {
    return (allTimeHistory || []).filter(item => {
      // 1. Explicitly check if it matches the current logged in user
      if (user?.uid && item.userId === user.uid) return true;
      
      // 2. Safe Fallback for existing debug/legacy mock data
      if (item.userId === 'anonymous' || !item.hasOwnProperty('userId')) return true;

      return false;
    });
  }, [allTimeHistory, user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent Quiz';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent Quiz'; 

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderHistoryItem = ({ item }) => {
    const totalQuestions = item.totalQuestions || 1; // Safeguard division by zero
    const percentage = Math.round((item.correct / totalQuestions) * 100);
    
    return (
      <View style={[styles.historyCard, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? theme.border : Colors.secondary + '20' }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {formatDate(item.date || item.timestamp)}
            </Text>
            <Text style={[styles.categoryText, { color: theme.text }]}>
              {item.category ? item.category.toUpperCase() : 'Assessment'} Completed
            </Text>
          </View>
          <View style={[styles.percentageBadge, { backgroundColor: isDarkMode ? '#1E293B' : theme.primary + '10' }]}>
            <Text style={[styles.percentageText, { color: theme.primary }]}>{percentage}%</Text>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: isDarkMode ? theme.background : '#FBFBFB' }]}>
          <View style={styles.statDetail}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Score</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{item.score} pts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statDetail}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Correct</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{item.correct}/{item.totalQuestions}</Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="journal-outline" size={80} color={isDarkMode ? theme.border : "#E0E0E0"} />
      <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No History Yet</Text>
      <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Complete a quiz to see your performance history here.</Text>
      <TouchableOpacity 
        style={[styles.startBtn, { backgroundColor: theme.primary }]} 
        onPress={() => router.push('/(main)')}
      >
        <Text style={styles.startBtnText}>Start a Quiz</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quiz History</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Tracking your growth over time</Text>
      </View>

      <FlatList
        data={userFilteredHistory}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 25, 
    borderBottomWidth: 1, 
  },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 26 },
  headerSub: { fontFamily: 'Ubuntu-Regular', fontSize: 14, marginTop: 4 },
  listContent: { padding: 20, paddingBottom: 100 },
  historyCard: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerInfo: { flex: 1, marginLeft: 15 },
  dateText: { fontFamily: 'Ubuntu-Regular', fontSize: 12 },
  categoryText: { fontFamily: 'Ubuntu-Bold', fontSize: 16, marginTop: 2 },
  percentageBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  percentageText: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderRadius: 12, 
    padding: 15 
  },
  statDetail: { flex: 1, alignItems: 'center' },
  statLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 11, marginBottom: 4 },
  statValue: { fontFamily: 'Archivo-Black', fontSize: 16 },
  statDivider: { width: 1, height: '100%' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontFamily: 'Archivo-Black', fontSize: 20, marginTop: 20 },
  emptySub: { fontFamily: 'Ubuntu-Regular', fontSize: 14, textAlign: 'center', paddingHorizontal: 50, marginTop: 8 },
  startBtn: { 
    marginTop: 25, 
    paddingHorizontal: 30, 
    paddingVertical: 12, 
    borderRadius: 25 
  },
  startBtnText: { color: '#FFF', fontFamily: 'Ubuntu-Bold' }
});