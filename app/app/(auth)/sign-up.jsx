import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/colors';
import { GlobalStyles } from '../../constants/styles';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  
  const { signUp, googleAuth, loading, error, githubLogin } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore(); 
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Missing Fields", "Please fill in all details.");
      return;
    }
    const res = await signUp(email, password, fullName);
    if (res?.success) router.replace('/(auth)/verify-email');
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch (e) {}
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken || signInResult.idToken;
      if (!idToken) throw new Error("No ID Token found");
      const res = await googleAuth(idToken);
      if (res) router.replace('/(main)');
    } catch (err) {
      if (err.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert("Google Error", err.message);
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[GlobalStyles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join Brain Buzz and start your assessment journey.</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            style={[
              GlobalStyles.inputField, 
              { 
                backgroundColor: theme.card, 
                borderColor: theme.border, 
                color: theme.text 
              }
            ]}
            value={fullName}
            onChangeText={setFullName}
          />
          
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
          
          {/* Password Toggle Wrapper */}
          <View style={[
            styles.passwordWrapper, 
            { 
              backgroundColor: theme.card, 
              borderColor: theme.border 
            }
          ]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
              style={[
                GlobalStyles.inputField, 
                { 
                  flex: 1, 
                  marginBottom: 0, 
                  borderWidth: 0, 
                  backgroundColor: 'transparent',
                  color: theme.text 
                }
              ]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity 
          style={[
            GlobalStyles.primaryBtn, 
            { backgroundColor: theme.primary },
            (loading || socialLoading) && { opacity: 0.7 }
          ]} 
          onPress={handleSignUp}
          disabled={loading || socialLoading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={GlobalStyles.btnText}>Sign Up</Text>}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR CONTINUE WITH</Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>

        {/* Dynamic, Matching Social Row layout */}
        <View style={styles.socialRow}>
          <TouchableOpacity 
            style={[
              styles.socialBtn, 
              { 
                backgroundColor: theme.primary + '15', 
                borderColor: theme.primary 
              }
            ]} 
            onPress={handleGoogleSignUp} 
            disabled={loading || socialLoading}
          >
            {socialLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color={theme.primary} />
                <Text style={[styles.socialLabel, { color: theme.text }]}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.socialBtn, 
              { 
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5', 
                borderColor: theme.border 
              }
            ]} 
            onPress={githubLogin} 
            disabled={loading || socialLoading}
          >
            <Ionicons name="logo-github" size={24} color={theme.text} />
            <Text style={[styles.socialLabel, { color: theme.text }]}>GitHub</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 25, justifyContent: 'center', flexGrow: 1 },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 32, marginBottom: 10 },
  subtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 16, marginBottom: 30 },
  form: { marginTop: 10, marginBottom: 20 },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 15,
    marginBottom: 15,
  },
  eyeIcon: { padding: 5 },
  errorText: { color: Colors.error, fontFamily: 'Ubuntu-Medium', marginBottom: 10, textAlign: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 10, fontFamily: 'Ubuntu-Medium', fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  socialBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    padding: 16, 
    borderRadius: 15, 
    borderWidth: 1, 
    minHeight: 60 
  },
  socialLabel: { fontFamily: 'Ubuntu-Medium' },
  footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: 'Ubuntu-Regular' },
  linkText: { fontFamily: 'Ubuntu-Bold' }
});