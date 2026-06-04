/**
 * Reusable UI component for the app design system: app header.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { Logo } from '../brand/Logo';
import { Avatar } from './Avatar';
import { typography } from '../../theme/typography';

interface AppHeaderProps {
  topInset?: number;
}

export function AppHeader({ topInset = 0 }: AppHeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { hasPoints } = useRole();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        // Asegura que el header esté siempre encima del contenido en Android
        zIndex: 10,
        elevation: 4,
      }}
    >
      {/* Spacer para el status bar */}
      <View style={{ height: topInset }} />

      {/* Barra de 60px con layout de 3 columnas: izquierda fija | centro absoluto | derecha fija */}
      <View style={{ height: 60, paddingHorizontal: 16 }}>

        {/* Centro: absolutamente centrado en la barra */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Logo size="xs" />
            <Text style={{ ...typography.h3, color: colors.text, letterSpacing: 1 }}>
              PERREO FC
            </Text>
          </View>
        </View>

        {/* Izquierda y derecha en fila, para que el centro absoluto no interfiera */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Izquierda: pill de puntos (solo aficionado) */}
          <View style={{ width: 80, alignItems: 'flex-start' }}>
            {hasPoints && (
              <TouchableOpacity
                onPress={() => router.push('/leaderboard')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: `${colors.accent}18`,
                  borderRadius: 9999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: `${colors.accent}44`,
                }}
              >
                <Text style={{ fontSize: 14 }}>🍑</Text>
                <Text style={{ ...typography.label, color: colors.accent, fontFamily: 'Inter_700Bold' }}>
                  {user?.points ?? 0}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Derecha: solo avatar con badge de no leídas */}
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={{ width: 80, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <View style={{ position: 'relative' }}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size="sm" />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: colors.bg,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', lineHeight: 13 }}>
                    {badgeLabel}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}
