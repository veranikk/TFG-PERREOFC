/**
 * Renders the register screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FileText, Check } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Logo } from '../../src/components/brand/Logo';
import { typography } from '../../src/theme/typography';
import { t } from '../../src/i18n';

const schema = z.object({
  username: z
    .string()
    .min(3, t('validation.usernameMin'))
    .regex(/^[a-zA-Z0-9_]+$/, t('validation.usernameInvalid')),
  firstName: z.string().min(1, t('validation.required')),
  lastName: z.string().min(1, t('validation.required')),
  email: z.string().min(1, t('validation.required')).email(t('validation.emailInvalid')),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
  confirmPassword: z.string().min(1, t('validation.required')),
  acceptTerms: z.boolean().refine((v) => v === true, t('validation.acceptTermsRequired')),
}).refine((d) => d.password === d.confirmPassword, {
  message: t('validation.passwordMatch'),
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [termsVisible, setTermsVisible] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);

  const onTermsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) setHasScrolledTerms(true);
  };

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await api.register({
        email: data.email,
        password: data.password,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      // Guardar puntos de bienvenida para mostrar modal tras primer login
      await AsyncStorage.setItem(
        '@perreofc:pendingWelcomePoints',
        String(res.pointsAwarded ?? 100)
      );
      router.replace({ pathname: '/(auth)/verify-email', params: { email: data.email } });
    } catch (e: any) {
      setServerError(e?.data?.error ?? e?.message ?? 'Error al registrarse. Inténtalo de nuevo.');
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
          <Text style={{ ...typography.body, color: colors.accent }}>← {t('common.back')}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32, gap: 12 }}>
          <Logo size="md" />
          <Text style={{ ...typography.h1, color: colors.text }}>{t('auth.createAccount')}</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
            {t('auth.createAccountSubtitle')}
          </Text>
        </View>

        {/* Banner de error */}
        {serverError && (
          <View
            style={{
              backgroundColor: '#EF444420',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EF4444',
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center' }}>
              {serverError}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={{ gap: 14 }}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.username')}
                placeholder={t('auth.usernamePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                error={errors.username?.message}
                hint="Solo letras, números y _ (guión bajo), mínimo 3 caracteres"
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.firstName')}
                    placeholder={t('auth.firstNamePlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    error={errors.firstName?.message}
                    hint="Tu nombre real"
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.lastName')}
                    placeholder={t('auth.lastNamePlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    error={errors.lastName?.message}
                    hint="Tu apellido real"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
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
                error={errors.email?.message}
                hint="Deberás verificarlo por correo antes de poder entrar"
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
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
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
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.confirmPassword?.message}
                hint="Debe coincidir exactamente con la contraseña anterior"
              />
            )}
          />

          {/* Términos y condiciones */}
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field: { onChange, value } }) => (
              <View style={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (value) {
                      onChange(false);
                    } else {
                      setHasScrolledTerms(false);
                      setTermsVisible(true);
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: value ? colors.accent : errors.acceptTerms ? '#EF4444' : colors.border,
                    backgroundColor: value ? `${colors.accent}15` : colors.surface ?? colors.bg,
                  }}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                    borderColor: value ? colors.accent : colors.border,
                    backgroundColor: value ? colors.accent : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {value && <Check size={13} color="#fff" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={{ ...typography.body, color: colors.text }}>
                      {t('auth.acceptTerms')}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.accent }}>
                      Pulsa para leer y aceptar →
                    </Text>
                  </View>
                  <FileText size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {errors.acceptTerms && (
                  <Text style={{ ...typography.caption, color: '#EF4444', marginLeft: 2 }}>
                    {errors.acceptTerms.message}
                  </Text>
                )}

                {/* Modal de términos */}
                <Modal
                  visible={termsVisible}
                  animationType="slide"
                  presentationStyle="pageSheet"
                  onRequestClose={() => setTermsVisible(false)}
                >
                  <View style={{ flex: 1, backgroundColor: colors.bg }}>
                    {/* Header modal */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, paddingTop: 20,
                      borderBottomWidth: 1, borderBottomColor: colors.border,
                    }}>
                      <Text style={{ ...typography.h3, color: colors.text }}>Términos y condiciones</Text>
                      <TouchableOpacity onPress={() => setTermsVisible(false)}>
                        <Text style={{ ...typography.body, color: colors.textMuted }}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Contenido */}
                    <ScrollView
                      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }}
                      onScroll={onTermsScroll}
                      scrollEventThrottle={100}
                    >
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>Última actualización: abril de 2026</Text>
                      {[
                        { title: '1. Aceptación de los términos', body: 'Al utilizar la aplicación móvil de Perreo FC, aceptas los presentes términos y condiciones de uso. Si no estás de acuerdo con alguno de ellos, deberás dejar de utilizar la aplicación.' },
                        { title: '2. Uso de la aplicación', body: 'Esta aplicación es de uso exclusivo para socios y aficionados del club Perreo FC. Queda prohibido su uso con fines comerciales, fraudulentos o que atenten contra los valores del club.' },
                        { title: '3. Privacidad y datos personales', body: 'Los datos personales recogidos (nombre, email, contraseña) son utilizados únicamente para gestionar tu cuenta dentro de la aplicación. No se ceden a terceros. Puedes solicitar la eliminación de tus datos en cualquier momento contactando con el club.' },
                        { title: '4. Sistema de puntos', body: 'Los puntos (🍑) son una moneda virtual sin valor económico real. No son canjeables por dinero ni transferibles entre usuarios. El club se reserva el derecho a modificar el sistema de puntos en cualquier momento.' },
                        { title: '5. Contenido generado por el usuario', body: 'El usuario se compromete a no publicar contenido ofensivo, falso o que vulnere derechos de terceros. El club podrá eliminar cualquier contenido sin previo aviso y suspender cuentas que incumplan estas normas.' },
                        { title: '6. Limitación de responsabilidad', body: 'Perreo FC no se hace responsable de los daños derivados del uso o la imposibilidad de uso de la aplicación, incluyendo errores en los datos de partidos, clasificaciones o estadísticas.' },
                        { title: '7. Modificaciones', body: 'El club se reserva el derecho a modificar estos términos en cualquier momento. Las modificaciones serán notificadas a través de la propia aplicación y entrarán en vigor en el momento de su publicación.' },
                        { title: '8. Contacto', body: 'Para cualquier consulta sobre estos términos, puedes contactar con el club en info@perreofc.com o a través de la aplicación.' },
                      ].map((s) => (
                        <View key={s.title} style={{ gap: 6 }}>
                          <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold' }}>{s.title}</Text>
                          <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 24 }}>{s.body}</Text>
                        </View>
                      ))}
                    </ScrollView>

                    {/* Footer con botón */}
                    <View style={{ padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 }}>
                      {!hasScrolledTerms && (
                        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                          Desplázate hasta el final para aceptar
                        </Text>
                      )}
                      <Button
                        label="He leído y acepto los términos"
                        disabled={!hasScrolledTerms}
                        onPress={() => {
                          onChange(true);
                          setTermsVisible(false);
                        }}
                        fullWidth
                      />
                    </View>
                  </View>
                </Modal>
              </View>
            )}
          />

          <Button
            label={loading ? 'Registrando...' : t('auth.registerButton')}
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            fullWidth
            size="lg"
            style={{ marginTop: 4 }}
          />
        </View>

        {/* Login */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            {t('auth.alreadyHaveAccount')}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={{ ...typography.body, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
              {t('auth.loginLink')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
