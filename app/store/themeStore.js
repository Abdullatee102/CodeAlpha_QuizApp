import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../constants/themes';

export const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      theme: lightTheme,

      toggleTheme: () => set((state) => {
        const nextMode = !state.isDarkMode;
        return {
          isDarkMode: nextMode,
          theme: nextMode ? darkTheme : lightTheme,
        };
      }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);