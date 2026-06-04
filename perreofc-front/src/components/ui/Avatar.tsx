/**
 * Reusable UI component for the app design system: avatar.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Image, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;        // para generar iniciales si no hay imagen
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizes: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const fontSizes: Record<AvatarSize, number> = {
  xs: 11,
  sm: 13,
  md: 18,
  lg: 24,
  xl: 36,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const { colors } = useTheme();
  const dim = sizes[size];

  const baseStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  if (uri) {
    return (
      <View style={baseStyle}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[baseStyle, { backgroundColor: `${colors.accent}22` }]}>
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: fontSizes[size],
          color: colors.accent,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
