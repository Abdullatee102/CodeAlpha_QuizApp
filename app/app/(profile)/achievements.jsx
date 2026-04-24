import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useQuizStore } from '../../store/quizStore';

export default function AchievementScreen() {
  const router = useRouter();
  const { allTimeHistory, totalScore, streak } = useQuizStore();

  const ACHIEVEMENTS = useMemo(() => [
    { 
      id: '1', title: 'Fast Learner', desc: 'Complete 5 quizzes', icon: 'speedometer', color: '#4834D4',
      unlocked: (allTimeHistory?.length || 0) >= 5 
    },
    { 
      id: '2', title: 'Perfect Score', desc: 'Get 100% in any quiz', icon: 'trophy', color: '#FF9F43',
      unlocked: allTimeHistory?.some(quiz => quiz.score === 100) 
    },
    { 
      id: '3', title: 'Scholar Status', desc: 'Reach 1000 Total Pts', icon: 'school', color: '#6AB04C',
      unlocked: (totalScore || 0) >= 1000 
    },
    { 
      id: '4', title: 'Math Master', desc: 'Complete 10 Math quizzes', icon: 'calculator', color: '#27AE60',
      unlocked: allTimeHistory?.filter(q => q.category === 'maths').length >= 10
    },
    { 
      id: '5', title: 'Consistency', desc: 'Achieve a 7-day streak', icon: 'fire', color: '#FF5E57',
      unlocked: (streak || 0) >= 7
    },
    { 
      id: '6', title: 'Night Owl', desc: 'Take a quiz after 10PM', icon: 'weather-moonset', color: '#EB4D4B',
      unlocked: allTimeHistory?.some(quiz => {
        const hour = new Date(quiz.timestamp).getHours();
        return hour >= 22 || hour <= 4;
      })
    },
  ], [allTimeHistory, totalScore, streak]);

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.unlocked && styles.lockedCard]}>
      <View style={[styles.iconBox, { backgroundColor: item.unlocked ? item.color + '20' : '#F5F5F5' }]}>
        <MaterialCommunityIcons 
          name={item.unlocked ? item.icon : 'lock'} 
          size={32} 
          color={item.unlocked ? item.color : '#CCC'} 
        />
      </View>
      <Text style={[styles.title, !item.unlocked && { color: '#AAA' }]}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
      {item.unlocked && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#27AE60" />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={ACHIEVEMENTS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 20, color: Colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  card: { backgroundColor: '#FFF', width: '47%', borderRadius: 22, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0', elevation: 2 },
  lockedCard: { backgroundColor: '#FAFAFA', borderColor: '#EEE', opacity: 0.8 },
  iconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: 'Ubuntu-Bold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  desc: { fontFamily: 'Ubuntu-Regular', fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4 },
  checkBadge: { position: 'absolute', top: 10, right: 10 }
});