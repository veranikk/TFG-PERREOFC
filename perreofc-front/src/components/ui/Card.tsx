/**
 * Reusable UI component for the app design system: card.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  noBorder?: boolean;
}

export function Card({ children, style, padding = 16, noBorder = false }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding,
          borderWidth: isDark || noBorder ? 0 : 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
