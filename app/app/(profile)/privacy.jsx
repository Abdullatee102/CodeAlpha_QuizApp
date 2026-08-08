import React from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={theme.text} />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>Last Updated: April 2026</Text>
        
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>1. Data Collection</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We collect information to provide better services to our users. This includes profile details, quiz scores, and academic progress tracking.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>2. Biometric Data</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Brain Buzz does not store your actual fingerprint or face data. We use system-level APIs to confirm your identity; your biometric data stays on your device.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>3. Account Deletion</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          You can request account deletion at any time via the support menu. All your progress and personal data will be purged from our cloud servers.
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