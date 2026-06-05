/**
 * Feature UI component used by the mobile app: role switcher.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

// RoleSwitcher — solo visible en __DEV__
// Permite cambiar entre los 4 usuarios mock sin hacer logout
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { typography } from '../../theme/typography';

// Contraseña de las cuentas dev — definir EXPO_DEV_PASSWORD en el .env local (no hacer commit).
// Las cuentas deben tener contraseñas distintas de producción.
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD ?? '';

const DEV_ACCOUNTS = [
  { email: 'aficionado@perreofc.com',   password: DEV_PASSWORD, role: 'aficionado', label: 'Aficionado' },
  { email: 'daniel.ocana@perreofc.com', password: DEV_PASSWORD, role: 'jugador',    label: 'Jugador' },
  { email: 'admin@perreofc.com',        password: DEV_PASSWORD, role: 'admin',      label: 'Admin' },
  { email: 'superadmin@perreofc.com',   password: DEV_PASSWORD, role: 'superadmin', label: 'Superadmin' },
];

const ROLE_COLORS: Record<string, string> = {
  aficionado: '#75A8E0',
  jugador:    '#3AAA35',
  admin:      '#F59E0B',
  superadmin: '#EF4444',
};

export function RoleSwitcher() {
  const { colors } = useTheme();
  const { user, login } = useAuthStore();
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  if (!__DEV__) return null;

  const handleSwitch = async (account: typeof DEV_ACCOUNTS[number]) => {
    setLoadingEmail(account.email);
    try {
      const u = await api.login(account.email, account.password);
      if (u) {
        await login(u);
        setOpen(false);
        // Resetear el historial de navegación completo para que no queden
        // pantallas del usuario anterior en el stack (ej: detalle de noticia)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: '(main)' }],
          })
        );
      }
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <>
      {/* FAB flotante */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: 90,
          left: 16,
          backgroundColor: '#1A1A2E',
          borderRadius: 9999,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1.5,
          borderColor: user ? ROLE_COLORS[user.role] : '#9F9CA5',
          zIndex: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: user ? ROLE_COLORS[user.role] : '#9F9CA5',
          }}
        />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#FDFFFF' }}>
          DEV
        </Text>
      </TouchableOpacity>

      {/* Modal de selección */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 8,
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <Text style={{ ...typography.h3, color: colors.text, marginBottom: 4 }}>
              DEV — Cambiar usuario
            </Text>
            {DEV_ACCOUNTS.map((account) => {
              const isActive = user?.email === account.email;
              const isLoading = loadingEmail === account.email;
              return (
                <TouchableOpacity
                  key={account.email}
                  onPress={() => handleSwitch(account)}
                  disabled={loadingEmail !== null}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: isActive ? `${ROLE_COLORS[account.role]}22` : colors.cardAlt,
                    borderWidth: isActive ? 1.5 : 0,
                    borderColor: ROLE_COLORS[account.role],
                    opacity: loadingEmail !== null && !isLoading ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: ROLE_COLORS[account.role],
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                      {account.label}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {account.email}
                    </Text>
                  </View>
                  {isLoading && <ActivityIndicator size="small" color={ROLE_COLORS[account.role]} />}
                  {isActive && !isLoading && (
                    <Text style={{ ...typography.label, color: ROLE_COLORS[account.role] }}>
                      ACTIVO
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
