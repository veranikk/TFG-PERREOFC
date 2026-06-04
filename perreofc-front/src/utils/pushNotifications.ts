/**
 * Utility module for shared frontend behavior: push notifications.
 * It keeps platform-specific helpers reusable across services, hooks and components.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { meApi } from '../services/api/modules/me';

export function configureForegroundNotifications() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });
  } catch {
    // Expo Go no soporta esto en Android — ignorar
  }
}

/**
 * Registra un listener para cuando el usuario toca una notificación.
 * Devuelve la función de cleanup.
 */
export function addNotificationTapListener(onTap: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(() => onTap());
  return () => sub.remove();
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Perreo FC',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FE6128',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    await meApi.savePushToken(token).catch(() => {});
    return token;
  } catch {
    return null;
  }
}