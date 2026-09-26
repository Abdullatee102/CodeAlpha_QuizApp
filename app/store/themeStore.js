import { create } from 'zustand';

import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import {
  mmkvStorage,
  storage,
} from '../utils/mmkvStorage';

import {
  lightTheme,
  darkTheme,
} from '../constants/themes';

import {
  Appearance,
} from 'react-native';

const getSystemColorScheme = () => {
  return (
    Appearance.getColorScheme() ||
    'light'
  );
};

const getThemeForAppearance = (
  appearance,
  systemColorScheme
) => {
  if (appearance === 'light') {
    return {
      theme: lightTheme,
      isDarkMode: false,
    };
  }

  if (appearance === 'dark') {
    return {
      theme: darkTheme,
      isDarkMode: true,
    };
  }

  const isSystemDark =
    systemColorScheme === 'dark';

  return {
    theme: isSystemDark
      ? darkTheme
      : lightTheme,

    isDarkMode:
      isSystemDark,
  };
};

const getInitialThemeState = () => {
  const systemScheme = getSystemColorScheme();
  try {
    const raw = storage.getString('theme-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedAppearance = parsed?.state?.appearance;
      if (savedAppearance) {
        const themeConfig = getThemeForAppearance(savedAppearance, systemScheme);
        return {
          appearance: savedAppearance,
          theme: themeConfig.theme,
          isDarkMode: themeConfig.isDarkMode,
        };
      }
    }
  } catch (e) {
    console.warn('[THEME] Error reading initial theme from MMKV:', e);
  }
  const defaultTheme = getThemeForAppearance('system', systemScheme);
  return {
    appearance: 'system',
    theme: defaultTheme.theme,
    isDarkMode: defaultTheme.isDarkMode,
  };
};

const initialThemeState = getInitialThemeState();

export const useThemeStore = create(
  persist(
    (set, get) => ({
      appearance: initialThemeState.appearance,
      isDarkMode: initialThemeState.isDarkMode,
      theme: initialThemeState.theme,

      /*
       * Change appearance preference.
       */
      setAppearance: (
        appearance
      ) => {
        const systemColorScheme =
          getSystemColorScheme();

        const next =
          getThemeForAppearance(
            appearance,
            systemColorScheme
          );

        set({
          appearance,
          theme:
            next.theme,
          isDarkMode:
            next.isDarkMode,
        });
      },

      /*
       * Compatibility helper.
       *
       * Existing code that still calls toggleTheme()
       * will continue working.
       *
       * It toggles between Light and Dark.
       */
      toggleTheme: () => {
        const currentAppearance =
          get().appearance;

        const currentIsDark =
          get().isDarkMode;

        const nextAppearance =
          currentAppearance ===
          'light'
            ? 'dark'
            : currentAppearance ===
              'dark'
            ? 'light'
            : currentIsDark
            ? 'light'
            : 'dark';

        const next =
          getThemeForAppearance(
            nextAppearance,
            getSystemColorScheme()
          );

        set({
          appearance:
            nextAppearance,
          theme:
            next.theme,
          isDarkMode:
            next.isDarkMode,
        });
      },

      /*
       * Called when the device's system theme changes
       * while the user has selected "System Default".
       */
      updateSystemTheme: (
        systemColorScheme
      ) => {
        if (
          get().appearance !==
          'system'
        ) {
          return;
        }

        const next =
          getThemeForAppearance(
            'system',
            systemColorScheme
          );

        set({
          theme:
            next.theme,
          isDarkMode:
            next.isDarkMode,
        });
      },
    }),

    {
      name: 'theme-storage',

      storage:
        createJSONStorage(
          () => mmkvStorage
        ),

      partialize: (state) => ({
        appearance:
          state.appearance,
        isDarkMode:
          state.isDarkMode,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          const systemColorScheme = getSystemColorScheme();
          const next = getThemeForAppearance(
            state.appearance,
            systemColorScheme
          );
          state.theme = next.theme;
          state.isDarkMode = next.isDarkMode;
        }
      },
    }
  )
);

/*
 * Listen for changes to the phone's system appearance.
 *
 * This matters only when the user selected
 * "System Default".
 */
Appearance.addChangeListener(
  ({ colorScheme }) => {
    useThemeStore
      .getState()
      .updateSystemTheme(
        colorScheme || 'light'
      );
  }
);