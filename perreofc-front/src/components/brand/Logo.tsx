/**
 * Feature UI component used by the mobile app: logo.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React from 'react';
import { Image, View, Text, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// TODO: reemplazar require por asset real de Figma cuando esté disponible
let logoSource: number | null = null;
try {
  logoSource = require('../../../assets/brand/logo-main.png');
} catch {
  logoSource = null;
}

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<LogoSize, number> = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 100,
  xl: 140,
};

interface LogoProps {
  size?: LogoSize;
  width?: number;
  height?: number;
  style?: ViewStyle | ImageStyle;
}

export function Logo({ size = 'md', width, height, style }: LogoProps) {
  const { colors } = useTheme();
  const dim = sizes[size];
  const w = width ?? dim;
  const h = height ?? dim;

  if (logoSource) {
    return (
      <Image
        source={logoSource}
        style={[{ width: w, height: h } as ImageStyle, style as ImageStyle]}
        resizeMode="contain"
      />
    );
  }

  // Placeholder con borde discontinuo mientras no existe el asset real
  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius: 12,
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
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: Math.max(10, w * 0.18),
          color: colors.textMuted,
        }}
      >
        LOGO
      </Text>
    </View>
  );
}
