/**
 * Reusable UI component for the app design system: pill.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { brand, state } from '../../theme/colors';

type PillVariant = 'upcoming' | 'win' | 'loss' | 'draw' | 'live' | 'info' | 'custom';

interface PillProps {
  label: string;
  variant?: PillVariant;
  color?: string;       // para variant='custom'
  bgColor?: string;     // para variant='custom'
  style?: ViewStyle;
}

const variantStyles: Record<Exclude<PillVariant, 'custom'>, { bg: string; text: string }> = {
  upcoming: { bg: `${brand.blue}33`, text: brand.blue },
  win:      { bg: `${state.success}33`, text: state.success },
  loss:     { bg: `${state.error}33`, text: state.error },
  draw:     { bg: '#9F9CA533', text: '#9F9CA5' },
  live:     { bg: `${state.error}22`, text: state.error },
  info:     { bg: `${brand.orange}22`, text: brand.orange },
};

export function Pill({ label, variant = 'info', color, bgColor, style }: PillProps) {
  const { colors } = useTheme();

  const resolved =
    variant === 'custom'
      ? { bg: bgColor ?? colors.cardAlt, text: color ?? colors.textMuted }
      : variantStyles[variant];

  return (
    <View
      style={[
        {
          backgroundColor: resolved.bg,
          borderRadius: 9999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ ...typography.label, color: resolved.text, fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}
