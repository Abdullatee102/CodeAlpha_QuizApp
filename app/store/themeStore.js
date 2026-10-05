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
  return Appearance.getColorScheme() || 'light';
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

    isDarkMode: isSystemDark,
  };
};

const getInitialThemeState = () => {
  const systemScheme =
    getSystemColorScheme();

  try {
    const raw =
      storage.getString('theme-storage');

    if (raw) {
      const parsed =
        JSON.parse(raw);

      const savedAppearance =
        parsed?.state?.appearance;

      if (
        savedAppearance === 'system' ||
        savedAppearance === 'light' ||
        savedAppearance === 'dark'
      ) {
        const themeConfig =
          getThemeForAppearance(
            savedAppearance,
            systemScheme
          );

        return {
          appearance:
            savedAppearance,

          theme:
            themeConfig.theme,

          isDarkMode:
            themeConfig.isDarkMode,
        };
      }
    }
  } catch (error) {
    console.warn(
      '[THEME] Error reading initial theme from MMKV:',
      error
    );
  }

  /*
   * System Default is the default
   * appearance for new users.
   */
  const defaultTheme =
    getThemeForAppearance(
      'system',
      systemScheme
    );

  return {
    appearance: 'system',

    theme:
      defaultTheme.theme,

    isDarkMode:
      defaultTheme.isDarkMode,
  };
};

const initialThemeState =
  getInitialThemeState();

export const useThemeStore = create(
  persist(
    (set, get) => ({
      /*
       * System Default is the
       * default appearance.
       */
      appearance:
        initialThemeState.appearance,

      isDarkMode:
        initialThemeState.isDarkMode,

      theme:
        initialThemeState.theme,

      /*
       * Change appearance preference.
       *
       * Supported values:
       * - system
       * - light
       * - dark
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
       * Existing code that still calls
       * toggleTheme() will continue working.
       *
       * It toggles between Light and Dark.
       */
      toggleTheme: () => {
        const currentAppearance =
          get().appearance;

        const currentIsDark =
          get().isDarkMode;

        const nextAppearance =
          currentAppearance === 'light'
            ? 'dark'
            : currentAppearance === 'dark'
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
       * Called whenever the device's
       * system theme changes.
       *
       * This only affects the app when
       * the user selected "System Default".
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
       * Only the user's actual preference
       * needs to be persisted.
       *
       * The active theme and isDarkMode
       * are derived again on startup.
       */
      partialize: (state) => ({
        appearance:
          state.appearance,
      }),

      /*
       * Recalculate the actual theme after
       * Zustand restores the saved preference.
       *
       * This is especially important for
       * "System Default".
       */
      onRehydrateStorage: () => (
        state
      ) => {
        if (!state) {
          return;
        }

        const systemColorScheme =
          getSystemColorScheme();

        const next =
          getThemeForAppearance(
            state.appearance,
            systemColorScheme
          );

        state.theme =
          next.theme;

        state.isDarkMode =
          next.isDarkMode;
      },
    }
  )
);

/*
 * Listen for changes to the phone's
 * system appearance.
 *
 * This only changes the app when
 * "System Default" is selected.
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