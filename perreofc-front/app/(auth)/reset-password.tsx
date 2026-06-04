/**
 * Renders the reset password screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Logo } from '../../src/components/brand/Logo';
import { typography } from '../../src/theme/typography';
import { fetchClient } from '../../src/services/api/apiClient';

const schema = z
  .object({
    password: z.string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  const url = Linking.useURL();

  useEffect(() => {
    if (!url) return;
    // Supabase appends tokens in the hash: #access_token=xxx&type=recovery&...
    const hash = url.split('#')[1];
    if (!hash) {
      setTokenError(true);
      return;
    }
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    if (accessToken && type === 'recovery') {
      setToken(accessToken);
    } else {
      setTokenError(true);
    }
  }, [url]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setLoading(true);
    setServerError(null);
    try {
      await fetchClient<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ password: data.password }),
        headers: { Authorization: `Bearer ${token}` },
      });
      setDone(true);
    } catch (e: any) {
      setServerError(e?.data?.error ?? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
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
      >
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginBottom: 32 }}
        >
          <Text style={{ ...typography.body, color: colors.accent }}>← Volver al login</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40, gap: 16 }}>
          <Logo size="md" />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ ...typography.h1, color: colors.text }}>Nueva contraseña</Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
              Elige una contraseña segura para tu cuenta
            </Text>
          </View>
        </View>

        {tokenError && (
          <View
            style={{
              backgroundColor: '#EF444420',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EF4444',
              padding: 16,
              marginBottom: 16,
              gap: 8,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="#EF4444" />
              <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center', flex: 1 }}>
                Enlace inválido o expirado. Solicita un nuevo correo de recuperación.
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(auth)/forgot-password')}>
              <Text style={{ ...typography.button, color: colors.accent }}>Solicitar nuevo enlace</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <View
            style={{
              backgroundColor: '#22C55E20',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#22C55E',
              padding: 16,
              marginBottom: 16,
              gap: 12,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <CheckCircle size={18} color="#22C55E" />
              <Text style={{ ...typography.body, color: '#22C55E', textAlign: 'center', flex: 1 }}>
                Contraseña actualizada correctamente.
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ ...typography.button, color: colors.accent }}>Ir al login</Text>
            </TouchableOpacity>
          </View>
        )}

        {serverError && (
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
              {serverError}
            </Text>
          </View>
        )}

        {!tokenError && !done && (
          <View style={{ gap: 20 }}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="new-password"
                  error={errors.password?.message}
                  hint="Mínimo 8 caracteres: mayúscula, minúscula, número y carácter especial (!@#$%^&*)"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  hint="Debe coincidir exactamente con la contraseña anterior"
                />
              )}
            />

            <Button
              label={loading ? 'Guardando...' : 'Cambiar contraseña'}
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              fullWidth
              size="lg"
              disabled={!token || loading}
            />

            {!token && !tokenError && (
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
                Cargando enlace...
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
