/**
 * Renders the email change screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, AlertCircle, Mail, Lock } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { typography } from '../../src/theme/typography';
import { brand, state } from '../../src/theme/colors';
import { usersApi } from '../../src/services/api/modules/users';
import { ApiError } from '../../src/services/api/apiClient';

// ── Schemas ───────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  newEmail: z.string().email({ message: 'Introduce un correo válido' }),
  currentPassword: z.string().min(1, 'Introduce tu contraseña actual'),
});

const step2Schema = z.object({
  pin: z.string().length(8, 'El código debe tener 8 dígitos').regex(/^\d{8}$/, 'Solo números'),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EmailChangeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [step, setStep] = useState<1 | 2>(1);
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ message: string; nextAllowedAt?: string } | null>(null);
  const [changesUsed, setChangesUsed] = useState(0);
  const [changesMax, setChangesMax] = useState(3);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  const step2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { pin: '' },
  });

  // Comprobar rate limit al cargar
  useEffect(() => {
    usersApi.emailChangeStatus()
      .then((status) => {
        if (!status.canChange) {
          setBlocked({ message: status.message ?? 'No puedes cambiar el correo ahora.', nextAllowedAt: status.nextAllowedAt });
        } else {
          setChangesUsed(status.changesUsed ?? 0);
          setChangesMax(status.changesMax ?? 3);
        }
      })
      .catch(() => { /* silenciar — no bloquear la pantalla si falla el status */ })
      .finally(() => setStatusLoading(false));
  }, []);

  // Paso 1: verificar contraseña y solicitar PIN al nuevo correo
  const onStep1 = async (data: Step1Form) => {
    setApiError(null);
    setLoading(true);
    try {
      await usersApi.requestEmailChange(data.newEmail, data.currentPassword);
      setPendingEmail(data.newEmail);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setApiError('Ese correo ya está en uso por otra cuenta.');
        else if (err.status === 403) setApiError(err.message || 'Has alcanzado el límite de cambios de correo por hoy.');
        else if (err.status === 400) setApiError(err.message || 'Contraseña incorrecta o correo no válido.');
        else setApiError('Error al procesar la solicitud.');
      } else {
        setApiError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: confirmar PIN del nuevo correo y aplicar el cambio
  const onStep2 = async (data: Step2Form) => {
    setApiError(null);
    setLoading(true);
    try {
      const result = await usersApi.confirmEmailChange(data.pin);
      updateUser({ email: result.newEmail });
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setApiError('Código incorrecto o expirado. Comprueba el email o solicita uno nuevo.');
      } else {
        setApiError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: Record<1 | 2, string> = {
    1: 'Cambiar correo',
    2: 'Confirmar nuevo correo',
  };

  // ── Loading inicial ──────────────────────────────────────────────────────────
  if (statusLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: insets.top + 12, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ ...typography.h3, color: colors.text, marginLeft: 8 }}>Cambiar correo</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={brand.orange} />
        </View>
      </View>
    );
  }

  // ── Bloqueado por rate limit ─────────────────────────────────────────────────
  if (blocked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: insets.top + 12, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ ...typography.h3, color: colors.text, marginLeft: 8 }}>Cambiar correo</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: `${state.error}18`, borderRadius: 16, padding: 24, alignItems: 'center', gap: 12 }}>
            <Lock size={36} color={state.error} />
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>Límite alcanzado</Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              {blocked.message}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Flujo principal ──────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => {
            setApiError(null);
            if (step === 2) setStep(1);
            else router.back();
          }}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>
          {stepTitles[step]}
        </Text>
        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 4, marginRight: 4 }}>
          {([1, 2] as const).map((s) => (
            <View
              key={s}
              style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: step >= s ? brand.orange : colors.border }}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>

        {/* ── Paso 1: nuevo correo + contraseña ── */}
        {step === 1 && (
          <>
            <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
              Introduce tu nuevo correo y confirma tu contraseña actual. Te enviaremos un código de verificación al nuevo correo.
            </Text>

            {/* Intentos restantes */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
            }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Cambios de correo disponibles hoy</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {Array.from({ length: changesMax }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: i < (changesMax - changesUsed) ? brand.orange : colors.border,
                    }}
                  />
                ))}
              </View>
            </View>

            <Controller
              control={step1.control}
              name="newEmail"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nuevo correo"
                  value={value}
                  onChangeText={(v) => { onChange(v); setApiError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={step1.formState.errors.newEmail?.message}
                  hint="Este será tu nuevo correo de acceso"
                />
              )}
            />

            <Controller
              control={step1.control}
              name="currentPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contraseña actual"
                  value={value}
                  onChangeText={(v) => { onChange(v); setApiError(null); }}
                  secureTextEntry
                  error={step1.formState.errors.currentPassword?.message}
                  hint="Confirma que eres tú"
                />
              )}
            />

            {apiError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${state.error}18`, borderRadius: 12, padding: 12 }}>
                <AlertCircle size={16} color={state.error} />
                <Text style={{ ...typography.body, color: state.error, flex: 1 }}>{apiError}</Text>
              </View>
            )}

            <Button
              label="Enviar código"
              fullWidth
              onPress={step1.handleSubmit(onStep1)}
              loading={loading}
            />
          </>
        )}

        {/* ── Paso 2: PIN del nuevo correo ── */}
        {step === 2 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.orange}12`, borderRadius: 12, padding: 14 }}>
              <Mail size={16} color={brand.orange} />
              <Text style={{ ...typography.caption, color: brand.orange, flex: 1, lineHeight: 18 }}>
                Hemos enviado un código de 8 dígitos a{' '}
                <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{pendingEmail}</Text>.
                Introdúcelo para confirmar el cambio.
              </Text>
            </View>

            <Controller
              control={step2.control}
              name="pin"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Código de verificación"
                  value={value}
                  onChangeText={(v) => { onChange(v.replace(/\D/g, '').slice(0, 8)); setApiError(null); }}
                  keyboardType="number-pad"
                  maxLength={8}
                  error={step2.formState.errors.pin?.message}
                  hint={`Código de 8 dígitos enviado a ${pendingEmail}`}
                />
              )}
            />

            {apiError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${state.error}18`, borderRadius: 12, padding: 12 }}>
                <AlertCircle size={16} color={state.error} />
                <Text style={{ ...typography.body, color: state.error, flex: 1 }}>{apiError}</Text>
              </View>
            )}

            <Button
              label="Confirmar cambio de correo"
              fullWidth
              onPress={step2.handleSubmit(onStep2)}
              loading={loading}
            />

            <TouchableOpacity
              onPress={() => { setStep(1); setApiError(null); step2.reset(); }}
              activeOpacity={0.7}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                ¿No recibiste el código? Volver atrás para solicitarlo de nuevo
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
