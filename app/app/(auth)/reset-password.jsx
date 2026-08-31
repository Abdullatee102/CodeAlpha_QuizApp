import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore'; 
import { GlobalStyles } from '../../constants/styles';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from '../../store/authStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const identifier = params?.identifier || '';

  const { theme, isDarkMode } = useThemeStore(); 
  const { resetPassword, loading } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    const res = await resetPassword(identifier, newPassword);
    if (res?.success) {
      Alert.alert("Success", "Password updated successfully. You can now sign in.", [
        { text: "Sign In", onPress: () => router.replace('/(auth)/sign-in') }
      ]);
    } else {
      Alert.alert("Error", res?.msg || "Failed to update password.");
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={[
          styles.iconCircle, 
          { backgroundColor: isDarkMode ? '#1E293B' : theme.primary + '15' }
        ]}>
          <MaterialCommunityIcons name="lock-reset" size={60} color={theme.primary} />
        </View>

        <Text style={[GlobalStyles.headerTitle, { textAlign: 'center', color: theme.primary }]}>
          Create New Password
        </Text>
        <Text style={[GlobalStyles.subtitle, { textAlign: 'center', marginTop: 10, color: theme.textSecondary }]}>
          Your code has been verified. Enter your new password below for {identifier}.
        </Text>

        <View style={styles.formSection}>
          <View style={[
            styles.passwordContainer, 
            { backgroundColor: theme.card, borderColor: theme.border }
          ]}>
            <TextInput
              placeholder="New Password"
              placeholderTextColor={isDarkMode ? '#555' : '#aaa'}
              secureTextEntry={!showPassword}
              style={[styles.passwordInput, { color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.passwordContainer, 
            { backgroundColor: theme.card, borderColor: theme.border }
          ]}>
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor={isDarkMode ? '#555' : '#aaa'}
              secureTextEntry={!showConfirmPassword}
              style={[styles.passwordInput, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[GlobalStyles.primaryBtn, { backgroundColor: theme.primary, marginTop: 5 }]} 
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={GlobalStyles.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.card, marginTop: 15 }]} 
          onPress={() => router.replace('/(auth)/sign-in')}
        >
          <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: -10,
    marginLeft: -4,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  formSection: {
    width: '100%',
    marginTop: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  secondaryBtnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
});