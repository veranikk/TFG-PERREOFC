/**
 * Renders the edit screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Info, AlertCircle, Mail } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRole } from '../../src/hooks/useRole';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { typography } from '../../src/theme/typography';
import { brand } from '../../src/theme/colors';
import { meApi } from '../../src/services/api/modules/me';

const editSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName:  z.string().min(1, 'Requerido'),
  username:  z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
});
type EditForm = z.infer<typeof editSchema>;

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const { isAficionado, role } = useRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { control, handleSubmit, setError, formState: { errors, isDirty } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName ?? '',
      username:  user?.username ?? '',
    },
  });

  const onSubmit = async (data: EditForm) => {
    if (!user) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const updated = await meApi.updateProfile(data);
      await login({ ...user, ...updated });
      router.back();
    } catch (err: any) {
      if (err?.status === 409) {
        setError('username', { message: 'Este nombre de usuario ya está en uso' });
      } else {
        setSaveError(err?.message ?? 'Error al guardar. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    jugador: 'jugador',
    admin: 'administrador',
    superadmin: 'administrador',
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
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Editar perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
        {!isAficionado && (
          <View style={{
            backgroundColor: `${brand.blue}14`, borderRadius: 12, padding: 16,
            borderWidth: 1, borderColor: `${brand.blue}33`, gap: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Info size={16} color={brand.blue} />
              <Text style={{ ...typography.body, color: brand.blue, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                Perfil gestionado por el administrador
              </Text>
            </View>
            <Text style={{ ...typography.body, color: brand.blue, fontSize: 13, lineHeight: 20 }}>
              Los datos de tu perfil como {roleLabels[role ?? ''] ?? 'usuario'} son gestionados por el administrador del club. Si necesitas cambiar algún dato, contacta con el administrador.
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input label="Nombre" value={value} onChangeText={onChange} error={errors.firstName?.message}
              editable={isAficionado} autoCapitalize="words" hint="Tu nombre real" />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input label="Apellido" value={value} onChangeText={onChange} error={errors.lastName?.message}
              editable={isAficionado} autoCapitalize="words" hint="Tu apellido real" />
          )}
        />
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <Input label="Nombre de usuario" value={value} onChangeText={onChange} error={errors.username?.message}
              editable={isAficionado} autoCapitalize="none" hint="Solo letras, números y _ (guión bajo), mínimo 3 caracteres" />
          )}
        />

        {/* Email */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>EMAIL</Text>
          <View style={{
            backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
            borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ ...typography.body, color: colors.textMuted }}>{user?.email}</Text>
          </View>
          {isAficionado ? (
            <TouchableOpacity
              onPress={() => router.push('/profile/email-change' as any)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2 }}
            >
              <Mail size={13} color={brand.orange} />
              <Text style={{ ...typography.caption, color: brand.orange, fontFamily: 'Inter_500Medium' }}>
                Cambiar correo
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>El email no se puede cambiar.</Text>
          )}
        </View>

        {isAficionado && (
          <>
            {saveError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF444418', borderRadius: 12, padding: 12 }}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={{ ...typography.body, color: '#EF4444', fontFamily: 'Inter_500Medium', flex: 1 }}>{saveError}</Text>
              </View>
            )}
            <Button
              label={isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              fullWidth
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
