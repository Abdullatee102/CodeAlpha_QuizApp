import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useQuizStore } from './quizStore';
import api from '../data/api';
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
      _hasHydrated: false,      

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setBiometricEnabled: (value) => set({ biometricEnabled: value }),
      setHasFinishedOnboarding: (value) => set({ hasFinishedOnboarding: value }),

      initialize: async () => {
        set({ isInitializing: true });
        try {
          const storedToken = await AsyncStorage.getItem('userToken');
          if (storedToken) {
            set({ token: storedToken });
          }
        } catch (err) {
          console.error("Auth initialization error:", err);
        } finally {
          set({ isInitializing: false, isLoading: false });
        }
      },

      fetchProfile: async (uid) => {
        try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            set({ profile: profileData });
            useQuizStore.getState().hydrateUserStats(profileData);
          }
        } catch (err) {
          console.error("Profile fetch error:", err.message);
        }
      },

      sendOTP: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
          const payload = identifier.includes('@') 
            ? { email: identifier } 
            : { phoneNumber: identifier };

          const response = await api.post('/auth/send-otp', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const newerror = formatAxiosError(err);
       
          set({ isLoading: false, error: newerror?.message });
          return { success: false, error: newerror?.message };
        }
      },

      verifyOTP: async (code, identifier) => {
        set({ isLoading: true, error: null });
        try {
          const payload = identifier.includes('@') 
            ? { email: identifier, code } 
            : { phoneNumber: identifier, code };

          const response = await api.post('/auth/verify-otp', payload);
          set({ isLoading: false });

          const authToken = response.data?.token;
          const userData = response.data?.user;

          if (authToken) {
            set({ 
              token: authToken,
              user: userData || { uid: identifier }
            });
            await AsyncStorage.setItem('userToken', authToken);
          }
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, error: formatted.message };
        }
      },

      signUp: async (email, password, fullName, phoneNumber) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/signup', {
            email,
            password,
            fullName,
            phoneNumber: phoneNumber || undefined
          });

          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ error: formatted.message, isLoading: false });
          return { success: false, msg: formatted.message };
        }
      },

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const payload = identifier.includes('@')
            ? { email: identifier, password }
            : { phoneNumber: identifier, password };

          const response = await api.post('/auth/login', payload);
          set({ isLoading: false });

          const authToken = response.data?.token;
          const userData = response.data?.user;

          if (authToken) {
            set({ 
              token: authToken,
              user: userData || { uid: identifier }
            });
            await AsyncStorage.setItem('userToken', authToken);
          }

          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ error: formatted.message, isLoading: false });
          return { success: false, msg: formatted.message };
        }
      },

      forgotPassword: async (emailOrPhone) => {
        set({ isLoading: true, error: null });
        try {
          const payload = emailOrPhone.includes('@')
            ? { email: emailOrPhone }
            : { phoneNumber: emailOrPhone };

          const response = await api.post('/auth/forgot-password', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, msg: formatted.message };
        }
      },

      resetPassword: async (identifier, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const payload = identifier.includes('@')
            ? { email: identifier, newPassword }
            : { phoneNumber: identifier, newPassword };

          const response = await api.post('/auth/reset-password', payload);
          set({ isLoading: false });
          return { success: true, data: response.data };
        } catch (err) {
          const formatted = formatAxiosError(err);
          set({ isLoading: false, error: formatted.message });
          return { success: false, msg: formatted.message };
        }
      },

      googleAuth: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);

          const firebaseToken = await userCredential.user.getIdToken();
          set({ 
            user: userCredential.user,
            token: firebaseToken,
            isLoading: false 
          });
          await AsyncStorage.setItem('userToken', firebaseToken);

          return userCredential.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      logout: async () => {
        try {
          try { await firebaseSignOut(auth); } catch (e) {} 
          await AsyncStorage.removeItem('userToken');
          set({ user: null, profile: null, profileImage: null, token: null });
        } catch (err) {
          set({ error: err.message });
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);