/**
 * Utility module for shared frontend behavior: push notifications.android.
 * It keeps platform-specific helpers reusable across services, hooks and components.
 */

// Android + Expo Go no soporta push remotas desde SDK 53.
// Este archivo reemplaza pushNotifications.ts en Android para evitar el error.

export function configureForegroundNotifications() {}

export function addNotificationTapListener(_onTap: () => void): () => void {
  return () => {};
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null;
}