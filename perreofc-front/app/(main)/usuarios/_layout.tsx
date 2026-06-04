/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Stack } from 'expo-router';

export default function UsuariosLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
