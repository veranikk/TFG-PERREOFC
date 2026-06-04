/**
 * Renders the notifications screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Settings2, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { typography } from '../../src/theme/typography';
import { brand } from '../../src/theme/colors';
import { notificationsApi } from '../../src/services/api/modules/notifications';
import { useNotificationsStore } from '../../src/store/useNotificationsStore';
import type { Notification } from '../../src/services/api/types';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsInboxScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAndMarkRead = useCallback(async () => {
    try {
      const result = await notificationsApi.getNotifications(1, 50);
      const items = result.data ?? [];
      setNotifications(items);
      // Recordar cuáles eran no leídas antes de marcarlas
      setUnreadIds(new Set(items.filter((n) => !n.read).map((n) => n.id)));
      // Marcar todo como leído y actualizar el store
      if (items.some((n) => !n.read)) {
        await notificationsApi.markAllAsRead();
        setUnreadCount(0);
      }
    } catch {
      // Silencioso — se muestra lista vacía
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadAndMarkRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Cabecera */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>
          Notificaciones
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/profile/notif-preferences' as any)}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <Settings2 size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : notifications.length === 0 ? (
        /* Estado vacío */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Bell size={48} color={colors.border} />
          <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
            No tienes notificaciones todavía
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {notifications.map((notif) => {
            const wasUnread = unreadIds.has(notif.id);
            return (
              <View
                key={notif.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: wasUnread ? `${brand.orange}0A` : colors.bg,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  gap: 12,
                }}
              >
                {/* Dot indicador de no leída */}
                <View style={{ paddingTop: 6 }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: wasUnread ? brand.orange : 'transparent',
                  }} />
                </View>

                {/* Contenido */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{
                    ...typography.body,
                    color: colors.text,
                    fontFamily: wasUnread ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }}>
                    {notif.title}
                  </Text>
                  {notif.body ? (
                    <Text style={{ ...typography.caption, color: colors.textMuted, lineHeight: 18 }}>
                      {notif.body}
                    </Text>
                  ) : null}
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                    {timeAgo(notif.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
