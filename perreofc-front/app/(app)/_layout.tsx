/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Tabs, Redirect } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Newspaper,
  Bot,
  Users,
  UserCog,
  Settings,
} from 'lucide-react-native';

import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRole } from '../../src/hooks/useRole';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { RoleSwitcher } from '../../src/components/dev/RoleSwitcher';

export default function AppLayout() {
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const { isSuperAdmin } = useRole();
  const insets = useSafeAreaInsets();

  // Redirige a login si no hay sesión
  if (!isLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Tab bar height: base 56px + bottom inset (home indicator on iOS)
  const tabBarHeight = 56 + (Platform.OS !== 'web' ? insets.bottom : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader topInset={insets.top} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: Platform.OS !== 'web' ? insets.bottom : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
          },
        }}
      >
        {/* ── Tabs comunes a todos los roles ─────────────────────────── */}
        <Tabs.Screen
          name="calendario"
          options={{
            title: 'Calendario',
            tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="noticias"
          options={{
            title: 'Noticias',
            tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: 'Chatbot',
            tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="equipo"
          options={{
            title: 'Equipo',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />

        {/* ── Tabs solo SuperAdmin ───────────────────────────────────── */}
        <Tabs.Screen
          name="usuarios"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, size }) => <UserCog size={size} color={color} />,
            href: isSuperAdmin ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="gestion"
          options={{
            title: 'Gestión',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
            href: isSuperAdmin ? undefined : null,
          }}
        />

        {/* ── Rutas que no deben aparecer en tabs ────────────────────── */}
        <Tabs.Screen name="design-system" options={{ href: null }} />
        <Tabs.Screen name="staff" options={{ href: null }} />
      </Tabs>

      {/* RoleSwitcher DEV-only */}
      <RoleSwitcher />
    </View>
  );
}
