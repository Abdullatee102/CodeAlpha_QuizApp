import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore'; 
import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmail() {
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore(); 

  const openEmailApp = () => {
    Linking.openURL('mailto:');
  };

  return (
    <SafeAreaView style={[GlobalStyles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.iconCircle, 
          { backgroundColor: isDarkMode ? '#1E293B' : theme.primary + '15' }
        ]}>
          <MaterialCommunityIcons name="email-check-outline" size={60} color={theme.primary} />
        </View>

        <Text style={[GlobalStyles.headerTitle, { textAlign: 'center', color: theme.primary }]}>Check Your Email</Text>
        <Text style={[GlobalStyles.subtitle, { textAlign: 'center', marginTop: 10, color: theme.textSecondary }]}>
          We've sent a verification link to your email address. Please click the link to secure your account.
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={[GlobalStyles.primaryBtn, { backgroundColor: theme.primary }]} onPress={openEmailApp}>
            <Text style={GlobalStyles.btnText}>Open Email App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.card }]} 
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Didn't receive an email? <Text style={[styles.resendLink, { color: theme.primary }]}>Resend</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 40,
    gap: 15,
  },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  footerText: {
    marginTop: 40,
    fontFamily: 'Ubuntu-Regular',
  },
  resendLink: {
    fontFamily: 'Ubuntu-Bold',
  }
});