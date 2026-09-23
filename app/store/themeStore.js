import { create } from 'zustand';

import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import {
  mmkvStorage,
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

export const useThemeStore = create(
  persist(
    (set, get) => ({
      /*
       * Available values:
       *
       * 'system'
       * 'light'
       * 'dark'
       */
      appearance: 'system',

      /*
       * These remain available so existing screens
       * do not need to be rewritten.
       */
      isDarkMode:
        getSystemColorScheme() ===
        'dark',

      theme:
        getSystemColorScheme() ===
        'dark'
          ? darkTheme
          : lightTheme,

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

      /*
       * Only persist the user's preference.
       *
       * theme and isDarkMode are derived values and
       * should be recalculated when the app starts.
       */
      partialize: (state) => ({
        appearance:
          state.appearance,
      }),
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