import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { 
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut
} from 'firebase/auth';
import api from '../data/api';
import { useQuizStore } from './quizStore';
import formatAxiosError from '../data/formatError';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,      
      isInitializing: false,   
      error: null,
      hasFinishedOnboarding: false,
      biometricEnabled: false,
      profileImage: null,
      token: null,              
      refreshToken: null,
      leaderboard: [],
      _hasHydrated: false,      

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setBiometricEnabled: (value) => set({ biometricEnabled: value }),
      setHasFinishedOnboarding: (value) => set({ hasFinishedOnboarding: value }),

      initialize: async () => {
        set({ isInitializing: true });
        try {
          const storedToken = await AsyncStorage.getItem('userToken');
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          if (storedToken) {
            set({ token: storedToken, refreshToken: storedRefreshToken });
            await get().fetchProfile();
          }
        } catch (err) {
          console.error("Auth initialization error:", err);
        } finally {
          set({ isInitializing: false, isLoading: false });
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          if (response.data?.data) {
            const profileData = response.data.data;
            set({ profile: profileData, user: profileData });
            useQuizStore.getState().hydrateUserStats(profileData);
          }
        } catch (err) {
          if (err.response?.status === 401) {
            const refreshResult = await get().refreshAuthToken();
            if (!refreshResult.success) {
              console.log("Session expired or invalid. Clearing local auth tokens.");
              await get().logout();
            }
          } else {
            console.error("Profile fetch error:", err.message);
          }
        }
      },

      fetchLeaderboard: async () => {
        try {
          const response = await api.get('/auth/leaderboard');
          const leaderboardData = response.data?.data || response.data || [];
          set({ leaderboard: leaderboardData });
          return { success: true, data: leaderboardData };
        } catch (err) {
          const formatted = formatAxiosError(err);
          console.error("Leaderboard fetch error:", formatted.message);
          return { success: false, error: formatted.message };
        }
      },

      updateProfile: async (updateData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch('/auth/profile', updateData);
          set({ isLoading: false });
          await get().fetchProfile();
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      sendOTP: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (identifier || '').trim();
          const isEmail = safeIdentifier.includes('@');
          const payload = isEmail ? { email: safeIdentifier } : { phoneNumber: safeIdentifier };

          const response = await api.post('/auth/send-otp', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      verifyOTP: async (code, identifier) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (identifier || '').trim();
          const isEmail = safeIdentifier.includes('@');
          const payload = isEmail 
            ? { email: safeIdentifier, code } 
            : { phoneNumber: safeIdentifier, code };

          const response = await api.post('/auth/verify-otp', payload);
          set({ isLoading: false });

          const accessToken = response.data?.tokens?.accessToken;
          const refreshTokenVal = response.data?.tokens?.refreshToken;
          const userData = response.data?.user;

          if (accessToken) {
            set({ 
              token: accessToken,
              refreshToken: refreshTokenVal || null,
              user: userData || { uid: safeIdentifier }
            });
            await AsyncStorage.setItem('userToken', accessToken);
            if (refreshTokenVal) {
              await AsyncStorage.setItem('refreshToken', refreshTokenVal);
              if (get().biometricEnabled) {
                await AsyncStorage.setItem('biometricRefreshToken', refreshTokenVal);
              }
            }
            await get().fetchProfile();
            await get().fetchLeaderboard();
          }
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      signUp: async ({ identifier, password, fullName, username }) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (identifier || '').trim();
          const isEmail = safeIdentifier.includes('@');

          const payload = {
            fullName,
            username,
            password,
            ...(isEmail ? { email: safeIdentifier } : { phoneNumber: safeIdentifier })
          };

          const response = await api.post('/auth/signup', payload);

          const accessToken = response.data?.tokens?.accessToken;
          const refreshTokenVal = response.data?.tokens?.refreshToken;
          const userData = response.data?.user;

          if (accessToken) {
            set({ 
              token: accessToken,
              refreshToken: refreshTokenVal || null,
              user: userData || { uid: safeIdentifier }
            });
            await AsyncStorage.setItem('userToken', accessToken);
            if (refreshTokenVal) {
              await AsyncStorage.setItem('refreshToken', refreshTokenVal);
              if (get().biometricEnabled) {
                await AsyncStorage.setItem('biometricRefreshToken', refreshTokenVal);
              }
            }
            await get().fetchProfile();
            await get().fetchLeaderboard();
          }

          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ error: formatted.message, isLoading: false });
          return { success: false, error: formatted.message };
        }
      },

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (identifier || '').trim();
          const isEmail = safeIdentifier.includes('@');
          const payload = isEmail
            ? { email: safeIdentifier, password }
            : { phoneNumber: safeIdentifier, password };

          const response = await api.post('/auth/login', payload);
          set({ isLoading: false });

          const accessToken = response.data?.tokens?.accessToken;
          const refreshTokenVal = response.data?.tokens?.refreshToken;
          const userData = response.data?.user;

          if (accessToken) {
            set({ 
              token: accessToken,
              refreshToken: refreshTokenVal || null,
              user: userData || { uid: safeIdentifier }
            });
            await AsyncStorage.setItem('userToken', accessToken);
            if (refreshTokenVal) {
              await AsyncStorage.setItem('refreshToken', refreshTokenVal);
              if (get().biometricEnabled) {
                await AsyncStorage.setItem('biometricRefreshToken', refreshTokenVal);
              }
            }
            await get().fetchProfile();
            await get().fetchLeaderboard();
          }

          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ error: formatted.message, isLoading: false });
          return { success: false, error: formatted.message };
        }
      },

      biometricLogin: async (savedEmail) => {
        set({ isLoading: true, error: null });
        try {
          const storedBioToken = await AsyncStorage.getItem('biometricRefreshToken');
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          const currentRefreshToken = storedBioToken || storedRefreshToken || get().refreshToken;
          
          if (!currentRefreshToken) {
            set({ isLoading: false });
            return { success: false, error: 'No active session token found. Please sign in with your password.' };
          }

          const response = await api.post('/auth/refresh-token', { refreshToken: currentRefreshToken });
          const newAccessToken = response.data?.tokens?.accessToken;
          const newRefreshToken = response.data?.tokens?.refreshToken;

          if (newAccessToken) {
            set({ token: newAccessToken });
            await AsyncStorage.setItem('userToken', newAccessToken);
          }
          if (newRefreshToken) {
            set({ refreshToken: newRefreshToken });
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            if (get().biometricEnabled) {
              await AsyncStorage.setItem('biometricRefreshToken', newRefreshToken);
            }
          }

          await AsyncStorage.setItem('lastUserEmail', savedEmail);
          await get().fetchProfile();
          await get().fetchLeaderboard();
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword
          });
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      refreshAuthToken: async () => {
        try {
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          const currentRefreshToken = storedRefreshToken || get().refreshToken;
          if (!currentRefreshToken) return { success: false, error: 'No refresh token found' };

          const response = await api.post('/auth/refresh-token', { refreshToken: currentRefreshToken });
          const newAccessToken = response.data?.tokens?.accessToken;
          const newRefreshToken = response.data?.tokens?.refreshToken;

          if (newAccessToken) {
            set({ token: newAccessToken });
            await AsyncStorage.setItem('userToken', newAccessToken);
          }
          if (newRefreshToken) {
            set({ refreshToken: newRefreshToken });
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            if (get().biometricEnabled) {
              await AsyncStorage.setItem('biometricRefreshToken', newRefreshToken);
            }
          }
          return { success: true };
        } catch (err) {
          get().logout();
          return { success: false, error: 'Session expired' };
        }
      },

      forgotPassword: async (emailOrPhone) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (emailOrPhone || '').trim();
          const isEmail = safeIdentifier.includes('@');
          const payload = isEmail ? { email: safeIdentifier } : { phoneNumber: safeIdentifier };

          const response = await api.post('/auth/forgot-password', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      resetPassword: async (identifier, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const safeIdentifier = (identifier || '').trim();
          const isEmail = safeIdentifier.includes('@');
          const payload = isEmail ? { email: safeIdentifier, newPassword } : { phoneNumber: safeIdentifier, newPassword };

          const response = await api.post('/auth/reset-password', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      googleAuth: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);

          const { email, displayName } = userCredential.user;
          const uniqueUsername = email 
            ? `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}` 
            : `user_${Math.floor(10000 + Math.random() * 90000)}`;

          const response = await api.post('/auth/google', { 
            email, 
            fullName: displayName || 'Google User',
            username: uniqueUsername
          });
          
          const accessToken = response.data?.tokens?.accessToken;
          const refreshTokenVal = response.data?.tokens?.refreshToken;

          set({ 
            user: userCredential.user,
            token: accessToken,
            refreshToken: refreshTokenVal || null,
            isLoading: false 
          });
          if (accessToken) {
            await AsyncStorage.setItem('userToken', accessToken);
          }
          if (refreshTokenVal) {
            await AsyncStorage.setItem('refreshToken', refreshTokenVal);
            if (get().biometricEnabled) {
              await AsyncStorage.setItem('biometricRefreshToken', refreshTokenVal);
            }
          }
          await get().fetchProfile();
          await get().fetchLeaderboard();

          return { success: true, data: userCredential.user };
        } catch (error) {
          const formatted = formatAxiosError(error);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      submitQuizHistory: async (quizData) => {
        try {
          const response = await api.post('/auth/quiz-history', quizData);
          await get().fetchLeaderboard(); 
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          return { success: false, error: formatted.message };
        }
      },

      logout: async () => {
        try {
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          const currentRefreshToken = storedRefreshToken || get().refreshToken;
          try { 
            if (currentRefreshToken) {
              await api.post('/auth/logout', { 
                refreshToken: currentRefreshToken, 
                keepBiometricSession: get().biometricEnabled 
              }); 
            }
          } catch (e) {}
          try { await firebaseSignOut(auth); } catch (e) {} 
          
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('refreshToken');

          useQuizStore.getState().clearUserSession();
          set({ user: null, profile: null, profileImage: null, token: null, refreshToken: null, leaderboard: [] });
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ error: formatted.message });
        }
      },

      githubLogin: () => {
        console.log("GitHub login triggered");
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        hasFinishedOnboarding: state.hasFinishedOnboarding,
        biometricEnabled: state.biometricEnabled,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);