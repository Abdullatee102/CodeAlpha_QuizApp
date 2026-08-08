import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore'; // 1. Import Theme Store
import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore(); // 2. Consume active theme
  const router = useRouter();

  const handleReset = async () => {
    if (!email.trim()) return Alert.alert("Required", "Please enter your email address.");
    
    const res = await forgotPassword(email.trim());
    if (res.success) {
      Alert.alert("Success", "Reset link sent to your email.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", res.msg);
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
            Enter your email address and we'll send you a link to get back into your account.
          </Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
              style={[
                GlobalStyles.inputField,
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
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
                <Text style={GlobalStyles.btnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 25, flexGrow: 0.2, justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20, padding: 4, marginLeft: -4 },
  form: { marginTop: 25, marginBottom: 40 },
});