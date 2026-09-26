import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../../utils/mmkvStorage';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

export default function SecurityScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();
  const { user, refreshToken, setBiometricEnabled: setStoreBiometric } = useAuthStore();
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const userKey = user?.email || user?.uid || 'default';

  useEffect(() => {
    checkDeviceSupport();
    loadBiometricSetting();
  }, [userKey]);

  const checkDeviceSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    setIsBiometricSupported(compatible && types.length > 0);
  };

  const loadBiometricSetting = async () => {
    try {
      const saved = storage.getString(`useBiometrics_${userKey}`) || (await AsyncStorage.getItem(`useBiometrics_${userKey}`));
      setIsBiometricEnabled(saved === 'true');
    } catch (err) {
      console.error("Failed to load biometric setting:", err);
    }
  };

  const toggleBiometric = async (value) => {
    if (value) {
      if (!isBiometricSupported) {
        Alert.alert("Not Supported", "Your device does not support biometric authentication.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Identity to Enable',
        fallbackLabel: 'Enter Passcode',
      });

      if (result.success) {
        try {
          storage.set(`useBiometrics_${userKey}`, 'true');
          await AsyncStorage.setItem(`useBiometrics_${userKey}`, 'true');
          setStoreBiometric(true);
          
          const activeRefresh = refreshToken || storage.getString('refreshToken') || (await AsyncStorage.getItem('refreshToken'));
          if (activeRefresh) {
            storage.set('biometricRefreshToken', activeRefresh);
            await AsyncStorage.setItem('biometricRefreshToken', activeRefresh);
          }

          if (user?.email) {
            storage.set('lastUserEmail', user.email);
            await AsyncStorage.setItem('lastUserEmail', user.email);
          }
          setIsBiometricEnabled(true);
          Alert.alert("Success", "Biometric login enabled!");
        } catch (err) {
          Alert.alert("Error", "Could not save biometric preference.");
          setIsBiometricEnabled(false);
          setStoreBiometric(false);
        }
      } else {
        setIsBiometricEnabled(false);
      }
    } else {
      try {
        storage.set(`useBiometrics_${userKey}`, 'false');
        await AsyncStorage.setItem(`useBiometrics_${userKey}`, 'false');
        setStoreBiometric(false);
        storage.delete('biometricRefreshToken');
        await AsyncStorage.removeItem('biometricRefreshToken');
        setIsBiometricEnabled(false);
      } catch (err) {
        console.error("Failed to update biometric setting:", err);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Security</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Login Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="finger-print" size={22} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 15 }}>
              <Text style={[styles.rowText, { color: theme.text }]}>Biometric Login</Text>
              <Text style={styles.rowSubText}>TouchID or FaceID</Text>
            </View>
          </View>
          <Switch 
            value={isBiometricEnabled} 
            onValueChange={toggleBiometric}
            trackColor={{ false: isDarkMode ? "#333" : "#eee", true: theme.primary }}
            thumbColor={Platform.OS === 'android' ? (isBiometricEnabled ? theme.primary : '#ccc') : undefined}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  title: { fontFamily: 'Archivo-Black', fontSize: 22 },
  content: { padding: 25 },
  sectionLabel: { fontFamily: 'Ubuntu-Bold', fontSize: 13, color: '#999', textTransform: 'uppercase', marginBottom: 15 },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rowText: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  rowSubText: { fontFamily: 'Ubuntu-Regular', fontSize: 12, color: '#999' },
});