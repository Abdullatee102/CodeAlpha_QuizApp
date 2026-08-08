import React from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={theme.text} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Terms of Service</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>Effective: January 2026</Text>
        
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          By using Brain Buzz, you agree to these terms. If you do not agree, please do not use the application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>2. Academic Integrity</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Brain Buzz is a learning aid. We encourage users to answer questions honestly to get an accurate reflection of their knowledge levels.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>3. Prohibited Use</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Users are prohibited from attempting to scrape questions, bypass security features, or manipulate the global leaderboard scores.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 20 },
  content: { paddingHorizontal: 25, paddingBottom: 40 },
  title: { fontFamily: 'Archivo-Black', fontSize: 28 },
  date: { fontFamily: 'Ubuntu-Regular', fontSize: 14, marginTop: 5, marginBottom: 30 },
  sectionTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18, marginTop: 20, marginBottom: 10 },
  body: { fontFamily: 'Ubuntu-Regular', fontSize: 15, lineHeight: 24 }
});