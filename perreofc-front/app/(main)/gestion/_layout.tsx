/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Stack } from 'expo-router';

export default function GestionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="puntos" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="notificaciones" />
      <Stack.Screen name="logs" />
      <Stack.Screen name="usuarios/index" />
      <Stack.Screen name="usuarios/[id]" />
    </Stack>
  );
}
