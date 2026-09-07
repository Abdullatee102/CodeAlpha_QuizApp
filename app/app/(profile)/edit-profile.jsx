import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const { user, profile, updateProfile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [updating, setUpdating] = useState(false);

  const source = profile || user || {};

  const initialEmailRef = useRef(source.email || '');
  const initialPhoneRef = useRef(source.phoneNumber || source.phone || '');

  const isEmailLocked = Boolean(initialEmailRef.current);
  const isPhoneLocked = Boolean(initialPhoneRef.current);

  useEffect(() => {
    if (source) {
      setName(source.fullName || source.name || '');
      setUsername(source.username || '');
      setPhone(source.phoneNumber || source.phone || '');
      setEmail(source.email || '');
      setBio(source.bio || '');
    }
  }, [profile, user]);

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert("Error", "Full Name cannot be empty");
    if (!username.trim()) return Alert.alert("Error", "Username cannot be empty");

    // Check if the user is adding or modifying an empty/missing email or phone for the first time
    const isEmailBeingSet = !initialEmailRef.current && email.trim() !== '';
    const isPhoneBeingSet = !initialPhoneRef.current && phone.trim() !== '';

    if (isEmailBeingSet || isPhoneBeingSet) {
      let confirmationMessage = "Please double-check your details carefully. Once you save ";
      if (isEmailBeingSet && isPhoneBeingSet) {
        confirmationMessage += "both your email address and phone number, they will be permanently locked and cannot be changed here again.";
      } else if (isEmailBeingSet) {
        confirmationMessage += "your email address, it will be permanently locked and cannot be changed here again.";
      } else {
        confirmationMessage += "your phone number, it will be permanently locked and cannot be changed here again.";
      }

      Alert.alert(
        "Confirm Contact Details",
        confirmationMessage,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed & Lock", onPress: () => executeUpdate() }
        ]
      );
    } else {
      executeUpdate();
    }
  };

  const executeUpdate = async () => {
    setUpdating(true);
    const updatePayload = {
      fullName: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
    };

    if (!isEmailLocked && email.trim()) {
      updatePayload.email = email.trim().toLowerCase();
    }
    if (!isPhoneLocked && phone.trim()) {
      updatePayload.phoneNumber = phone.trim();
    }

    const result = await updateProfile(updatePayload);
    setUpdating(false);

    if (result.success) {
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } else {
      Alert.alert("Error", result.error || "Failed to update profile.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          
          {/* Email Address Field */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            {isEmailLocked ? (
              <View style={[
                styles.input, 
                styles.disabledInput, 
                { 
                  backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5', 
                  borderColor: theme.border 
                }
              ]}>
                <Text style={[styles.disabledText, { color: theme.textSecondary }]}>{email || 'Not provided'}</Text>
                <MaterialCommunityIcons name="lock-outline" size={18} color={theme.textSecondary} />
              </View>
            ) : (
              <TextInput 
                style={[
                  styles.input, 
                  { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
                ]} 
                value={email} 
                onChangeText={setEmail} 
                placeholder="Enter your email address"
                placeholderTextColor={isDarkMode ? '#555' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </View>

          {/* Full Name Field */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput 
              style={[
                styles.input, 
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
              ]} 
              value={name} 
              onChangeText={setName} 
              placeholder="Enter your full name"
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
            />
          </View>

          {/* Username Field */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
            <TextInput 
              style={[
                styles.input, 
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
              ]} 
              value={username} 
              onChangeText={setUsername} 
              placeholder="e.g. opeyemi_12"
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number Field */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
            {isPhoneLocked ? (
              <View style={[
                styles.input, 
                styles.disabledInput, 
                { 
                  backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5', 
                  borderColor: theme.border 
                }
              ]}>
                <Text style={[styles.disabledText, { color: theme.textSecondary }]}>{phone || 'Not provided'}</Text>
                <MaterialCommunityIcons name="lock-outline" size={18} color={theme.textSecondary} />
              </View>
            ) : (
              <TextInput 
                style={[
                  styles.input, 
                  { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
                ]} 
                value={phone} 
                onChangeText={setPhone} 
                placeholder="Enter your phone number"
                placeholderTextColor={isDarkMode ? '#555' : '#999'}
                keyboardType="phone-pad"
              />
            )}
          </View>

          {/* About Me Field */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>About Me</Text>
            <TextInput 
              style={[
                styles.input, 
                styles.textArea, 
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
              ]} 
              value={bio} 
              onChangeText={setBio} 
              placeholder="Tell us a bit about yourself..."
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.btn, 
              { backgroundColor: theme.primary },
              updating && { opacity: 0.7 }
            ]} 
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  scrollContainer: { paddingHorizontal: 25, paddingVertical: 20 },
  formControl: { marginBottom: 20 },
  label: { fontFamily: 'Ubuntu-Bold', fontSize: 13, marginBottom: 8 },
  input: { 
    padding: 15, 
    borderRadius: 12, 
    fontFamily: 'Ubuntu-Regular', 
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: { minHeight: 100, paddingTop: 15 },
  disabledInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  disabledText: { fontFamily: 'Ubuntu-Regular', fontSize: 15 },
  btn: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40
  },
  btnText: { color: '#fff', fontFamily: 'Ubuntu-Bold', fontSize: 16 }
});