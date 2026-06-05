/**
 * Theme definition file for theme provider styling tokens.
 * It centralizes visual values so colors, spacing and typography remain consistent.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { themes, ThemeColors, ColorScheme } from './colors';
import { useThemeStore } from '../store/useThemeStore';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  isDark: boolean;
  toggle: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: themes.light,
  scheme: 'light',
  isDark: false,
  toggle: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { scheme, toggle, rehydrate } = useThemeStore();

  useEffect(() => {
    rehydrate();
  }, []);

  // En web: sincronizar data-theme en <html> para que las variables CSS de +html.tsx
  // se actualicen y los inputs tengan el fondo correcto según el tema activo.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', scheme);
    }
  }, [scheme]);

  const value: ThemeContextValue = {
    colors: themes[scheme],
    scheme,
    isDark: scheme === 'dark',
    toggle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Iconos de la status bar: oscuros sobre header claro (light), claros sobre header oscuro (dark) */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
