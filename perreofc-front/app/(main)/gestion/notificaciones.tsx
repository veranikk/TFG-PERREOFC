/**
 * Renders the notificaciones screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Send, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { Button } from '../../../src/components/ui/Button';
import { typography } from '../../../src/theme/typography';
import { brand } from '../../../src/theme/colors';
import { notificationsApi } from '../../../src/services/api/modules/notifications';

type Segment = 'all' | 'aficionados' | 'jugadores' | 'admins';

const SEGMENTS: Array<{ key: Segment; label: string }> = [
  { key: 'all',         label: 'Todos' },
  { key: 'aficionados', label: 'Aficionados' },
  { key: 'jugadores',   label: 'Jugadores' },
  { key: 'admins',      label: 'Admins' },
];

const TEMPLATES = [
  '¡Partido esta tarde! Preparaos para apoyar al equipo 🍑',
  'Nueva noticia publicada en la app. ¡Échale un vistazo!',
  'La clasificación se ha actualizado. ¡Comprueba cómo estamos!',
  'El Top Fans de esta semana ya está disponible. ¡Comprueba tu posición!',
  'La tabla de goleadores se ha actualizado. ¿Quién lidera?',
  '¡Ya puedes apostar por el próximo partido! ¿A quién le das la victoria?',
  'La votación MVP del último partido ya está abierta. ¡Vota a tu favorito!',
];

export default function GestionNotificacionesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const res = await notificationsApi.broadcast({ segment, title: title.trim(), body: body.trim() });
      setResult(res);
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err?.message ?? 'Error al enviar la notificación');
    } finally {
      setSending(false);
    }
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 + insets.top : 0}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Notificaciones push</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Segmento */}
        <View style={{ gap: 8 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>DESTINATARIOS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SEGMENTS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSegment(key)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: segment === key ? colors.accent : colors.border,
                  backgroundColor: segment === key ? `${colors.accent}18` : colors.cardAlt,
                }}
              >
                <Text style={{
                  ...typography.caption,
                  color: segment === key ? colors.accent : colors.text,
                  fontFamily: segment === key ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            Solo los usuarios con notificaciones activadas recibirán el mensaje.
          </Text>
        </View>

        {/* Título */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>TÍTULO</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título de la notificación"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
            maxLength={60}
          />
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'right' }}>{title.length}/60</Text>
        </View>

        {/* Cuerpo */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>MENSAJE</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Escribe el mensaje aquí..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={{ ...inputStyle, minHeight: 100, textAlignVertical: 'top' }}
            maxLength={200}
          />
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'right' }}>{body.length}/200</Text>
        </View>

        {/* Plantillas */}
        <View style={{ gap: 8 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>PLANTILLAS RÁPIDAS</Text>
          {TEMPLATES.map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setBody(t)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ ...typography.caption, color: colors.text, lineHeight: 18 }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        {result && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.green}18`, borderRadius: 12, padding: 12 }}>
            <Check size={16} color={brand.green} />
            <Text style={{ ...typography.body, color: brand.green, fontFamily: 'Inter_600SemiBold' }}>
              Notificación enviada a {result.sent} usuario{result.sent !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {error && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF444418', borderRadius: 12, padding: 12 }}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={{ ...typography.body, color: '#EF4444', fontFamily: 'Inter_600SemiBold', flex: 1 }}>
              {error}
            </Text>
          </View>
        )}

        <Button
          label={sending ? 'Enviando...' : 'Enviar notificación'}
          fullWidth
          disabled={!canSend}
          onPress={handleSend}
          leftIcon={sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
