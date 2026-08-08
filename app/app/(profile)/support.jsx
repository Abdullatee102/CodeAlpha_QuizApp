import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function HelpCenter() {
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();

  const FAQItem = ({ question, answer }) => (
    <TouchableOpacity style={[
      styles.faqCard, 
      { 
        backgroundColor: theme.card, 
        borderColor: theme.border 
      }
    ]}>
      <Text style={[styles.question, { color: theme.text }]}>{question}</Text>
      <Text style={[styles.answer, { color: theme.textSecondary }]}>{answer}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Support</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity 
            style={[
              styles.contactBtn, 
              { backgroundColor: theme.primary + '15' }
            ]} 
            onPress={() => Linking.openURL('mailto:opeabdullateef74@gmail.com')}
          >
            <Ionicons name="mail" size={24} color={theme.primary} />
            <Text style={[styles.contactLabel, { color: theme.primary }]}>Email Us</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.contactBtn, 
              { backgroundColor: theme.primary + '15' }
            ]} 
            onPress={() => router.push('/(profile)/live-chat')}
          >
            <Ionicons name="chatbubbles" size={24} color={theme.primary} />
            <Text style={[styles.contactLabel, { color: theme.primary }]}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>Frequently Asked Questions</Text>
        
        <FAQItem 
          question="How are points calculated?" 
          answer="You earn 10 points for every correct answer. Bonus points are awarded for finishing with more than 50% time remaining." 
        />
        <FAQItem 
          question="Can I retake a quiz?" 
          answer="Yes! You can retake any subject to improve your score. Only your highest score will appear on the leaderboard." 
        />
        <FAQItem 
          question="Biometrics not working?" 
          answer="Ensure you have enabled Fingerprint/FaceID in your phone settings and allowed the app permission in the Security screen." 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 20 },
  sectionTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 16, marginBottom: 15 },
  contactRow: { flexDirection: 'row', gap: 15 },
  contactBtn: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center' },
  contactLabel: { fontFamily: 'Ubuntu-Medium', fontSize: 12, marginTop: 8 },
  faqCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15 },
  question: { fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  answer: { fontFamily: 'Ubuntu-Regular', fontSize: 13, marginTop: 8, lineHeight: 20 }
});