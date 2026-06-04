/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="password" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="notif-preferences" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="email-change" />
    </Stack>
  );
}
