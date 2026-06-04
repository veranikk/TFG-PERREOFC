/**
 * Frontend service module for auth behavior.
 * It isolates platform or API concerns away from React components.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const SESSION_KEY = '@perreofc:session';

export async function saveSession(user: User): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function loadSession(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
