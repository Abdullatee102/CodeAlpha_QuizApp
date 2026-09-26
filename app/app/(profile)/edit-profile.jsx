// app/app/(profile)/edit-profile.jsx
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
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../data/api';

const LEVELS = [100, 200, 300, 400, 500];

export default function EditProfileScreen() {
  const { user, profile, updateProfile } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Academic State
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState(null);

  // Academic Dropdown / List State
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Modal State
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

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
      const initialFacultyId =
        source.facultyId ||
        (typeof source.faculty === 'object' ? source.faculty?.id : '') ||
        '';
      const initialDeptId =
        source.departmentId ||
        (typeof source.department === 'object' ? source.department?.id : '') ||
        '';
      setFacultyId(initialFacultyId);
      setDepartmentId(initialDeptId);
      setLevel(source.level ? Number(source.level) : null);
    }
  }, [profile, user]);

  // Load Faculties
  useEffect(() => {
    const loadFaculties = async () => {
      setLoadingFaculties(true);
      try {
        const res = await api.get('/auth/faculties');
        setFaculties(res.data?.data || []);
      } catch (err) {
        console.warn('Failed to load faculties:', err);
      } finally {
        setLoadingFaculties(false);
      }
    };
    loadFaculties();
  }, []);

  // Load Departments when Faculty changes
  useEffect(() => {
    if (!facultyId) {
      setDepartments([]);
      return;
    }
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const res = await api.get(`/auth/faculties/${facultyId}/departments`);
        setDepartments(res.data?.data || []);
      } catch (err) {
        console.warn('Failed to load departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, [facultyId]);

  const selectedFaculty = faculties.find((f) => f.id === facultyId);
  const selectedDepartment = departments.find((d) => d.id === departmentId);

  const handleSelectFaculty = (item) => {
    if (item.id !== facultyId) {
      setFacultyId(item.id);
      setDepartmentId(''); // Reset department when faculty changes
    }
    setShowFacultyModal(false);
    setFacultySearch('');
  };

  const handleSelectDepartment = (item) => {
    setDepartmentId(item.id);
    setShowDeptModal(false);
    setDeptSearch('');
  };

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
      facultyId: facultyId || null,
      departmentId: departmentId || null,
      level: level ? Number(level) : null,
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
      // Invalidate relevant queries so app displays updated academic info
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['recommendedCourses'] });
      queryClient.invalidateQueries({ queryKey: ['academicChannels'] });

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } else {
      Alert.alert("Error", result.error || "Failed to update profile.");
    }
  };

  const filteredFaculties = faculties.filter((f) =>
    (f.name || '').toLowerCase().includes(facultySearch.toLowerCase()) ||
    (f.code || '').toLowerCase().includes(facultySearch.toLowerCase())
  );

  const filteredDepartments = departments.filter((d) =>
    (d.name || '').toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(deptSearch.toLowerCase())
  );

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

          {/* SECTION: ACADEMIC PROFILE */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="school" size={20} color={theme.primary} />
              <Text style={[styles.sectionCardTitle, { color: theme.text }]}>
                Academic Affiliation
              </Text>
            </View>
            <Text style={[styles.sectionCardSub, { color: theme.textSecondary }]}>
              Configuring your faculty, department, and level unlocks tailored course recommendations and faculty messaging.
            </Text>

            {/* Faculty Selector */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Faculty</Text>
              <TouchableOpacity
                style={[
                  styles.selectorBox,
                  { backgroundColor: theme.background, borderColor: theme.border }
                ]}
                onPress={() => setShowFacultyModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: selectedFaculty ? theme.text : theme.textSecondary }
                  ]}
                  numberOfLines={1}
                >
                  {selectedFaculty ? `${selectedFaculty.name} (${selectedFaculty.code})` : 'Select Faculty'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Department Selector */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Department</Text>
              <TouchableOpacity
                style={[
                  styles.selectorBox,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    opacity: facultyId ? 1 : 0.6
                  }
                ]}
                onPress={() => {
                  if (!facultyId) {
                    Alert.alert('Notice', 'Please select a faculty first.');
                    return;
                  }
                  setShowDeptModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: selectedDepartment ? theme.text : theme.textSecondary }
                  ]}
                  numberOfLines={1}
                >
                  {selectedDepartment
                    ? `${selectedDepartment.name} (${selectedDepartment.code})`
                    : facultyId
                    ? 'Select Department'
                    : 'Select Faculty first'}
                </Text>
                {loadingDepartments ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Level Selector */}
            <View style={styles.formControl}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Academic Level</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((lvl) => {
                  const isSelected = level === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.border,
                        }
                      ]}
                      onPress={() => setLevel(lvl)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.levelChipText,
                          { color: isSelected ? '#FFFFFF' : theme.text }
                        ]}
                      >
                        {lvl}L
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* SECTION: BASIC DETAILS */}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>About Me</Text>
              <Text style={{ fontFamily: 'Ubuntu-Regular', fontSize: 12, color: (bio || '').length >= 50 ? (theme.error || '#EF4444') : theme.textSecondary }}>
                ({(bio || '').length}/50)
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }
              ]}
              value={bio}
              onChangeText={setBio}
              maxLength={50}
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

      {/* FACULTY SELECTION MODAL */}
      <Modal
        visible={showFacultyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFacultyModal(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Faculty</Text>
              <TouchableOpacity onPress={() => setShowFacultyModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalSearchInput,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
              ]}
              placeholder="Search faculties..."
              placeholderTextColor={theme.textSecondary}
              value={facultySearch}
              onChangeText={setFacultySearch}
            />

            {loadingFaculties ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={filteredFaculties}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.id === facultyId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalListItem,
                        { borderBottomColor: theme.border },
                        isSelected && { backgroundColor: `${theme.primary}15` }
                      ]}
                      onPress={() => handleSelectFaculty(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.itemSub, { color: theme.primary }]}>{item.code}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* DEPARTMENT SELECTION MODAL */}
      <Modal
        visible={showDeptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeptModal(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowDeptModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalSearchInput,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
              ]}
              placeholder="Search departments..."
              placeholderTextColor={theme.textSecondary}
              value={deptSearch}
              onChangeText={setDeptSearch}
            />

            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === departmentId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalListItem,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: `${theme.primary}15` }
                    ]}
                    onPress={() => handleSelectDepartment(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.itemSub, { color: theme.primary }]}>{item.code}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

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
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionCardTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },
  sectionCardSub: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  formControl: { marginBottom: 18 },
  label: { fontFamily: 'Ubuntu-Bold', fontSize: 13, marginBottom: 8 },
  selectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },
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
  btnText: { color: '#fff', fontFamily: 'Ubuntu-Bold', fontSize: 16 },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  modalSearchInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    marginBottom: 14,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 14,
    marginBottom: 2,
  },
  itemSub: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 12,
  },
});