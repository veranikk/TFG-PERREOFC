/**
 * Renders the logs screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import { SystemLog } from '../../../src/types';
import { logsApi } from '../../../src/services/api/modules/logs';

const ACTION_COLORS: Record<string, string> = {
  // Auth
  register:                brand.blue,
  'user.update_profile':   brand.blue,
  'user.change_password':  brand.blue,
  daily_login:             brand.green,
  // Eventos / contenido
  'event.create':          brand.green,
  'event.update':          brand.orange,
  'event.delete':          state.error,
  'event_category.create': brand.green,
  'event_category.delete': state.error,
  'news.create':           brand.green,
  'news.update':           brand.orange,
  'news.delete':           state.error,
  'news_category.create':  brand.green,
  'news_category.delete':  state.error,
  'squad_call.create':     brand.green,
  'squad_call.update':     brand.orange,
  'squad_call.delete':     state.error,
  // Imágenes
  'player_image.add':          brand.green,
  'player_image.set_profile':  brand.orange,
  'player_image.delete':       state.error,
  'staff_image.add':           brand.green,
  'staff_image.set_profile':   brand.orange,
  'staff_image.delete':        state.error,
  // Admin
  adjustment: brand.orange,
  vote_mvp:   '#8B5CF6',
};

type Filter = 'all' | 'auth' | 'events' | 'admin';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all',    label: 'Todo' },
  { key: 'auth',   label: 'Usuarios' },
  { key: 'events', label: 'Contenido' },
  { key: 'admin',  label: 'Admin' },
];

function formatTs(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

export default function LogsScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (f: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await logsApi.getLogs(f);
      setLogs(res.logs);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filter);
  }, [filter, fetchLogs]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Registros del sistema</Text>
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: filter === key ? colors.accent : colors.cardAlt,
              borderWidth: 1,
              borderColor: filter === key ? colors.accent : colors.border,
            }}
          >
            <Text style={{
              ...typography.caption,
              color: filter === key ? '#fff' : colors.textMuted,
              fontFamily: 'Inter_600SemiBold',
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ ...typography.body, color: state.error, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchLogs(filter)}
            activeOpacity={0.7}
            style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.accent, borderRadius: 8 }}
          >
            <Text style={{ ...typography.caption, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            {total} registro{total !== 1 ? 's' : ''}
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {logs.length === 0 ? (
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', paddingTop: 40 }}>
                No hay registros
              </Text>
            ) : logs.map((log) => {
              const color = ACTION_COLORS[log.action] ?? brand.grey;
              return (
                <View
                  key={log.id}
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16, paddingVertical: 12,
                    backgroundColor: colors.card,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 6 }} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <View style={{ backgroundColor: `${color}22`, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ ...typography.label, color, fontSize: 10, fontFamily: 'Inter_700Bold' }}>{log.action}</Text>
                      </View>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>@{log.username}</Text>
                    </View>
                    {log.details && (
                      <Text style={{ ...typography.caption, color: colors.text, lineHeight: 18 }}>{log.details}</Text>
                    )}
                    <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>{formatTs(log.timestamp)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
