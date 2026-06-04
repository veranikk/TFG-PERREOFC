/**
 * Utility module for shared frontend behavior: haptics.
 * It keeps platform-specific helpers reusable across services, hooks and components.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Wrapper seguro: no hace nada en web (no soportado)
const isSupported = Platform.OS !== 'web';

export const haptics = {
  /** Toque ligero — selección, toggle */
  light: () => {
    if (isSupported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Toque medio — confirmar acción */
  medium: () => {
    if (isSupported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Toque fuerte — acción importante */
  heavy: () => {
    if (isSupported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  /** Éxito — guardado, apuesta confirmada, MVP votado */
  success: () => {
    if (isSupported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Error / destructivo — ban, eliminar */
  error: () => {
    if (isSupported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  /** Advertencia */
  warning: () => {
    if (isSupported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
};
