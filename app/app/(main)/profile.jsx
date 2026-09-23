// src/app/(main)/profile.jsx

import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import {
  useQueryClient,
} from '@tanstack/react-query';

import {
  useAuthStore,
} from '../../store/authStore';

import {
  useThemeStore,
} from '../../store/themeStore';

import {
  Colors,
} from '../../constants/colors';

import {
  useProfileQuery,
} from '../../hooks/useProfileQuery';

export default function ProfileScreen() {
  // =====================================================
  // AUTH / SESSION
  // =====================================================

  const {
    user,
    updateProfile,
  } = useAuthStore();

  // =====================================================
  // THEME
  // =====================================================

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  // =====================================================
  // ROUTER / QUERY CLIENT
  // =====================================================

  const router = useRouter();

  const queryClient =
    useQueryClient();

  // =====================================================
  // LOCAL UI STATE
  // =====================================================

  const [uploading, setUploading] =
    useState(false);

  // =====================================================
  // PROFILE QUERY
  // =====================================================
  /*
   * TanStack Query is the source of truth
   * for profile/server state.
   *
   * Home and Profile therefore consume
   * the same ['profile'] query.
   */

  const {
    data: profile,
    isLoading,
  } = useProfileQuery();

  // =====================================================
  // PROFILE STATISTICS
  // =====================================================

  const totalQuizzes =
    profile?.quizzesCompleted ??
    profile?.totalQuizzesTaken ??
    0;

  const totalScore =
    profile?.totalScore ??
    0;

  const correctAnswers =
    profile?.totalCorrect ??
    profile?.totalCorrectAnswers ??
    profile?.correctAnswers ??
    profile?.correct ??
    0;

  // =====================================================
  // PROFILE IDENTITY
  // =====================================================

  const userInitial = (
    profile?.fullName ||
    user?.fullName ||
    user?.displayName ||
    'S'
  )
    .charAt(0)
    .toUpperCase();

  const profileImage =
    profile?.photoURL ||
    user?.photoURL;

  // =====================================================
  // AVATAR BORDER COLOR
  // =====================================================
  /*
   * Use a stronger, explicit color in light mode
   * so the circular profile border remains visible.
   *
   * Dark mode continues using theme.primary.
   */

  const avatarBorderColor =
    isDarkMode
      ? theme.primary
      : Colors.primary;

  // =====================================================
  // PICK PROFILE IMAGE
  // =====================================================

  const pickImage = async () => {
    const {
      status,
    } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Camera roll permissions are required.'
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: ['images'],

          allowsEditing: true,

          aspect: [1, 1],

          quality: 0.5,
        }
      );

    if (
      !result.canceled &&
      result.assets?.[0]?.uri
    ) {
      uploadProfileImage(
        result.assets[0].uri
      );
    }
  };

  // =====================================================
  // UPLOAD PROFILE IMAGE
  // =====================================================

  const uploadProfileImage =
    async (uri) => {
      setUploading(true);

      try {
        const result =
          await updateProfile({
            photoURL: uri,
          });

        if (!result?.success) {
          throw new Error(
            result?.error ||
              'Failed to update profile image.'
          );
        }

        /*
         * updateProfile() synchronizes the
         * authentication store.
         *
         * We then invalidate the Query cache
         * so TanStack Query fetches the latest
         * authoritative profile from the backend.
         */

        await queryClient.invalidateQueries(
          {
            queryKey: ['profile'],
          }
        );

        Alert.alert(
          'Success',
          'Avatar updated!'
        );
      } catch (error) {
        Alert.alert(
          'Error',
          error?.message ||
            'Failed to update image.'
        );
      } finally {
        setUploading(false);
      }
    };

  // =====================================================
  // PROFILE LOADING
  // =====================================================

  if (
    isLoading &&
    !profile
  ) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />
      </View>
    );
  }

  // =====================================================
  // PROFILE
  // =====================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          theme.background,
      }}
    >
      {/* Header */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color:
                theme.primary,
            },
          ]}
        >
          My Profile
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(
              '/settings'
            )
          }
          style={
            styles.settingsBtn
          }
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* Profile Identity Section */}

        <View
          style={
            styles.profileSection
          }
        >
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            style={
              styles.avatarWrapper
            }
          >
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage,
                }}
                style={[
                  styles.avatar,
                  {
                    borderColor:
                      avatarBorderColor,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.initialAvatar,
                  {
                    backgroundColor:
                      isDarkMode
                        ? theme.border
                        : Colors.secondary,

                    borderColor:
                      avatarBorderColor,

                    borderWidth: 3,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.initialText,
                    {
                      color:
                        isDarkMode
                          ? theme.primary
                          : Colors.primary,
                    },
                  ]}
                >
                  {userInitial}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor:
                    theme.primary,

                  borderColor:
                    theme.background,
                },
              ]}
            >
              {uploading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={16}
                  color="#fff"
                />
              )}
            </View>
          </TouchableOpacity>

          <Text
            style={[
              styles.userName,
              {
                color:
                  theme.text,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {profile?.fullName ||
              user?.fullName ||
              'Scholar'}
          </Text>

          <Text
            style={[
              styles.userEmail,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {profile?.email ||
              user?.email}
          </Text>
        </View>

        {/* Stats Card */}

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor:
                theme.card,

              borderColor:
                theme.border,

              shadowColor:
                isDarkMode
                  ? '#000'
                  : '#444',

              elevation:
                isDarkMode ? 2 : 4,
            },
          ]}
        >
          <View
            style={styles.statItem}
          >
            <Ionicons
              name="book"
              size={20}
              color={theme.primary}
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {totalQuizzes}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Completed
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <View
            style={styles.statItem}
          >
            <Ionicons
              name="star"
              size={20}
              color="#FFD700"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {totalScore}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Total Pts
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          />

          <View
            style={styles.statItem}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color="#27AE60"
            />

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {correctAnswers}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Correct
            </Text>
          </View>
        </View>

        {/* Menu Options */}

        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor:
                theme.background,
            },
          ]}
        >
          <Text
            style={[
              styles.menuSectionTitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Achievement & Growth
          </Text>

          <MenuButton
            icon="medal-outline"
            title="My Achievements"
            onPress={() =>
              router.push(
                '/achievements'
              )
            }
            theme={theme}
          />

          <MenuButton
            icon="time-outline"
            title="Quiz History"
            onPress={() =>
              router.push('/history')
            }
            theme={theme}
          />

          <Text
            style={[
              styles.menuSectionTitle,
              {
                marginTop: 25,
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Security & Preference
          </Text>

          <MenuButton
            icon="person-outline"
            title="Edit Profile"
            onPress={() =>
              router.push(
                '/edit-profile'
              )
            }
            theme={theme}
          />

          <MenuButton
            icon="finger-print-outline"
            title="Biometric Security"
            onPress={() =>
              router.push('/security')
            }
            theme={theme}
          />

          <MenuButton
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() =>
              router.push(
                '/change-password'
              )
            }
            theme={theme}
          />

          <Text
            style={[
              styles.menuSectionTitle,
              {
                marginTop: 25,
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Support
          </Text>

          <MenuButton
            icon="help-circle-outline"
            title="Help Center"
            onPress={() =>
              router.push('/support')
            }
            theme={theme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// MENU BUTTON
// =====================================================

const MenuButton = ({
  icon,
  title,
  onPress,
  theme,
}) => (
  <TouchableOpacity
    style={[
      styles.menuItem,
      {
        backgroundColor:
          theme.card,

        borderColor:
          theme.border,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View
      style={styles.menuLeft}
    >
      <View
        style={[
          styles.menuIconBox,
          {
            backgroundColor:
              `${theme.primary}15`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={theme.primary}
        />
      </View>

      <Text
        style={[
          styles.menuText,
          {
            color:
              theme.text,
          },
        ]}
      >
        {title}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={18}
      color={
        theme.textSecondary
      }
    />
  </TouchableOpacity>
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 20,
  },

  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },

  backBtn: {
    padding: 5,
  },

  settingsBtn: {
    padding: 5,
  },

  profileSection: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },

  avatarWrapper: {
    position: 'relative',
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },

  initialAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  initialText: {
    fontFamily:
      'Archivo-Black',
    fontSize: 36,
  },

  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
  },

  userName: {
    fontFamily:
      'Archivo-Black',
    fontSize: 24,
    marginTop: 15,
    maxWidth: '100%',
    textAlign: 'center',
  },

  userEmail: {
    fontFamily:
      'Ubuntu-Light',
    fontSize: 14,
    marginTop: 2,
  },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 25,
    borderRadius: 22,
    padding: 20,
    justifyContent:
      'space-around',
    elevation: 4,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginVertical: 25,
    borderWidth: 1,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontFamily:
      'Archivo-Black',
    fontSize: 20,
  },

  statLabel: {
    fontFamily:
      'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 2,
  },

  divider: {
    width: 1,
    height: 35,
  },

  menuContainer: {
    paddingHorizontal: 22,
    marginTop: 10,
  },

  menuSectionTitle: {
    fontFamily:
      'Ubuntu-Bold',
    fontSize: 12,
    textTransform:
      'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    paddingLeft: 10,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    fontFamily:
      'Ubuntu-Medium',
    fontSize: 16,
  },
});