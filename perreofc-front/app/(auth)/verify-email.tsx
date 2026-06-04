/**
 * Renders the verify email screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import { useTheme } from '../../src/hooks/useTheme';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Logo } from '../../src/components/brand/Logo';
import { typography } from '../../src/theme/typography';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 8) {
      setError('El código debe tener 8 dígitos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.verifyOtp(email ?? '', code, 'signup');
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Código incorrecto o expirado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ ...typography.body, color: colors.accent }}>← Volver</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 40, gap: 16 }}>
          <Logo size="md" />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ ...typography.h1, color: colors.text }}>Verifica tu email</Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
              Te hemos enviado un codigo de 6 digitos a{'\n'}
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                {email}
              </Text>
            </Text>
          </View>
        </View>

        {/* Banner de exito */}
        {success && (
          <View
            style={{
              backgroundColor: '#22C55E20',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#22C55E',
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={18} color="#22C55E" />
            <Text style={{ ...typography.body, color: '#22C55E', textAlign: 'center' }}>
              Email verificado. Redirigiendo al login...
            </Text>
          </View>
        )}

        {/* Banner de error */}
        {error && (
          <View
            style={{
              backgroundColor: '#EF444420',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EF4444',
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        {/* Formulario */}
        <View style={{ gap: 20 }}>
          <Input
            label="Codigo de verificacion"
            placeholder="123456"
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, '').slice(0, 8));
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={8}
            style={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, fontFamily: 'Inter_700Bold' }}
            error={undefined}
          />

          <Button
            label={loading ? 'Verificando...' : 'Verificar'}
            loading={loading}
            onPress={handleVerify}
            fullWidth
            size="lg"
            disabled={success}
          />
        </View>

        {/* Nota reenvio */}
        <View style={{ marginTop: 32, alignItems: 'center', gap: 6 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            No recibiste el codigo?
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            Vuelve atras e intenta registrarte de nuevo con el mismo email.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
