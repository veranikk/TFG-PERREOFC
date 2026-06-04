/**
 * Reusable UI component for the app design system: points modal.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { brand } from '../../theme/colors';

interface PointsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  pointsAwarded: number;
  emoji?: string;
  newBalance?: number;
  ctaLabel?: string;
}

export function PointsModal({
  visible,
  onClose,
  title,
  description,
  pointsAwarded,
  emoji = '🍑',
  newBalance,
  ctaLabel = '¡Genial!',
}: PointsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.bg,
            borderRadius: 20,
            padding: 28,
            width: '100%',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Emoji circle */}
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: `${brand.orange}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 36 }}>{emoji}</Text>
          </View>

          {/* Points awarded */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 48, fontFamily: 'Inter_700Bold', color: colors.accent, lineHeight: 56 }}>
              +{pointsAwarded}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              puntos 🍑
            </Text>
          </View>

          {/* Title + description */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>
              {title}
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              {description}
            </Text>
          </View>

          {/* New balance */}
          {newBalance !== undefined && (
            <View style={{
              backgroundColor: `${brand.orange}12`,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                Saldo total: <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>{newBalance} 🍑</Text>
              </Text>
            </View>
          )}

          {/* CTA */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? `${brand.orange}cc` : brand.orange,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
              width: '100%',
              alignItems: 'center',
              marginTop: 4,
            })}
          >
            <Text style={{ ...typography.button, color: '#fff' }}>{ctaLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
