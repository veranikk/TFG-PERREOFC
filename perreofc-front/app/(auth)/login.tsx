/**
 * Renders the login screen in the mobile app.
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
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Sun, Moon, Mail, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Logo } from '../../src/components/brand/Logo';
import { Switch } from '../../src/components/ui/Switch';
import { typography } from '../../src/theme/typography';
import { rs } from '../../src/theme/responsive';
import { t } from '../../src/i18n';

const schema = z.object({
  email: z.string().min(1, t('validation.required')).email(t('validation.emailInvalid')),
  password: z.string().min(1, t('validation.required')),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { login } = useAuthStore();
  const { emailSent } = useLocalSearchParams<{ emailSent?: string }>();
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailModalVisible, setEmailModalVisible] = useState(emailSent === '1');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const user = await api.login(data.email, data.password, rememberMe);
      if (!user) {
        setServerError(t('auth.loginError'));
        return;
      }
      await login(user, rememberMe);
      router.replace('/(main)/calendario');
    } catch (e: any) {
      const msg: string = e?.data?.error ?? e?.message ?? '';
      if (e?.status === 403 || msg.toLowerCase().includes('suspendida') || msg.toLowerCase().includes('banned')) {
        setServerError(msg || 'Tu cuenta ha sido suspendida. Para más información contacta con info@perreofc.com');
      } else {
        setServerError(t('auth.loginError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal
      visible={emailModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEmailModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}>
        <View style={{
          backgroundColor: colors.bg,
          borderRadius: 20,
          padding: 28,
          width: '100%',
          alignItems: 'center',
          gap: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#22C55E20',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={30} color="#22C55E" />
          </View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>
              Revisa tu correo
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              Te hemos enviado un enlace de confirmación. Confirma tu cuenta antes de iniciar sesión.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setEmailModalVisible(false)}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
              width: '100%',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ ...typography.button, color: '#fff' }}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: rs(24), paddingTop: rs(60) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={toggle}
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: 9999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isDark ? <Sun size={14} color={colors.textMuted} /> : <Moon size={14} color={colors.textMuted} />}
              <Text style={{ ...typography.label, color: colors.textMuted }}>
                {isDark ? 'Claro' : 'Oscuro'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: rs(32), gap: rs(12) }}>
          <Logo size="lg" />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ ...typography.h1, color: colors.text, textAlign: 'center' }}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
              {t('auth.welcomeSubtitle')}
            </Text>
          </View>
        </View>

        {/* Error de servidor (credenciales incorrectas) */}
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

        {/* Form */}
        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                value={value}
                onChangeText={(v) => { onChange(v); setServerError(null); }}
                onBlur={onBlur}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                error={errors.email?.message}
                hint="Introduce el correo con el que te registraste"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={value}
                onChangeText={(v) => { onChange(v); setServerError(null); }}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="current-password"
                error={errors.password?.message}
                hint="Distingue entre mayúsculas y minúsculas"
              />
            )}
          />

          {/* Recuérdame + olvidé contraseña */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Switch value={rememberMe} onValueChange={setRememberMe} />
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                {t('auth.rememberMe')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ flexShrink: 1 }}
            >
              <Text
                style={{ ...typography.body, color: colors.accent }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            label={loading ? t('auth.loginLoading') : t('auth.login')}
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            fullWidth
            size="lg"
          />
        </View>

        {/* Registro */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: rs(24), gap: 4 }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            {t('auth.noAccount')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={{ ...typography.body, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}
