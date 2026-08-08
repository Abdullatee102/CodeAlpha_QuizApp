import React, { useState } from 'react';
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
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore'; 
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const { user, profile, fetchProfile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  // State fields
  const [name, setName] = useState(profile?.fullName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert("Error", "Full Name cannot be empty");
    if (!username.trim()) return Alert.alert("Error", "Username cannot be empty");
    
    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      await setDoc(userRef, { 
        fullName: name.trim(), 
        username: username.trim().toLowerCase(), 
        phone: phone.trim(),
        bio: bio.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // To refresh the local Zustand store state
      await fetchProfile(user.uid);
      
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        {/* Custom Header Bar */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          
          {/* Email Address (Read-Only) */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address </Text>
            <View style={[
              styles.input, 
              styles.disabledInput, 
              { 
                backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F3F5', 
                borderColor: theme.border 
              }
            ]}>
              <Text style={[styles.disabledText, { color: theme.textSecondary }]}>{profile?.email || user?.email}</Text>
              <MaterialCommunityIcons name="lock-outline" size={18} color={theme.textSecondary} />
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
              ]} 
              value={name} 
              onChangeText={setName} 
              placeholder="Enter your full name"
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
            />
          </View>

          {/* Username */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
              ]} 
              value={username} 
              onChangeText={setUsername} 
              placeholder="e.g. johnson"
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
              ]} 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="Enter your phone number"
              placeholderTextColor={isDarkMode ? '#555' : '#999'}
              keyboardType="phone-pad"
            />
          </View>

          {/* Bio / Description */}
          <View style={styles.formControl}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>About Me</Text>
            <TextInput 
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: theme.card, 
                  borderColor: theme.border, 
                  color: theme.text 
                }
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

          {/* Save Button */}
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