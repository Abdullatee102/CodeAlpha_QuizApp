// src/store/authStore.js

import { create } from 'zustand';

import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import {
  mmkvStorage,
  storage,
} from '../utils/mmkvStorage';

import { auth } from '../firebaseConfig';

import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import api from '../data/api';

import {
  useQuizStore,
} from './quizStore';

import formatAxiosError from '../data/formatError';

import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import * as Device from 'expo-device';

import Constants from 'expo-constants';
import { queryClient } from '../data/queryClient';
import { socketService } from '../services/socket';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,

      profile: null,

      isLoading: false,

      isInitializing: true,

      error: null,

      hasFinishedOnboarding: false,

      biometricEnabled: false,

      profileImage: null,

      token: null,

      refreshToken: null,

      leaderboard: [],

      _hasHydrated: false,

      // =====================================================
      // GENERAL STATE SETTERS
      // =====================================================

      setHasHydrated: (state) =>
        set({
          _hasHydrated: state,
        }),

      setBiometricEnabled: (value) => {
        if (!value) {
          storage.delete('biometricRefreshToken');
        }
        set({
          biometricEnabled: value,
        });
      },

      setHasFinishedOnboarding: (value) =>
        set({
          hasFinishedOnboarding: value,
        }),

      // =====================================================
      // PUSH NOTIFICATIONS
      // =====================================================

      registerPushNotifications: async () => {
        try {
          if (Platform.OS === 'web') {
            return {
              success: false,
              error:
                'Push notifications are not supported on web.',
            };
          }

          if (!Device.isDevice) {
            console.log(
              '[PUSH] Push notifications require a physical device.'
            );

            return {
              success: false,
              error:
                'Push notifications require a physical device.',
            };
          }

          const {
            status: existingStatus,
          } =
            await Notifications.getPermissionsAsync();

          let finalStatus =
            existingStatus;

          if (
            existingStatus !==
            Notifications.PermissionStatus.GRANTED
          ) {
            const {
              status,
            } =
              await Notifications.requestPermissionsAsync();

            finalStatus = status;
          }

          if (
            finalStatus !==
            Notifications.PermissionStatus.GRANTED
          ) {
            console.log(
              '[PUSH] Notification permission was not granted.'
            );

            return {
              success: false,
              error:
                'Notification permission was not granted.',
            };
          }

          if (
            Platform.OS === 'android'
          ) {
            await Notifications.setNotificationChannelAsync(
              'default',
              {
                name: 'Default',
                importance:
                  Notifications.AndroidImportance.MAX,
                vibrationPattern: [
                  0,
                  250,
                  250,
                  250,
                ],
                lightColor:
                  '#ffffff',
              }
            );
          }

          const projectId =
            Constants.expoConfig
              ?.extra?.eas
              ?.projectId ||
            Constants.easConfig
              ?.projectId;

          if (!projectId) {
            console.error(
              '[PUSH] Expo project ID is missing.'
            );

            return {
              success: false,
              error:
                'Expo project ID is missing.',
            };
          }

          const tokenResponse =
            await Notifications.getExpoPushTokenAsync({
              projectId,
            });

          const pushToken =
            tokenResponse.data;

          if (!pushToken) {
            return {
              success: false,
              error:
                'Expo push token was not returned.',
            };
          }

          const lastRegisteredToken =
            storage.getString('registeredPushToken');

          if (lastRegisteredToken === pushToken) {
            console.log(
              '[PUSH] Device push token already registered on server:',
              pushToken
            );

            return {
              success: true,
              pushToken,
              alreadyRegistered: true,
            };
          }

          const platform =
            Platform.OS === 'ios'
              ? 'ios'
              : 'android';

          const response =
            await api.post(
              '/notifications/devices',
              {
                pushToken,
                platform,
              }
            );

          storage.set(
            'registeredPushToken',
            pushToken
          );

          console.log(
            '[PUSH] Device registered successfully:',
            pushToken
          );

          return {
            success: true,
            data:
              response.data,
            pushToken,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          console.error(
            '[PUSH] Device registration failed:',
            formatted.message
          );

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      unregisterPushNotifications:
        async () => {
          try {
            if (
              Platform.OS === 'web'
            ) {
              return {
                success: false,
              };
            }

            if (!Device.isDevice) {
              return {
                success: false,
              };
            }

            const {
              status,
            } =
              await Notifications.getPermissionsAsync();

            if (
              status !==
              Notifications.PermissionStatus.GRANTED
            ) {
              return {
                success: false,
              };
            }

            const projectId =
              Constants.expoConfig
                ?.extra?.eas
                ?.projectId ||
              Constants.easConfig
                ?.projectId;

            if (!projectId) {
              return {
                success: false,
                error:
                  'Expo project ID is missing.',
              };
            }

            const tokenResponse =
              await Notifications.getExpoPushTokenAsync({
                projectId,
              });

            const pushToken =
              tokenResponse.data;

            if (!pushToken) {
              return {
                success: false,
              };
            }

            await api.delete(
              '/notifications/devices',
              {
                data: {
                  pushToken,
                },
              }
            );

            storage.delete('registeredPushToken');

            console.log(
              '[PUSH] Device unregistered successfully.'
            );

            return {
              success: true,
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.warn(
              '[PUSH] Device unregistration failed:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      getPushNotificationStatus:
        async () => {
          try {
            if (
              Platform.OS === 'web'
            ) {
              return {
                success: true,
                data: {
                  enabled: false,
                },
              };
            }

            if (!Device.isDevice) {
              return {
                success: true,
                data: {
                  enabled: false,
                },
              };
            }

            const { status } =
              await Notifications.getPermissionsAsync();

            const enabled =
              status ===
              Notifications.PermissionStatus.GRANTED;

            return {
              success: true,
              data: {
                enabled,
                status,
              },
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.warn(
              '[PUSH] Failed to get notification status:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      enablePushNotifications:
        async () => {
          try {
            const result =
              await get()
                .registerPushNotifications();

            if (!result?.success) {
              return {
                success: false,
                error:
                  result?.error ||
                  'Failed to enable push notifications.',
              };
            }

            return {
              success: true,
              data: {
                enabled: true,
                pushToken:
                  result.pushToken,
              },
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.error(
              '[PUSH] Failed to enable push notifications:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      disablePushNotifications:
        async () => {
          try {
            const result =
              await get()
                .unregisterPushNotifications();

            if (!result?.success) {
              return {
                success: false,
                error:
                  result?.error ||
                  'Failed to disable push notifications.',
              };
            }

            return {
              success: true,
              data: {
                enabled: false,
              },
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.error(
              '[PUSH] Failed to disable push notifications:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      // =====================================================
      // NOTIFICATIONS
      // =====================================================

      fetchNotifications: async (
        limit = 50
      ) => {
        const token =
          storage.getString('userToken') ||
          get().token;

        if (!token) {
          return {
            success: false,
            error: 'No active session',
            data: [],
          };
        }

        try {
          const response =
            await api.get(
              '/notifications',
              {
                params: {
                  limit,
                },
              }
            );

          const notificationData =
            response.data?.data ||
            response.data ||
            [];

          return {
            success: true,
            data:
              notificationData,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          console.error(
            '[NOTIFICATIONS] Fetch notifications error:',
            formatted.message
          );

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      markNotificationAsRead:
        async (
          notificationId
        ) => {
          try {
            const response =
              await api.patch(
                `/notifications/${notificationId}/read`
              );

            return {
              success: true,
              data:
                response.data,
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.error(
              '[NOTIFICATIONS] Mark notification as read error:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      markAllNotificationsAsRead:
        async () => {
          try {
            const response =
              await api.patch(
                '/notifications/read-all'
              );

            return {
              success: true,
              data:
                response.data,
            };
          } catch (err) {
            const formatted =
              formatAxiosError(err);

            console.error(
              '[NOTIFICATIONS] Mark all notifications as read error:',
              formatted.message
            );

            return {
              success: false,
              error:
                formatted.message,
            };
          }
        },

      // =====================================================
      // INITIALIZE AUTH SESSION
      // =====================================================

      initialize: async () => {
        set({
          isInitializing: true,
        });

        try {
          const storedToken =
            storage.getString(
              'userToken'
            );

          const storedRefreshToken =
            storage.getString(
              'refreshToken'
            );

          if (storedToken) {
            set({
              token: storedToken,
              refreshToken:
                storedRefreshToken,
            });

            await get().fetchProfile();
          }
        } catch (err) {
          console.error(
            'Auth initialization error:',
            err
          );
        } finally {
          set({
            isInitializing: false,
            isLoading: false,
          });
        }
      },

      // =====================================================
      // FETCH PROFILE
      // =====================================================

      fetchProfile: async () => {
        const token =
          storage.getString('userToken') ||
          get().token;

        if (!token) {
          return {
            success: false,
            error: 'No active session',
            data: null,
          };
        }

        try {
          const response =
            await api.get(
              '/auth/profile'
            );

          if (response.data?.data) {
            const profileData =
              response.data.data;

            // Sanitize legacy "Verified User" backend fallback name
            if (
              profileData.fullName === 'Verified User' ||
              profileData.fullName === 'Verified'
            ) {
              profileData.fullName =
                profileData.username ||
                'Scholar';
            }

            set({
              profile:
                profileData,
              user:
                profileData,
            });

            return {
              success: true,
              data:
                profileData,
            };
          }

          return {
            success: false,
            error:
              'Profile data was not returned by the server.',
          };
        } catch (err) {
          if (
            err?.response?.status === 401 ||
            err?.response?.status === 403
          ) {
            console.log(
              'Session expired or invalid in fetchProfile. Clearing session.'
            );

            await get().logout();

            return {
              success: false,
              error:
                'Session expired',
            };
          }

          const formatted =
            formatAxiosError(err);

          console.error(
            'Profile fetch error:',
            formatted.message
          );

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // FETCH LEADERBOARD
      // =====================================================

      fetchLeaderboard: async (
        tab = '24h'
      ) => {
        const token =
          storage.getString('userToken') ||
          get().token;

        if (!token) {
          return {
            success: false,
            error: 'No active session',
            data: [],
          };
        }

        try {
          const response =
            await api.get(
              `/auth/leaderboard?range=${tab}`
            );

          const leaderboardData =
            response.data?.data ||
            response.data ||
            [];

          set({
            leaderboard:
              leaderboardData,
          });

          return {
            success: true,
            data:
              leaderboardData,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          console.error(
            'Leaderboard fetch error:',
            formatted.message
          );

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // UPDATE PROFILE
      // =====================================================

      updateProfile: async (
        updateData
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response =
            await api.patch(
              '/auth/profile',
              updateData
            );

          /*
           * Keep authStore's profile synchronized
           * for existing consumers.
           *
           * The Profile screen should also invalidate
           * its TanStack Query profile query after
           * a successful update.
           */
          await get().fetchProfile();

          set({
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // SEND OTP
      // =====================================================

      sendOTP: async (
        identifier
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (identifier || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = isEmail
            ? {
                email:
                  safeIdentifier,
              }
            : {
                phoneNumber:
                  safeIdentifier,
              };

          const response =
            await api.post(
              '/auth/send-otp',
              payload
            );

          set({
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // VERIFY OTP
      // =====================================================

      verifyOTP: async (
        code,
        identifier,
        fullName
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (identifier || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = {
            code,
            ...(isEmail
              ? {
                  email:
                    safeIdentifier,
                }
              : {
                  phoneNumber:
                    safeIdentifier,
                }),
            ...(fullName ? { fullName } : {}),
          };

          const response =
            await api.post(
              '/auth/verify-otp',
              payload
            );

          const accessToken =
            response.data?.tokens
              ?.accessToken;

          const refreshTokenVal =
            response.data?.tokens
              ?.refreshToken;

          const userData =
            response.data?.user;

          if (!accessToken) {
            throw new Error(
              'OTP verification succeeded but no access token was returned.'
            );
          }

          set({
            token:
              accessToken,
            refreshToken:
              refreshTokenVal ||
              null,
            user:
              userData || {
                uid:
                  safeIdentifier,
              },
          });

          storage.set(
            'userToken',
            accessToken
          );

          if (refreshTokenVal) {
            storage.set(
              'refreshToken',
              refreshTokenVal
            );

            if (
              get()
                .biometricEnabled
            ) {
              storage.set(
                'biometricRefreshToken',
                refreshTokenVal
              );
            }
          }

          await get().fetchProfile();

          await get().fetchLeaderboard(
            '24h'
          );

          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // SIGN UP
      // =====================================================

      signUp: async ({
        identifier,
        password,
        fullName,
        username,
        acceptedTerms,
      }) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (identifier || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = {
            fullName,
            username,
            password,

            acceptedTerms:
              acceptedTerms === true,

            ...(isEmail
              ? {
                  email:
                    safeIdentifier,
                }
              : {
                  phoneNumber:
                    safeIdentifier,
                }),
          };

          const response =
            await api.post(
              '/auth/signup',
              payload
            );

          const userData =
            response.data?.user;

          // Note: We do NOT commit user to Zustand here to prevent premature navigation
          // to /(main) via route guards before OTP verification completes.
          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            data:
              response.data,
            user: userData,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            error:
              formatted.message,
            isLoading: false,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // LOGIN
      // =====================================================

      login: async (
        identifier,
        password
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (identifier || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = isEmail
            ? {
                email:
                  safeIdentifier,
                password,
              }
            : {
                phoneNumber:
                  safeIdentifier,
                password,
              };

          const response =
            await api.post(
              '/auth/login',
              payload
            );

          console.log(
            '[AUTH] Login response received.'
          );

          const accessToken =
            response.data?.tokens
              ?.accessToken;

          const refreshTokenVal =
            response.data?.tokens
              ?.refreshToken;

          const userData =
            response.data?.user;

          if (!accessToken) {
            throw new Error(
              'Login succeeded but no access token was returned.'
            );
          }

          /*
           * Save authentication state
           * immediately after successful login.
           */
          set({
            token:
              accessToken,

            refreshToken:
              refreshTokenVal || null,

            user:
              userData || {
                uid:
                  safeIdentifier,
              },
          });

          /*
           * Persist authentication credentials.
           */
          storage.set(
            'userToken',
            accessToken
          );

          if (refreshTokenVal) {
            storage.set(
              'refreshToken',
              refreshTokenVal
            );

            /*
             * Keep a separate biometric refresh
             * token only when biometric login is enabled.
             */
            if (
              get()
                .biometricEnabled
            ) {
              storage.set(
                'biometricRefreshToken',
                refreshTokenVal
              );
            }
          }

          /*
           * Fetch the fresh server profile.
           *
           * This keeps authStore's profile synchronized
           * while TanStack Query remains the source of truth
           * for profile data in screens.
           */
          const profileResult =
            await get().fetchProfile();

          if (!profileResult?.success) {
            throw new Error(
              profileResult?.error ||
                'Failed to load your profile after login.'
            );
          }

          /*
           * Fetch the initial leaderboard data.
           *
           * This is kept for compatibility with existing
           * consumers of authStore.leaderboard.
           */
          const leaderboardResult =
            await get().fetchLeaderboard(
              '24h'
            );

          if (!leaderboardResult?.success) {
            console.warn(
              '[AUTH] Initial leaderboard fetch failed:',
              leaderboardResult?.error
            );
          }

          /*
           * Only mark loading as false after the
           * complete login initialization flow.
           */
          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          console.error(
            '[AUTH] Login failed:',
            formatted.message
          );

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // BIOMETRIC LOGIN
      // =====================================================

      biometricLogin: async (
        savedEmail
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const storedBioToken =
            storage.getString(
              'biometricRefreshToken'
            );

          const storedRefreshToken =
            storage.getString(
              'refreshToken'
            );

          const currentRefreshToken =
            storedBioToken ||
            storedRefreshToken ||
            get().refreshToken;

          if (!currentRefreshToken) {
            set({
              isLoading: false,
            });

            return {
              success: false,
              error:
                'No active session token found. Please sign in with your password.',
            };
          }

          const response =
            await api.post(
              '/auth/refresh-token',
              {
                refreshToken:
                  currentRefreshToken,
              }
            );

          const newAccessToken =
            response.data?.tokens
              ?.accessToken;

          const newRefreshToken =
            response.data?.tokens
              ?.refreshToken;

          if (newAccessToken) {
            set({
              token:
                newAccessToken,
            });

            storage.set(
              'userToken',
              newAccessToken
            );
          }

          if (newRefreshToken) {
            set({
              refreshToken:
                newRefreshToken,
            });

            storage.set(
              'refreshToken',
              newRefreshToken
            );

            if (
              get()
                .biometricEnabled
            ) {
              storage.set(
                'biometricRefreshToken',
                newRefreshToken
              );
            }
          }

          storage.set(
            'lastUserEmail',
            savedEmail
          );

          await get().fetchProfile();

          await get().fetchLeaderboard(
            '24h'
          );

          set({
            isLoading: false,
          });

          return {
            success: true,
          };
        } catch (err) {
          if (
            err?.response?.status === 401 ||
            err?.response?.status === 403
          ) {
            storage.delete('biometricRefreshToken');
            set({
              isLoading: false,
              error: 'Biometric session expired. Please sign in with your password.',
            });
            return {
              success: false,
              error: 'Biometric session expired. Please sign in with your password.',
            };
          }

          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // CHANGE PASSWORD
      // =====================================================

      changePassword: async (
        currentPassword,
        newPassword
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response =
            await api.post(
              '/auth/change-password',
              {
                currentPassword,
                newPassword,
              }
            );

          set({
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // REFRESH AUTH TOKEN
      // =====================================================

      refreshAuthToken: async () => {
        try {
          const storedRefreshToken =
            storage.getString(
              'refreshToken'
            );

          const currentRefreshToken =
            storedRefreshToken ||
            get().refreshToken;

          if (!currentRefreshToken) {
            return {
              success: false,
              error:
                'No refresh token found',
            };
          }

          const response =
            await api.post(
              '/auth/refresh-token',
              {
                refreshToken:
                  currentRefreshToken,
              }
            );

          const newAccessToken =
            response.data?.tokens
              ?.accessToken;

          const newRefreshToken =
            response.data?.tokens
              ?.refreshToken;

          if (newAccessToken) {
            set({
              token:
                newAccessToken,
            });

            storage.set(
              'userToken',
              newAccessToken
            );
          }

          if (newRefreshToken) {
            set({
              refreshToken:
                newRefreshToken,
            });

            storage.set(
              'refreshToken',
              newRefreshToken
            );

            if (
              get()
                .biometricEnabled
            ) {
              storage.set(
                'biometricRefreshToken',
                newRefreshToken
              );
            }
          }

          return {
            success: true,
          };
        } catch (err) {
          await get().logout();

          return {
            success: false,
            error:
              'Session expired',
          };
        }
      },

      // =====================================================
      // FORGOT PASSWORD
      // =====================================================

      forgotPassword: async (
        emailOrPhone
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (emailOrPhone || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = isEmail
            ? {
                email:
                  safeIdentifier,
              }
            : {
                phoneNumber:
                  safeIdentifier,
              };

          const response =
            await api.post(
              '/auth/forgot-password',
              payload
            );

          set({
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // RESET PASSWORD
      // =====================================================

      resetPassword: async (
        identifier,
        newPassword
      ) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const safeIdentifier =
            (identifier || '').trim();

          const isEmail =
            safeIdentifier.includes('@');

          const payload = isEmail
            ? {
                email:
                  safeIdentifier,
                newPassword,
              }
            : {
                phoneNumber:
                  safeIdentifier,
                newPassword,
              };

          const response =
            await api.post(
              '/auth/reset-password',
              payload
            );

          set({
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // GOOGLE AUTH
      // =====================================================

      googleAuth: async (idToken) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          if (!idToken) {
            throw new Error('Google ID token is required.');
          }

          const response = await api.post('/auth/google', { idToken });

          const accessToken = response.data?.tokens?.accessToken;
          const refreshTokenVal = response.data?.tokens?.refreshToken;
          const userData = response.data?.user;

          if (!accessToken) {
            throw new Error('Google authentication succeeded but no access token was returned.');
          }

          set({
            user: userData || null,
            token: accessToken,
            refreshToken: refreshTokenVal || null,
          });

          if (accessToken) {
            storage.set('userToken', accessToken);
          }

          if (refreshTokenVal) {
            storage.set('refreshToken', refreshTokenVal);

            if (get().biometricEnabled) {
              storage.set('biometricRefreshToken', refreshTokenVal);
            }
          }

          await get().fetchProfile();
          await get().fetchLeaderboard('24h');

          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            data: userData,
          };
        } catch (error) {
          const formatted = formatAxiosError(error);

          set({
            isLoading: false,
            error: formatted.message,
          });

          return {
            success: false,
            error: formatted.message,
          };
        }
      },

      // =====================================================
      // SUBMIT QUIZ HISTORY
      // =====================================================

      /*
       * Kept for compatibility with existing code.
       *
       * IMPORTANT:
       * The current QuizScreen submission flow should
       * use the TanStack Query submit mutation instead
       * of calling this separately, otherwise the same
       * quiz can potentially be submitted twice.
       */
      submitQuizHistory: async (
        quizData
      ) => {
        try {
          const response =
            await api.post(
              '/auth/quiz-history',
              quizData
            );

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // DELETE ACCOUNT
      // =====================================================

      deleteAccount: async () => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          /*
           * The backend route is:
           *
           * DELETE /auth/account
           *
           * The backend validator expects an object body.
           * Axios DELETE therefore sends:
           *
           * {
           *   data: {}
           * }
           *
           * instead of leaving the request body undefined.
           */
          const response =
            await api.delete(
              '/auth/account',
              {
                data: {
                  confirmation: 'DELETE',
                }
              }
            );

          /*
           * Remove this device from the backend
           * while the authenticated session is
           * still available.
           *
           * Failure must not prevent account deletion
           * cleanup because the account itself has
           * already been deleted.
           */
          try {
            await get()
              .unregisterPushNotifications();
          } catch (pushError) {
            console.warn(
              '[AUTH] Push-token cleanup after account deletion failed:',
              pushError
            );
          }

          /*
           * Sign out from Firebase.
           */
          try {
            await firebaseSignOut(
              auth
            );
          } catch (firebaseError) {
            console.warn(
              '[AUTH] Firebase sign-out after account deletion failed:',
              firebaseError
            );
          }

          /*
           * Remove all authentication credentials.
           */
          storage.delete(
            'userToken'
          );

          storage.delete(
            'refreshToken'
          );

          storage.delete(
            'biometricRefreshToken'
          );

          storage.delete(
            'lastUserEmail'
          );

          storage.delete(
            'registeredPushToken'
          );

          /*
           * Clear the quiz store as well.
           *
           * This resets:
           * - active quiz
           * - answers
           * - history
           * - achievements
           * - quiz statistics
           * - faculties/departments/courses
           */
          useQuizStore
            .getState()
            .clearUserSession();

          /*
           * Disconnect realtime socket.
           */
          try {
            socketService.disconnect();
          } catch (socketErr) {
            console.warn(
              '[AUTH] Socket disconnect failed during deleteAccount:',
              socketErr
            );
          }

          /*
           * Invalidate and clear all TanStack Query cache.
           */
          queryClient.cancelQueries();
          queryClient.clear();

          /*
           * Clear authStore state.
           */
          set({
            user: null,
            profile: null,
            profileImage: null,
            token: null,
            refreshToken: null,
            biometricEnabled: false,
            leaderboard: [],
            error: null,
            isLoading: false,
          });

          return {
            success: true,
            data:
              response.data,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            isLoading: false,
            error:
              formatted.message,
          });

          console.error(
            '[AUTH] Account deletion failed:',
            formatted.message
          );

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // LOGOUT
      // =====================================================

      logout: async () => {
        try {
          /*
           * Disconnect realtime socket immediately.
           */
          try {
            socketService.disconnect();
          } catch (socketErr) {
            console.warn(
              '[AUTH] Socket disconnect failed during logout:',
              socketErr
            );
          }

          const storedRefreshToken =
            storage.getString(
              'refreshToken'
            );

          const currentRefreshToken =
            storedRefreshToken ||
            get().refreshToken;

          /*
           * Remove the device push token while
           * authentication is still available.
           */
          try {
            await get()
              .unregisterPushNotifications();
          } catch (e) {
            console.warn(
              '[AUTH] Push-token cleanup failed during logout.'
            );
          }

          /*
           * Invalidate the refresh token on
           * the backend.
           */
          try {
            if (currentRefreshToken) {
              await api.post(
                '/auth/logout',
                {
                  refreshToken:
                    currentRefreshToken,

                  keepBiometricSession:
                    get()
                      .biometricEnabled,
                }
              );
            }
          } catch (e) {
            console.warn(
              '[AUTH] Backend logout request failed.'
            );
          }

          /*
           * Sign out from Firebase.
           */
          try {
            await firebaseSignOut(
              auth
            );
          } catch (e) {
            console.warn(
              '[AUTH] Firebase sign-out failed.'
            );
          }

          /*
           * Remove normal authentication
           * credentials.
           */
          storage.delete(
            'userToken'
          );

          storage.delete(
            'refreshToken'
          );

          /*
           * Only clear biometricRefreshToken if biometric login is NOT enabled.
           * When biometric login is enabled, the separately stored biometric
           * credential stays alive until explicitly disabled or account deleted.
           */
          if (!get().biometricEnabled) {
            storage.delete(
              'biometricRefreshToken'
            );
          }

          storage.delete(
            'registeredPushToken'
          );

          /*
           * IMPORTANT:
           *
           * Clear the quiz store using the
           * actual action that exists:
           *
           * clearUserSession()
           *
           * NOT clearSession().
           */
          useQuizStore
            .getState()
            .clearUserSession();

          /*
           * Cancel inflight queries and clear all TanStack Query cache.
           */
          queryClient.cancelQueries();
          queryClient.clear();

          /*
           * Clear authenticated Zustand state.
           */
          set({
            user: null,
            profile: null,
            profileImage: null,
            token: null,
            refreshToken: null,
            leaderboard: [],
            error: null,
            isLoading: false,
          });

          return {
            success: true,
          };
        } catch (err) {
          const formatted =
            formatAxiosError(err);

          set({
            error:
              formatted.message,
            isLoading: false,
          });

          return {
            success: false,
            error:
              formatted.message,
          };
        }
      },

      // =====================================================
      // GITHUB LOGIN
      // =====================================================

      githubLogin: () => {
        console.log(
          'GitHub login triggered'
        );
      },
    }),

    {
      name: 'auth-storage',

      storage:
        createJSONStorage(
          () => mmkvStorage
        ),

      partialize: (state) => ({
        hasFinishedOnboarding:
          state.hasFinishedOnboarding,

        biometricEnabled:
          state.biometricEnabled,

        token:
          state.token,

        refreshToken:
          state.refreshToken,
      }),

      onRehydrateStorage: () => (
        state
      ) => {
        if (state) {
          state.setHasHydrated(
            true
          );
        }
      },
    }
  )
);