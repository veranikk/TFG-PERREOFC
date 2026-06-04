/**
 * Renders the puntos screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import { api } from '../../../src/services/api/index';

interface PointsConfig {
  register:   number;
  dailyLogin: number;
  voteMvp:    number;
  winBet:     number;
}

const DEFAULT_CONFIG: PointsConfig = {
  register:   100,
  dailyLogin: 10,
  voteMvp:    50,
  winBet:     200,
};

const FIELDS: Array<{ key: keyof PointsConfig; label: string; description: string }> = [
  { key: 'register',   label: 'Registro',    description: 'Puntos al crear una cuenta nueva' },
  { key: 'dailyLogin', label: 'Login diario', description: 'Puntos por acceder al día (1 vez/día)' },
  { key: 'voteMvp',    label: 'Votar MVP',    description: 'Puntos por votar al mejor del partido' },
  { key: 'winBet',     label: 'Puntos extra', description: 'Puntos extra al acertar el resultado de una apuesta' },
];

export default function PuntosScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState<PointsConfig>({ ...DEFAULT_CONFIG });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api.home.getPointsConfig()
      .then((data: any) => {
        setConfig({
          register:   data.register   ?? DEFAULT_CONFIG.register,
          dailyLogin: data.dailyLogin ?? DEFAULT_CONFIG.dailyLogin,
          voteMvp:    data.voteMvp    ?? DEFAULT_CONFIG.voteMvp,
          winBet:     data.winBet     ?? DEFAULT_CONFIG.winBet,
        });
      })
      .catch(() => setLoadError('Error al cargar la configuración'))
      .finally(() => setIsLoading(false));
  }, []);

  const update = (key: keyof PointsConfig, raw: string) => {
    setConfig((c) => ({ ...c, [key]: Math.max(0, parseInt(raw) || 0) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.home.updatePointsConfig({
        register:   config.register,
        dailyLogin: config.dailyLogin,
        voteMvp:    config.voteMvp,
        winBet:     config.winBet,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e?.data?.error ?? e?.message ?? 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Sistema de puntos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
        <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
          Define cuántos puntos 🍑 gana un aficionado por cada acción. Los cambios se aplican a nuevas acciones.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        ) : loadError ? (
          <Text style={{ ...typography.body, color: state.error, textAlign: 'center' }}>{loadError}</Text>
        ) : (
          FIELDS.map(({ key, label, description }) => (
            <View key={key} style={{ gap: 6 }}>
              <Input
                label={label}
                value={String(config[key])}
                onChangeText={(t) => update(key, t)}
                keyboardType="numeric"
              />
              <Text style={{ ...typography.caption, color: colors.textMuted }}>{description}</Text>
            </View>
          ))
        )}

        {saved && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.green}18`, borderRadius: 12, padding: 12 }}>
            <Check size={16} color={brand.green} />
            <Text style={{ ...typography.body, color: brand.green, fontFamily: 'Inter_600SemiBold' }}>Configuración guardada</Text>
          </View>
        )}

        {saveError && (
          <View style={{ backgroundColor: `${state.error}15`, borderRadius: 12, padding: 12 }}>
            <Text style={{ ...typography.body, color: state.error }}>{saveError}</Text>
          </View>
        )}

        <Button
          label={saving ? 'Guardando...' : 'Guardar configuración'}
          fullWidth
          onPress={handleSave}
          loading={saving}
          disabled={saving || isLoading}
        />
      </ScrollView>
    </View>
  );
}
