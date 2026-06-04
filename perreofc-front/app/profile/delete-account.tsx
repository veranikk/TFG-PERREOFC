/**
 * Renders the delete account screen in the mobile app.
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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';

import { useTheme } from '../../src/hooks/useTheme';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/useAuthStore';
import { typography } from '../../src/theme/typography';

type Step = 'warning' | 'pin' | 'sending' | 'done';

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [step, setStep] = useState<Step>('warning');
  const [pin, setPin] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enviar el PIN al email cuando el usuario pasa al paso de confirmación
  const handleRequestPin = async () => {
    setRequesting(true);
    setError(null);
    try {
      await api.requestDeleteAccount();
      setStep('pin');
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirm = async () => {
    if (pin.length !== 8) {
      setError('El código debe tener 8 dígitos.');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      await api.confirmDeleteAccount(pin);
      setStep('done');
      // Esperar un momento para mostrar el mensaje de éxito y luego hacer logout
      setTimeout(async () => {
        await logout();
        router.replace('/(auth)/login');
      }, 2000);
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Código incorrecto o expirado. Inténtalo de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

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
        {/* Volver */}
        {step !== 'done' && (
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <Text style={{ ...typography.body, color: colors.accent }}>← Volver</Text>
          </TouchableOpacity>
        )}

        {/* ── Paso 1: Advertencia ── */}
        {step === 'warning' && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 32, gap: 16 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: '#EF444420',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={36} color="#EF4444" />
              </View>
              <Text style={{ ...typography.h1, color: colors.text, textAlign: 'center' }}>
                Eliminar cuenta
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
                Esta acción es <Text style={{ color: '#EF4444', fontFamily: 'Inter_700Bold' }}>permanente e irreversible</Text>.
                Se eliminarán todos tus datos, puntos y apuestas.
              </Text>
            </View>

            {/* Datos que se perderán */}
            <View style={{
              backgroundColor: '#EF444410',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EF444430',
              padding: 16,
              marginBottom: 32,
              gap: 8,
            }}>
              {[
                'Tu perfil y datos personales',
                `${user.points.toLocaleString('es-ES')} puntos acumulados`,
                'Historial de apuestas',
                'Acceso a la app',
              ].map((item) => (
                <Text key={item} style={{ ...typography.body, color: '#EF4444' }}>
                  • {item}
                </Text>
              ))}
            </View>

            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
              Recibirás un código de confirmación en{'\n'}
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                {user.email}
              </Text>
            </Text>

            {error && (
              <View style={{
                backgroundColor: '#EF444420',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#EF4444',
                padding: 12,
                marginBottom: 16,
              }}>
                <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <Button
              label={requesting ? 'Enviando código...' : 'Continuar con la eliminación'}
              loading={requesting}
              onPress={handleRequestPin}
              fullWidth
              size="lg"
              variant="destructive"
            />
          </>
        )}

        {/* ── Paso 2: Introducir PIN ── */}
        {step === 'pin' && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 32, gap: 16 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: '#EF444420',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={36} color="#EF4444" />
              </View>
              <Text style={{ ...typography.h1, color: colors.text, textAlign: 'center' }}>
                Confirma con el código
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
                Te hemos enviado un código de 8 dígitos a{'\n'}
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                  {user.email}
                </Text>
              </Text>
            </View>

            {error && (
              <View style={{
                backgroundColor: '#EF444420',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#EF4444',
                padding: 12,
                marginBottom: 16,
              }}>
                <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <View style={{ gap: 20 }}>
              <Input
                label="Código de confirmación"
                placeholder="12345678"
                value={pin}
                onChangeText={(text) => {
                  setPin(text.replace(/[^0-9]/g, '').slice(0, 8));
                  if (error) setError(null);
                }}
                keyboardType="number-pad"
                maxLength={8}
                style={{ textAlign: 'center', fontSize: 32, letterSpacing: 10, fontFamily: 'Inter_700Bold' }}
              />

              <Button
                label={confirming ? 'Eliminando cuenta...' : 'Eliminar mi cuenta definitivamente'}
                loading={confirming}
                onPress={handleConfirm}
                fullWidth
                size="lg"
                variant="destructive"
              />
            </View>

            <View style={{ marginTop: 24, alignItems: 'center', gap: 4 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                El código expira en 15 minutos.
              </Text>
              <TouchableOpacity onPress={() => { setError(null); handleRequestPin(); }}>
                <Text style={{ ...typography.caption, color: colors.accent }}>
                  Reenviar código
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Paso 3: Éxito ── */}
        {step === 'done' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 60 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: '#22C55E20',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={40} color="#22C55E" />
            </View>
            <Text style={{ ...typography.h2, color: colors.text, textAlign: 'center' }}>
              Cuenta eliminada
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              Tu cuenta ha sido eliminada correctamente. Redirigiendo...
            </Text>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
