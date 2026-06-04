/**
 * Theme definition file for typography styling tokens.
 * It centralizes visual values so colors, spacing and typography remain consistent.
 */

// src/theme/typography.ts
import { TextStyle } from 'react-native';
import { rf } from './responsive';

export const typography: Record<string, TextStyle> = {
  // Bebas Neue — titulares y hero
  h1: { fontFamily: 'BebasNeue_400Regular', fontSize: rf(36), lineHeight: rf(42) },
  h2: { fontFamily: 'BebasNeue_400Regular', fontSize: rf(26), lineHeight: rf(32) },
  h3: { fontFamily: 'BebasNeue_400Regular', fontSize: rf(19), lineHeight: rf(24) },

  // Inter — UI y cuerpo
  body:    { fontFamily: 'Inter_400Regular',   fontSize: rf(15), lineHeight: rf(22) },
  bodyLg:  { fontFamily: 'Inter_400Regular',   fontSize: rf(16), lineHeight: rf(24) },
  label:   { fontFamily: 'Inter_500Medium',    fontSize: rf(12), lineHeight: rf(16) },
  caption: { fontFamily: 'Inter_400Regular',   fontSize: rf(12), lineHeight: rf(16) },
  button:  { fontFamily: 'Inter_600SemiBold',  fontSize: rf(15), lineHeight: rf(20) },
  buttonLg:{ fontFamily: 'Inter_600SemiBold',  fontSize: rf(16), lineHeight: rf(20) },
};
