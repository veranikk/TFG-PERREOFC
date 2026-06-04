/**
 * Zustand store for shared use theme store state in the app.
 * Screens read and update this store when the state must survive across routes.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme } from '../theme/colors';

const THEME_KEY = '@perreofc:theme';

interface ThemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => Promise<void>;
  toggle: () => Promise<void>;
  rehydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  scheme: 'light',

  setScheme: async (scheme) => {
    set({ scheme });
    await AsyncStorage.setItem(THEME_KEY, scheme);
  },

  toggle: async () => {
    const next = get().scheme === 'light' ? 'dark' : 'light';
    get().setScheme(next);
  },

  rehydrate: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      set({ scheme: saved });
    }
  },
}));
