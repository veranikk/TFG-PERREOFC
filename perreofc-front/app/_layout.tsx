/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  useFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import 'react-native-reanimated';
import '../global.css';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useAuthStore } from '../src/store/useAuthStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const rehydrate = useAuthStore((s) => s.rehydrate);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    rehydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthLoading]);

  if (!fontsLoaded || isAuthLoading) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(main)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="goleadores" />
        <Stack.Screen name="clasificacion" />
        <Stack.Screen name="profile" />
      </Stack>
    </ThemeProvider>
  );
}
