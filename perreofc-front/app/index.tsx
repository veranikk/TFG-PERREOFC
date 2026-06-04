/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme } from '../src/hooks/useTheme';

// Pantalla de entrada — redirige según sesión una vez rehydratada
export default function IndexScreen() {
  const { user, isLoading } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/(main)/calendario');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, user]);

  // Mientras se comprueba la sesión, muestra el color de fondo del tema
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
