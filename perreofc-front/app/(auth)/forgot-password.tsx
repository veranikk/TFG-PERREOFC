/**
 * Renders the forgot password screen in the mobile app.
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
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Logo } from '../../src/components/brand/Logo';
import { typography } from '../../src/theme/typography';
import { t } from '../../src/i18n';

// ── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  email: z.string().min(1, t('validation.required')).email(t('validation.emailInvalid')),
});

const step2Schema = z.object({
  otp: z
    .string()
    .length(8, 'El codigo debe tener exactamente 8 digitos')
    .regex(/^[0-9]+$/, 'El codigo solo puede contener numeros'),
});

const step3Schema = z
  .object({
    password: z.string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
    confirmPassword: z.string().min(1, t('validation.required')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: t('validation.passwordMatch'),
    path: ['confirmPassword'],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // ── Step 1 form ──────────────────────────────────────────────────────────

  const {
    control: control1,
    handleSubmit: handleSubmit1,
    formState: { errors: errors1, isSubmitting: isSubmitting1 },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '' },
  });

  const onSubmitStep1 = async (data: Step1Data) => {
    setServerError(null);
    try {
      await api.forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
    } catch (e: any) {
      setServerError(e?.data?.error ?? 'No se pudo enviar el correo. Inténtalo más tarde.');
    }
  };

  // ── Step 2 form ──────────────────────────────────────────────────────────

  const {
    control: control2,
    handleSubmit: handleSubmit2,
    formState: { errors: errors2, isSubmitting: isSubmitting2 },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { otp: '' },
  });

  const onSubmitStep2 = async (data: Step2Data) => {
    setServerError(null);
    try {
      const result = await api.verifyOtp(email, data.otp, 'recovery');
      setAccessToken(result.session.access_token);
      setStep(3);
    } catch (e: any) {
      setServerError(e?.data?.error ?? 'Código incorrecto o expirado. Inténtalo de nuevo.');
    }
  };

  // ── Step 3 form ──────────────────────────────────────────────────────────

  const {
    control: control3,
    handleSubmit: handleSubmit3,
    formState: { errors: errors3, isSubmitting: isSubmitting3 },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmitStep3 = async (data: Step3Data) => {
    setServerError(null);
    try {
      await api.resetPassword(data.password, accessToken);
      setDone(true);
    } catch (e: any) {
      setServerError(e?.data?.error ?? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    }
  };

  // ── Subtitulo segun paso ──────────────────────────────────────────────────

  const subtitle = () => {
    if (step === 1) return 'Introduce tu email y te enviaremos un código de verificación';
    if (step === 2)
      return `Introduce el código de 8 dígitos que enviamos a\n${email}`;
    return 'Crea tu nueva contraseña';
  };

  const title = () => {
    if (step === 1) return 'Recuperar contraseña';
    if (step === 2) return 'Introduce el código';
    return 'Nueva contraseña';
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
          <Text style={{ ...typography.body, color: colors.accent }}>← {t('common.back')}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 40, gap: 16 }}>
          <Logo size="md" />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ ...typography.h1, color: colors.text }}>{title()}</Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
              {subtitle()}
            </Text>
          </View>
        </View>

        {/* Banner exito (paso 3 completado) */}
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

        {/* Banner de error */}
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

        {/* ── STEP 1: Email ───────────────────────────────────────────────── */}
        {step === 1 && (
          <View style={{ gap: 20 }}>
            <Controller
              control={control1}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  error={errors1.email?.message}
                  hint="Introduce el correo con el que te registraste"
                />
              )}
            />

            <Button
              label={isSubmitting1 ? 'Enviando...' : 'Enviar código'}
              loading={isSubmitting1}
              onPress={handleSubmit1(onSubmitStep1)}
              fullWidth
              size="lg"
            />
          </View>
        )}

        {/* ── STEP 2: Codigo de verificacion ──────────────────────────────── */}
        {step === 2 && !done && (
          <View style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={() => { setStep(1); setServerError(null); }}
              style={{ marginBottom: 4 }}
            >
              <Text style={{ ...typography.body, color: colors.accent }}>
                ← Cambiar email
              </Text>
            </TouchableOpacity>

            <Controller
              control={control2}
              name="otp"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Código de verificación"
                  placeholder="12345678"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text.replace(/[^0-9]/g, '').slice(0, 8));
                    if (serverError) setServerError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={8}
                  inputStyle={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, fontFamily: 'Inter_700Bold' }}
                  error={errors2.otp?.message}
                  hint="Código de 8 dígitos enviado a tu correo"
                />
              )}
            />

            <Button
              label={isSubmitting2 ? 'Verificando...' : 'Verificar código'}
              loading={isSubmitting2}
              onPress={handleSubmit2(onSubmitStep2)}
              fullWidth
              size="lg"
            />
          </View>
        )}

        {/* ── STEP 3: Nueva contrasena ────────────────────────────────────── */}
        {step === 3 && !done && (
          <View style={{ gap: 16 }}>
            <Controller
              control={control3}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nueva contraseña"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  error={errors3.password?.message}
                  hint="Mínimo 8 caracteres: mayúscula, minúscula, número y carácter especial (!@#$%^&*)"
                />
              )}
            />

            <Controller
              control={control3}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar contraseña"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  error={errors3.confirmPassword?.message}
                  hint="Debe coincidir con la nueva contraseña"
                />
              )}
            />

            <Button
              label={isSubmitting3 ? 'Cambiando...' : 'Cambiar contraseña'}
              loading={isSubmitting3}
              onPress={handleSubmit3(onSubmitStep3)}
              fullWidth
              size="lg"
              style={{ marginTop: 4 }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}