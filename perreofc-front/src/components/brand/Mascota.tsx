/**
 * Feature UI component used by the mobile app: mascota.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React from 'react';
import { Image, View, ViewStyle, ImageStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';

// Asset principal (foto real de la mascota) — fallback al icono del escudo
let mascotaSource: number | null = null;
try {
  mascotaSource = require('../../../assets/brand/mascota-melocoton.png');
} catch {
  mascotaSource = null;
}

// Icono de respaldo cuando no hay foto real
let mascotaIcon: number | null = null;
try {
  mascotaIcon = require('../../../assets/brand/mascota-icon.png');
} catch {
  mascotaIcon = null;
}

type MascotaSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<MascotaSize, number> = {
  sm: 64,
  md: 100,
  lg: 140,
  xl: 200,
};

interface MascotaProps {
  size?: MascotaSize;
  style?: ViewStyle;
}

export function Mascota({ size = 'md', style }: MascotaProps) {
  const { colors } = useTheme();
  const dim = sizes[size];

  // Foto real de la mascota
  if (mascotaSource) {
    return (
      <Image
        source={mascotaSource}
        style={[{ width: dim, height: dim } as ImageStyle, style as ImageStyle]}
        resizeMode="contain"
      />
    );
  }

  // Icono del escudo como fallback
  if (mascotaIcon) {
    return (
      <Image
        source={mascotaIcon}
        style={[{ width: dim, height: dim } as ImageStyle, style as ImageStyle]}
        resizeMode="contain"
      />
    );
  }

  // Último recurso: placeholder con borde discontinuo
  return (
    <View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: 2,
          borderColor: colors.textMuted,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cardAlt,
        },
        style,
      ]}
    >
      <Ionicons name="football" size={dim * 0.4} color={colors.textMuted} />
    </View>
  );
}
