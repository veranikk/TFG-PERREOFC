/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Tabs, Redirect, useRouter } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Newspaper,
  Bot,
  Users,
  Settings,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef, useCallback } from 'react';
import { registerForPushNotificationsAsync, configureForegroundNotifications, addNotificationTapListener } from '../../src/utils/pushNotifications';

// Configurar handler de notificaciones en primer plano (una vez)
configureForegroundNotifications();

import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRole } from '../../src/hooks/useRole';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useNotificationsStore } from '../../src/store/useNotificationsStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { RoleSwitcher } from '../../src/components/dev/RoleSwitcher';
import { PointsModal } from '../../src/components/ui/PointsModal';
import { api } from '../../src/services/api/index';

interface PointsNotification {
  title: string;
  description: string;
  pointsAwarded: number;
  newBalance?: number;
  emoji?: string;
  ctaLabel?: string;
}

export default function AppLayout() {
  const { colors } = useTheme();
  const { user, isLoading } = useAuth();
  const { isAdmin } = useRole();
  const insets = useSafeAreaInsets();
  const updateUser = useAuthStore((s) => s.updateUser);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);
  const router = useRouter();

  // Registro de push notifications al autenticarse
  useEffect(() => {
    if (!user?.id) return;
    registerForPushNotificationsAsync().catch(() => {});
  }, [user?.id]);

  // Listener: tap en notificación → navegar al inbox
  useEffect(() => {
    const cleanup = addNotificationTapListener(() => {
      router.push('/profile/notifications' as any);
    });
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cola de modales de puntos — se muestran uno a la vez
  const [queue, setQueue] = useState<PointsNotification[]>([]);
  const [current, setCurrent] = useState<PointsNotification | null>(null);
  const runningRef = useRef(false);

  // Mostrar siguiente modal de la cola
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
  }, [queue, current]);

  const enqueue = useCallback((notification: PointsNotification) => {
    setQueue((q) => [...q, notification]);
  }, []);

  // Fetch unread count al iniciar + polling cada 60s
  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ejecutar checks de puntos cuando el usuario está autenticado
  useEffect(() => {
    if (!user?.id) return;

    // Capturar valores del usuario en este render para evitar closure stale
    const userId = user.id;
    const role = user.role;

    (async () => {
      // 1. Modal de bienvenida por registro
      const pendingWelcomeRaw = await AsyncStorage.getItem('@perreofc:pendingWelcomePoints');
      if (pendingWelcomeRaw) {
        await AsyncStorage.removeItem('@perreofc:pendingWelcomePoints');
        enqueue({
          title: '¡Bienvenido a Perreo FC!',
          description: 'Has ganado puntos por crear tu cuenta. ¡A disfrutar!',
          pointsAwarded: parseInt(pendingWelcomeRaw, 10) || 100,
          ctaLabel: '¡Vamos!',
        });
      }

      // 2. Daily login (solo aficionados — backend rechaza otros roles con 403)
      if (role === 'aficionado') {
        // Usar fecha UTC para coincidir con la lógica del backend (que también usa UTC)
        const todayStr = new Date().toISOString().slice(0, 10); // "2026-06-03"
        const lastClaimDate = await AsyncStorage.getItem('@perreofc:lastDailyLoginDate');

        if (lastClaimDate !== todayStr) {
          try {
            const result = await api.home.claimDailyLogin();
            // Guardar siempre la fecha para no volver a intentarlo hoy
            await AsyncStorage.setItem('@perreofc:lastDailyLoginDate', todayStr);
            if (result && result.pointsAwarded > 0 && !result.alreadyClaimed) {
              updateUser({ points: result.newBalance });
              enqueue({
                title: '¡Bonus diario!',
                description: 'Por acceder hoy a Perreo FC',
                pointsAwarded: result.pointsAwarded,
                newBalance: result.newBalance,
              });
            }
          } catch {
            // 409 = ya reclamado hoy en otro dispositivo — guardar fecha para no reintentar
            await AsyncStorage.setItem('@perreofc:lastDailyLoginDate', todayStr);
          }
        }

        // 3. Apuestas ganadas desde la última vez
        const lastCheck = await AsyncStorage.getItem('@perreofc:lastWinBetCheck');
        const now = new Date().toISOString();

        if (!lastCheck) {
          // Primera sesión — guardar timestamp para próximas veces
          await AsyncStorage.setItem('@perreofc:lastWinBetCheck', now);
        } else {
          try {
            const result = await api.home.getMyPointsHistory({ action: 'win_bet', since: lastCheck });
            const newWins: any[] = result?.data ?? [];
            await AsyncStorage.setItem('@perreofc:lastWinBetCheck', now);

            if (newWins.length > 0) {
              const total = newWins.reduce((sum: number, tx: any) => sum + (tx.amount ?? 0), 0);
              enqueue({
                title: '¡Apuesta ganada!',
                description: newWins.length > 1
                  ? `Has acertado ${newWins.length} apuestas`
                  : '¡Has acertado el resultado!',
                pointsAwarded: total,
              });
            }
          } catch {
            // Error de red — ignorar silenciosamente
          }
        }
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
            title: 'Media',
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

        {/* ── Tabs Admin + SuperAdmin ────────────────────────────────── */}
        <Tabs.Screen
          name="usuarios"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="gestion"
          options={{
            title: 'Gestión',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
            href: isAdmin ? undefined : null,
          }}
        />

        {/* ── Rutas que no deben aparecer en tabs ────────────────────── */}
        <Tabs.Screen name="design-system" options={{ href: null }} />
        <Tabs.Screen name="staff" options={{ href: null }} />
      </Tabs>

      {/* RoleSwitcher DEV-only */}
      <RoleSwitcher />

      {/* ── Modal de puntos (muestra uno a la vez de la cola) ──────── */}
      {current && (
        <PointsModal
          visible
          onClose={() => setCurrent(null)}
          title={current.title}
          description={current.description}
          pointsAwarded={current.pointsAwarded}
          newBalance={current.newBalance}
          emoji={current.emoji}
          ctaLabel={current.ctaLabel}
        />
      )}
    </View>
  );
}
