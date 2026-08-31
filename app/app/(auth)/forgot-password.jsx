import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore'; 
import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const { forgotPassword, sendOTP, loading } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore(); 
  const router = useRouter();

  const handleReset = async () => {
    if (!identifier.trim()) {
      return Alert.alert("Required", "Please enter your email address or phone number.");
    }

    const value = identifier.trim();
    const isEmail = value.includes('@');

    if (isEmail) {
      const res = await forgotPassword(value);
      if (res?.success) {
        Alert.alert("Success", "Reset code sent to your email.", [
          { 
            text: "OK", 
            onPress: () => router.push({ 
              pathname: '/(auth)/verify-email', 
              params: { identifier: value, flow: 'reset' } 
            }) 
          }
        ]);
      } else {
        Alert.alert("Error", res?.error || res?.msg || "Failed to send reset code.");
      }
    } else {
      const res = await sendOTP(value);
      if (res?.success) {
        Alert.alert("Success", "OTP sent to your phone number.", [
          { 
            text: "OK", 
            onPress: () => router.push({ 
              pathname: '/(auth)/verify-email', 
              params: { identifier: value, flow: 'reset' } 
            }) 
          }
        ]);
      } else {
        Alert.alert("Error", res?.error || res?.msg || "Failed to send OTP.");
      }
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[GlobalStyles.headerTitle, { color: theme.primary }]}>Reset Password</Text>
          <Text style={[GlobalStyles.subtitle, { color: theme.textSecondary }]}>
            Enter your email address or phone number and we'll help you get back into your account.
          </Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email Address or Phone Number"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
              style={[
                GlobalStyles.inputField,
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
              ]}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />

            <TouchableOpacity 
              style={[
                GlobalStyles.primaryBtn, 
                { backgroundColor: theme.primary },
                loading && { opacity: 0.7 }
              ]} 
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={GlobalStyles.btnText}>Send Reset Instructions</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { marginHorizontal: 15, flexGrow: 0.8, justifyContent: 'center', paddingBottom: 50 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20, paddingBottom: 70, marginTop: -170, marginLeft: -4 },
  form: { marginTop: 15, marginBottom: 10, justifyContent: 'center' },
});