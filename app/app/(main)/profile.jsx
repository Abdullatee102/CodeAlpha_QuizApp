import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore'; // Imported theme store
import { Colors } from '../../constants/colors';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';

export default function ProfileScreen() {
  const { user, profile, fetchProfile } = useAuthStore();
  const { results } = useQuizStore(); 
  const { theme, isDarkMode } = useThemeStore(); // Consumer hook
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  // Syncing stats exactly like HomeScreen
  const totalQuizzes = profile?.quizzesCompleted || results.history?.length || 0;
  const totalScore = profile?.totalScore || results.totalScore || 0; 
  const correctAnswers = profile?.totalCorrect || results.correct || 0;

  const userInitial = (profile?.fullName || user?.displayName || 'S').charAt(0).toUpperCase();
  const profileImage = profile?.photoURL || user?.photoURL;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri) => {
    setUploading(true);
    try {
      await updateAuthProfile(auth.currentUser, { photoURL: uri });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: uri });
      await fetchProfile(user.uid);
      Alert.alert("Success", "Avatar updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Identity Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initialAvatar, { backgroundColor: isDarkMode ? theme.border : Colors.secondary }]}>
                <Text style={[styles.initialText, { color: isDarkMode ? theme.primary : Colors.primary }]}>{userInitial}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>{profile?.fullName|| user?.displayName?.split(' ')[0] || 'Scholar'}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#000' : '#000' }]}>
          <View style={styles.statItem}>
            <Ionicons name="book" size={20} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{totalQuizzes}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.text }]}>{totalScore}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Pts</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={20} color="#27AE60" />
            <Text style={[styles.statValue, { color: theme.text }]}>{correctAnswers}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Correct</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <Text style={[styles.menuSectionTitle, { color: theme.textSecondary }]}>Achievement & Growth</Text>
          <MenuButton icon="medal-outline" title="My Achievements" onPress={() => router.push('/achievements')} theme={theme} />
          <MenuButton icon="time-outline" title="Quiz History" onPress={() => router.push('/history')} theme={theme} />
          
          <Text style={[styles.menuSectionTitle, { marginTop: 25, color: theme.textSecondary }]}>Security & Preference</Text>
          <MenuButton icon="person-outline" title="Edit Profile" onPress={() => router.push('/edit-profile')} theme={theme} />
          <MenuButton icon="finger-print-outline" title="Biometric Security" onPress={() => router.push('/security')} theme={theme} />
          <MenuButton icon="lock-closed-outline" title="Change Password" onPress={() => router.push('/forgot-password')} theme={theme} />
          
          <Text style={[styles.menuSectionTitle, { marginTop: 25, color: theme.textSecondary }]}>Support</Text>
          <MenuButton icon="help-circle-outline" title="Help Center" onPress={() => router.push('/support')} theme={theme} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const MenuButton = ({ icon, title, onPress, theme }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.menuLeft}>
      <View style={[styles.menuIconBox, { backgroundColor: theme.card }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 20, 
    marginBottom: 20 
  },
  headerTitle: { fontFamily: 'Archivo-Black', fontSize: 20 },
  backBtn: { padding: 5 },
  settingsBtn: { padding: 5 },
  
  profileSection: { alignItems: 'center', marginVertical: 10 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.secondary },
  initialAvatar: { justifyContent: 'center', alignItems: 'center', borderWidth: 0 },
  initialText: { fontFamily: 'Archivo-Black', fontSize: 36 },
  cameraBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    padding: 8, 
    borderRadius: 20, 
    borderWidth: 3, 
  },
  userName: { fontFamily: 'Archivo-Black', fontSize: 24, marginTop: 15 },
  userEmail: { fontFamily: 'Ubuntu-Light', fontSize: 14, marginTop: 2 },

  statsCard: { 
    flexDirection: 'row', 
    marginHorizontal: 25, 
    borderRadius: 22, 
    padding: 20, 
    justifyContent: 'space-around', 
    elevation: 4, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    marginVertical: 25 
  },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: 'Archivo-Black', fontSize: 20 },
  statLabel: { fontFamily: 'Ubuntu-Regular', fontSize: 11, marginTop: 2 },
  divider: { width: 1, height: 35 },

  menuContainer: { paddingHorizontal: 25 },
  menuSectionTitle: { 
    fontFamily: 'Ubuntu-Bold', 
    fontSize: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 15 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    marginBottom: 10 
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuText: { fontFamily: 'Ubuntu-Medium', fontSize: 16 },
});