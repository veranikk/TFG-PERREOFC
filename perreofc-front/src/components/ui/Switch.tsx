/**
 * Reusable UI component for the app design system: switch.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Switch as RNSwitch, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  style?: ViewStyle;
}

export function Switch({ value, onValueChange, label, description, style }: SwitchProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
        style,
      ]}
    >
      {(label || description) && (
        <View style={{ flex: 1, gap: 2 }}>
          {label && (
            <Text style={{ ...typography.body, color: colors.text }}>{label}</Text>
          )}
          {description && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{description}</Text>
          )}
        </View>
      )}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: `${colors.accent}66` }}
        thumbColor={value ? colors.accent : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}
