/**
 * Theme definition file for colors styling tokens.
 * It centralizes visual values so colors, spacing and typography remain consistent.
 */

// src/theme/colors.ts
// Paleta oficial de Perreo FC — NO modificar colores brand sin aprobación del club

export const brand = {
  orange: '#FE6128', // PRIMARIO. Camiseta titular. CTAs y acentos.
  blue:   '#75A8E0', // Camiseta de entrenadores. Acento secundario.
  green:  '#3AAA35', // Hojas del melocotón del logo. Éxitos/victorias.
  white:  '#FDFFFF', // Segunda equipación.
  black:  '#000000', // Segunda equipación.
  grey:   '#9F9CA5', // Chaquetas de entrenadores. Texto secundario.
} as const;

export const state = {
  success: '#22C55E',
  error:   '#EF4444',
  warning: '#F59E0B',
  info:    '#1E3A8A',
} as const;

export const themes = {
  light: {
    bg:        '#FDFFFF',
    bgAlt:     '#F5F5F7',
    card:      '#FFFFFF',
    cardAlt:   '#F0F0F3',
    border:    '#E5E5EA',
    text:      '#000000',
    textMuted: '#6B6B73',
    accent:    brand.orange, // SIEMPRE naranja
  },
  dark: {
    bg:        '#1A1A2E',
    bgAlt:     '#141423',
    card:      '#242438',
    cardAlt:   '#2D2D45',
    border:    '#3A3A52',
    text:      '#FDFFFF',
    textMuted: brand.grey,
    accent:    brand.orange, // SIEMPRE naranja
  },
} as const;

// ThemeColors acepta tanto light como dark (valores en string, no literales)
export type ThemeColors = {
  bg:        string;
  bgAlt:     string;
  card:      string;
  cardAlt:   string;
  border:    string;
  text:      string;
  textMuted: string;
  accent:    string;
};
export type ColorScheme = 'light' | 'dark';
