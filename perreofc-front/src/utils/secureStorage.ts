/**
 * Utility module for shared frontend behavior: secure storage.
 * It keeps platform-specific helpers reusable across services, hooks and components.
 */

// src/utils/secureStorage.ts
// Abstracción sobre SecureStore (iOS Keychain / Android Keystore) con fallback a
// AsyncStorage en web, donde SecureStore no está disponible.
// Usar solo para datos sensibles: tokens JWT y refresh tokens.
// El objeto User (sesión) se mantiene en AsyncStorage porque puede superar el
// límite de 2 KB de SecureStore y no es un dato de acceso directo a la API.

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// SecureStore solo funciona en dispositivos nativos (Android/iOS).
// En web se usa AsyncStorage como fallback aceptable (no hay Keychain en navegador).
const useSecure = Platform.OS !== 'web';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (useSecure) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (useSecure) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (useSecure) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};
