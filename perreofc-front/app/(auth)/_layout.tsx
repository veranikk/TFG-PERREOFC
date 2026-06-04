/**
 * Defines an Expo Router layout for the layout navigation area.
 * It controls shared providers, stacks, tabs or guards for the screens under this folder.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
