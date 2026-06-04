/**
 * Reusable UI component for the app design system: input.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { rf, rs } from '../../theme/responsive';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  autoComplete?: TextInput['props']['autoComplete'];
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyle: ViewStyle = {
    backgroundColor: colors.cardAlt,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: error ? '#EF4444' : focused ? colors.accent : 'transparent',
    paddingHorizontal: rs(16),
    paddingVertical: multiline ? rs(12) : 0,
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    gap: rs(10),
    minHeight: multiline ? numberOfLines * rf(24) + rs(28) : rs(52),
    ...style,
  };

  // En web, el TextInput renderiza un <input> HTML con fondo blanco por defecto.
  // Forzamos el color del tema directamente como inline style (máxima prioridad).
  const webInputStyle: TextStyle = Platform.OS === 'web'
    ? ({
        // @ts-ignore: outline es CSS web, no existe en tipos RN
        outline: 'none',
        backgroundColor: colors.cardAlt,
      } as TextStyle)
    : {};

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            ...typography.label,
            color: error ? '#EF4444' : colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}
      <View style={containerStyle}>
        {leftIcon && <View style={{ opacity: 0.6 }}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          maxLength={maxLength}
          style={[
            {
              flex: 1,
              ...typography.body,
              // lineHeight in single-line TextInput on iOS causes broken placeholder spacing
              ...(multiline ? {} : { lineHeight: undefined }),
              color: colors.text,
              padding: 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            webInputStyle,
            inputStyle,
          ]}
        />
        {rightIcon && <View>{rightIcon}</View>}
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7}>
            {showPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={{ ...typography.caption, color: '#EF4444' }}>{error}</Text>
      ) : hint ? (
        <Text style={{ ...typography.caption, color: colors.textMuted }}>{hint}</Text>
      ) : null}
    </View>
  );
}
