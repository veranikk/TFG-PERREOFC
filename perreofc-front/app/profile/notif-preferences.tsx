/**
 * Renders the notif preferences screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Bell, BellOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { typography } from '../../src/theme/typography';
import { brand } from '../../src/theme/colors';
import { meApi } from '../../src/services/api/modules/me';

export default function NotifPreferencesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    meApi.getNotificationsEnabled()
      .then((res) => setEnabled(res.enabled))
      .catch(() => {/* mantener default */})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setEnabled(value); // Optimistic update
    setSaving(true);
    try {
      await meApi.setNotificationsEnabled(value);
    } catch {
      setEnabled(!value); // Revert on error
    } finally {
      setSaving(false);
    }
  };

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
          Preferencias de notificaciones
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <View style={{ padding: 16, gap: 16 }}>
          {/* Toggle principal */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              padding: 16, gap: 14,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: enabled ? `${brand.orange}18` : `${colors.textMuted}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {enabled
                  ? <Bell size={20} color={brand.orange} />
                  : <BellOff size={20} color={colors.textMuted} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_500Medium' }}>
                  Recibir notificaciones
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  {enabled
                    ? 'Recibirás notificaciones en la app'
                    : 'No recibirás notificaciones en la app'}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                disabled={saving}
                trackColor={{ false: colors.border, true: `${brand.orange}88` }}
                thumbColor={enabled ? brand.orange : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          <Text style={{ ...typography.caption, color: colors.textMuted, paddingHorizontal: 4, lineHeight: 18 }}>
            Si desactivas las notificaciones, no recibirás avisos sobre apuestas ganadas, votos MVP ni mensajes del club.
          </Text>
        </View>
      )}
    </View>
  );
}
