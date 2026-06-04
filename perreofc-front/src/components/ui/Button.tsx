/**
 * Reusable UI component for the app design system: button.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { rf, rs } from '../../theme/responsive';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const heights: Record<ButtonSize, number> = { sm: rs(38), md: rs(48), lg: rs(54) };
const paddings: Record<ButtonSize, number> = { sm: rs(14), md: rs(20), lg: rs(24) };
const fontSizes: Record<ButtonSize, number> = { sm: rf(13), md: rf(15), lg: rf(16) };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddings[size],
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary' && { backgroundColor: colors.accent }),
    ...(variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.accent,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
    }),
    ...(variant === 'destructive' && { backgroundColor: '#EF4444' }),
    ...style,
  };

  const textStyle: TextStyle = {
    ...typography.button,
    fontSize: fontSizes[size],
    ...(variant === 'primary' && { color: '#FDFFFF' }),
    ...(variant === 'secondary' && { color: colors.accent }),
    ...(variant === 'ghost' && { color: colors.text }),
    ...(variant === 'destructive' && { color: '#FDFFFF' }),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? '#FDFFFF' : colors.accent}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          <Text style={textStyle}>{label}</Text>
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
