/**
 * Renders the branding screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { Button } from '../../../src/components/ui/Button';
import { typography } from '../../../src/theme/typography';
import { brand } from '../../../src/theme/colors';

interface BrandingConfig {
  clubName: string;
  shortName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
}

const DEFAULT: BrandingConfig = {
  clubName:       'Perreo FC',
  shortName:      'PFC',
  description:    'Club de fútbol amateur de la liga regional. ¡Juntos somos más fuertes!',
  primaryColor:   '#FF6B2B',
  secondaryColor: '#1A1A2E',
  season:         '2025-26',
};

const COLOR_PRESETS = [
  { name: 'Naranja',  value: '#FF6B2B' },
  { name: 'Azul',     value: '#3B82F6' },
  { name: 'Verde',    value: '#10B981' },
  { name: 'Morado',   value: '#8B5CF6' },
  { name: 'Rojo',     value: '#EF4444' },
  { name: 'Rosa',     value: '#EC4899' },
];

export default function BrandingScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState<BrandingConfig>({ ...DEFAULT });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof BrandingConfig, value: string) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
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
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Branding</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
        {/* Preview badge */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: config.primaryColor,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#fff', letterSpacing: 1 }}>
              {config.shortName}
            </Text>
          </View>
          <Text style={{ ...typography.h3, color: colors.text }}>{config.clubName}</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Temporada {config.season}</Text>
        </View>

        {/* Nombre del club */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>NOMBRE DEL CLUB</Text>
          <TextInput value={config.clubName} onChangeText={(t) => update('clubName', t)} style={inputStyle} placeholderTextColor={colors.textMuted} />
        </View>

        {/* Nombre corto */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>NOMBRE CORTO (3 letras)</Text>
          <TextInput value={config.shortName} onChangeText={(t) => update('shortName', t.toUpperCase().slice(0, 3))} style={inputStyle} placeholderTextColor={colors.textMuted} maxLength={3} />
        </View>

        {/* Temporada */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>TEMPORADA</Text>
          <TextInput value={config.season} onChangeText={(t) => update('season', t)} style={inputStyle} placeholderTextColor={colors.textMuted} />
        </View>

        {/* Descripción */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>DESCRIPCIÓN</Text>
          <TextInput
            value={config.description}
            onChangeText={(t) => update('description', t)}
            multiline
            numberOfLines={3}
            style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Color principal */}
        <View style={{ gap: 10 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>COLOR PRINCIPAL</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {COLOR_PRESETS.map(({ name, value }) => (
              <TouchableOpacity
                key={value}
                onPress={() => update('primaryColor', value)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: config.primaryColor === value ? colors.text : colors.border,
                  backgroundColor: colors.cardAlt,
                }}
              >
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: value }} />
                <Text style={{ ...typography.caption, color: colors.text }}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {saved && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.green}18`, borderRadius: 12, padding: 12 }}>
            <Check size={16} color={brand.green} />
            <Text style={{ ...typography.body, color: brand.green, fontFamily: 'Inter_600SemiBold' }}>Configuración guardada</Text>
          </View>
        )}

        <Button label="Guardar cambios" fullWidth onPress={handleSave} />

        <TouchableOpacity
          onPress={() => setConfig({ ...DEFAULT })}
          style={{ alignItems: 'center', padding: 8 }}
          activeOpacity={0.7}
        >
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Restaurar valores por defecto</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
