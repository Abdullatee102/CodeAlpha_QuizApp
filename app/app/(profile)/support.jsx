import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function HelpCenter() {
  const router = useRouter();
  const { theme } = useThemeStore();

  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setExpandedFAQ((current) => (current === index ? null : index));
  };

  const FAQItem = ({ index, question, answer }) => {
    const isExpanded = expandedFAQ === index;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.faqCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => toggleFAQ(index)}
      >
        <View style={styles.questionRow}>
          <Text style={[styles.question, { color: theme.text }]}>
            {question}
          </Text>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        </View>

        {isExpanded && (
          <Text style={[styles.answer, { color: theme.textSecondary }]}>
            {answer}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const handleEmailSupport = async () => {
    try {
      await Linking.openURL('mailto:opeabdullateef12@gmail.com');
    } catch (error) {
      console.error('[HELP CENTER] Failed to open email:', error);
    }
  };

  const handleLiveChat = () => {
    router.push('/(profile)/live-chat');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: theme.primary },
          ]}
        >
          Help Center
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Support */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text },
          ]}
        >
          Contact Support
        </Text>

        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[
              styles.contactBtn,
              {
                backgroundColor: theme.primary + '15',
              },
            ]}
            onPress={handleEmailSupport}
            activeOpacity={0.8}
          >
            <Ionicons
              name="mail"
              size={24}
              color={theme.primary}
            />

            <Text
              style={[
                styles.contactLabel,
                { color: theme.primary },
              ]}
            >
              Email Us
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.contactBtn,
              {
                backgroundColor: theme.primary + '15',
              },
            ]}
            onPress={handleLiveChat}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubbles"
              size={24}
              color={theme.primary}
            />

            <Text
              style={[
                styles.contactLabel,
                { color: theme.primary },
              ]}
            >
              Live Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.text,
              marginTop: 30,
            },
          ]}
        >
          Frequently Asked Questions
        </Text>

        <FAQItem
          index={0}
          question="How are quiz points calculated?"
          answer="Your score is based on the questions you answer correctly. Each quiz records your score, number of correct answers, and total number of questions."
        />

        <FAQItem
          index={1}
          question="Can I retake a quiz?"
          answer="Yes. You can take a quiz again whenever it is available. Each completed attempt can be recorded in your quiz history."
        />

        <FAQItem
          index={2}
          question="How do I choose a course for a quiz?"
          answer="Select your faculty first, then choose your department and course. Brain Buzz uses your selected course to load the questions available for that quiz."
        />

        <FAQItem
          index={3}
          question="How does the leaderboard work?"
          answer="The leaderboard displays users based on their recorded quiz performance for the selected leaderboard period."
        />

        <FAQItem
          index={4}
          question="How do I update my profile?"
          answer="Go to Settings, select Edit Profile, make your changes, and save them. Your updated profile information will be synced with your account."
        />

        <FAQItem
          index={5}
          question="What should I do if biometric security is not working?"
          answer="Make sure fingerprint or Face ID is enabled on your device and that Brain Buzz has the required permission. You can also check the Security section in Settings."
        />

        <FAQItem
          index={6}
          question="I found a problem with the app. What should I do?"
          answer="Please contact support through Email Us or Live Chat and describe the issue. Including what you were doing when the problem occurred can help us investigate it faster."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  content: {
    padding: 25,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginBottom: 15,
  },

  contactRow: {
    flexDirection: 'row',
    gap: 15,
  },

  contactBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },

  contactLabel: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    marginTop: 8,
  },

  faqCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  question: {
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
  },

  answer: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 20,
  },
});