import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore'; 
import { useAuthStore } from '../../store/authStore';
import { GlobalStyles } from '../../constants/styles';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore(); 
  const { changePassword, isLoading } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      return Alert.alert("Error", "Please enter your current password.");
    }
    if (!newPassword || newPassword.length < 6) {
      return Alert.alert("Error", "New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New passwords do not match.");
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      Alert.alert("Success", "Password updated successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", result.error || "Failed to update password.");
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
          Change Password
        </Text>
        <Text style={[GlobalStyles.subtitle, { textAlign: 'center', marginTop: 10, color: theme.textSecondary }]}>
          Enter your current password and a secure new password below.
        </Text>

        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={[styles.passwordContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              placeholder="Current Password"
              placeholderTextColor={isDarkMode ? '#555' : '#aaa'}
              secureTextEntry={!showCurrent}
              style={[styles.passwordInput, { color: theme.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
              <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={[styles.passwordContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              placeholder="New Password"
              placeholderTextColor={isDarkMode ? '#555' : '#aaa'}
              secureTextEntry={!showNew}
              style={[styles.passwordInput, { color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Confirm New Password */}
          <View style={[styles.passwordContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor={isDarkMode ? '#555' : '#aaa'}
              secureTextEntry={!showConfirm}
              style={[styles.passwordInput, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[GlobalStyles.primaryBtn, { backgroundColor: theme.primary, marginTop: 10 }]} 
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={GlobalStyles.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
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
});