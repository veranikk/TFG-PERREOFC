/**
 * Renders the password screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, AlertCircle, Clock, ShieldAlert, CheckCircle } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { typography } from '../../src/theme/typography';
import { brand, state } from '../../src/theme/colors';
import { meApi } from '../../src/services/api/modules/me';
import { ApiError } from '../../src/services/api/apiClient';
import { useAuthStore } from '../../src/store/useAuthStore';

// ── Schemas ───────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  current: z.string().min(1, 'Introduce tu contraseña actual'),
});

const step2Schema = z.object({
  next: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
  confirm: z.string().min(1, 'Confirma la contraseña'),
}).refine((d) => d.next === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

// ── Rate-limit modal ──────────────────────────────────────────────────────────
function RateLimitModal({ visible, message, onClose }: { visible: boolean; message: string; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${state.error}18`, alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={26} color={state.error} />
            </View>
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>Límite alcanzado</Text>
          </View>
          <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22, textAlign: 'center' }}>
            {message}
          </Text>
          <View style={{ backgroundColor: `${brand.orange}12`, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <ShieldAlert size={15} color={brand.orange} style={{ marginTop: 2 }} />
            <Text style={{ ...typography.caption, color: brand.orange, flex: 1, lineHeight: 18 }}>
              Este límite existe para proteger tu cuenta de accesos no autorizados.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 13, borderRadius: 12, backgroundColor: brand.orange, alignItems: 'center' }}
            activeOpacity={0.75}
          >
            <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PasswordScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

  // Rate limit
  const [canChange, setCanChange] = useState(true);
  const [changesLeft, setChangesLeft] = useState<{ used: number; max: number } | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [rateLimitModalVisible, setRateLimitModalVisible] = useState(false);

  // Step control
  const [step, setStep] = useState<1 | 2>(1);
  const [verifiedPassword, setVerifiedPassword] = useState('');

  // Step 1
  const [verifying, setVerifying] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  // Step 2
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { current: '' },
  });

  const step2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { next: '', confirm: '' },
  });

  useEffect(() => {
    meApi.getChangePasswordStatus().then((status) => {
      if (!status.canChange) {
        setCanChange(false);
        setRateLimitMessage(status.message);
        setRateLimitModalVisible(true);
      } else {
        setChangesLeft({ used: status.changesUsed, max: status.changesMax });
      }
    }).catch(() => {});
  }, []);

  // Paso 1: verificar contraseña actual
  const onVerify = async (data: Step1Form) => {
    setCurrentPasswordError(null);
    setVerifying(true);
    try {
      const result = await meApi.verifyCurrentPassword(data.current);
      if (!result.valid) {
        setCurrentPasswordError('La contraseña actual es incorrecta');
        return;
      }
      setVerifiedPassword(data.current);
      setStep(2);
    } catch (err) {
      setCurrentPasswordError('Error de conexión. Inténtalo de nuevo');
    } finally {
      setVerifying(false);
    }
  };

  // Paso 2: cambiar contraseña
  const onSubmit = async (data: Step2Form) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await meApi.changePassword({
        currentPassword: verifiedPassword,
        newPassword: data.next,
        confirmPassword: data.confirm,
      });
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setCanChange(false);
          setRateLimitMessage(err.message);
          setRateLimitModalVisible(true);
        } else {
          setApiError(err.message || 'Error al cambiar la contraseña');
        }
      } else {
        setApiError('Error de conexión. Inténtalo de nuevo');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          onPress={() => step === 2 ? setStep(1) : router.back()}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>
          {step === 1 ? 'Verificar identidad' : 'Nueva contraseña'}
        </Text>
        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 4, marginRight: 4 }}>
          <View style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: brand.orange }} />
          <View style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: step === 2 ? brand.orange : colors.border }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>

        {/* Rate limit banner */}
        {canChange && changesLeft !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.orange}12`, borderRadius: 12, padding: 12 }}>
            <ShieldAlert size={15} color={brand.orange} />
            <Text style={{ ...typography.caption, color: brand.orange, flex: 1, lineHeight: 18 }}>
              {changesLeft.max - changesLeft.used === 1
                ? 'Solo te queda 1 cambio de contraseña disponible hoy.'
                : `Te quedan ${changesLeft.max - changesLeft.used} de ${changesLeft.max} cambios disponibles hoy.`}
            </Text>
          </View>
        )}

        {!canChange && rateLimitMessage && (
          <TouchableOpacity
            onPress={() => setRateLimitModalVisible(true)}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${state.error}18`, borderRadius: 12, padding: 12 }}
          >
            <Clock size={16} color={state.error} />
            <Text style={{ ...typography.body, color: state.error, flex: 1 }}>{rateLimitMessage}</Text>
          </TouchableOpacity>
        )}

        {/* ── Paso 1: contraseña actual ── */}
        {step === 1 && (
          <>
            <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
              Primero confirma tu contraseña actual para continuar.
            </Text>

            <Controller
              control={step1.control}
              name="current"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contraseña actual"
                  value={value}
                  onChangeText={(v) => { onChange(v); setCurrentPasswordError(null); }}
                  secureTextEntry
                  error={step1.formState.errors.current?.message ?? currentPasswordError ?? undefined}
                  editable={canChange}
                  hint="Introduce la contraseña con la que accedes actualmente"
                />
              )}
            />

            <Button
              label="Verificar contraseña"
              fullWidth
              onPress={step1.handleSubmit(onVerify)}
              loading={verifying}
              disabled={!canChange}
            />
          </>
        )}

        {/* ── Paso 2: nueva contraseña ── */}
        {step === 2 && (
          <>
            {/* Confirmación del paso 1 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${brand.green}18`, borderRadius: 12, padding: 12 }}>
              <CheckCircle size={16} color={brand.green} />
              <Text style={{ ...typography.caption, color: brand.green, flex: 1 }}>Identidad verificada. Ahora elige tu nueva contraseña.</Text>
            </View>

            <Controller
              control={step2.control}
              name="next"
              render={({ field: { onChange, value } }) => (
                <Input label="Nueva contraseña" value={value} onChangeText={onChange}
                  secureTextEntry error={step2.formState.errors.next?.message}
                  hint="Mínimo 8 caracteres: mayúscula, minúscula, número y carácter especial (!@#$%^&*)" />
              )}
            />
            <Controller
              control={step2.control}
              name="confirm"
              render={({ field: { onChange, value } }) => (
                <Input label="Confirmar nueva contraseña" value={value} onChangeText={onChange}
                  secureTextEntry error={step2.formState.errors.confirm?.message}
                  hint="Debe coincidir exactamente con la nueva contraseña" />
              )}
            />

            {apiError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${state.error}18`, borderRadius: 12, padding: 12 }}>
                <AlertCircle size={16} color={state.error} />
                <Text style={{ ...typography.body, color: state.error, flex: 1 }}>{apiError}</Text>
              </View>
            )}

            <Button
              label="Cambiar contraseña"
              fullWidth
              onPress={step2.handleSubmit(onSubmit)}
              loading={submitting}
            />
          </>
        )}
      </ScrollView>

      <RateLimitModal
        visible={rateLimitModalVisible}
        message={rateLimitMessage ?? ''}
        onClose={() => setRateLimitModalVisible(false)}
      />
    </View>
  );
}
