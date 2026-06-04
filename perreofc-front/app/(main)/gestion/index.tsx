/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {
  Star,
  Trophy,
  Bell,
  FileText,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { typography } from '../../../src/theme/typography';
import { brand } from '../../../src/theme/colors';

const SUPERADMIN_CARDS = [
  {
    route: '/(main)/gestion/usuarios',
    icon: Users,
    color: brand.blue,
    title: 'Gestión de usuarios',
    subtitle: 'Jugadores y administradores',
  },
  {
    route: '/(main)/gestion/puntos',
    icon: Star,
    color: brand.orange,
    title: 'Sistema de puntos',
    subtitle: 'Configura los puntos por acción',
  },
  {
    route: '/(main)/gestion/leaderboard',
    icon: Trophy,
    color: '#F59E0B',
    title: 'Top Fans',
    subtitle: 'Ajusta manualmente los puntos de los usuarios',
  },
  {
    route: '/(main)/gestion/notificaciones',
    icon: Bell,
    color: '#8B5CF6',
    title: 'Notificaciones push',
    subtitle: 'Enviar mensajes segmentados',
  },
  {
    route: '/(main)/gestion/logs',
    icon: FileText,
    color: brand.green,
    title: 'Registros del sistema',
    subtitle: 'Historial de acciones y eventos',
  },
] as const;

const ADMIN_CARDS = [
  {
    route: '/(main)/gestion/usuarios',
    icon: Users,
    color: brand.blue,
    title: 'Gestión de usuarios',
    subtitle: 'Jugadores y administradores',
  },
  {
    route: '/(main)/gestion/notificaciones',
    icon: Bell,
    color: '#8B5CF6',
    title: 'Notificaciones push',
    subtitle: 'Enviar mensajes segmentados',
  },
] as const;

export default function GestionScreen() {
  const { colors } = useTheme();
  const { isSuperAdmin, isStrictAdmin } = useRole();

  const visibleCards = isStrictAdmin ? ADMIN_CARDS : SUPERADMIN_CARDS;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}>
        <Text style={{ ...typography.h2, color: colors.text, marginBottom: 4 }}>Gestión</Text>
        <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: 8 }}>
          {isStrictAdmin ? 'Panel de administración' : 'Panel de administración superadmin'}
        </Text>

        {visibleCards.map(({ route, icon: Icon, color, title, subtitle }, i) => (
          <MotiView
            key={route}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 70 }}
          >
          <TouchableOpacity
            onPress={() => router.push(route as any)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: `${color}18`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={24} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodyLg, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{title}</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
}
