/**
 * API module that wraps backend calls for me.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { User, NotificationPreferences } from '../types';

export const meApi = {
  // FASE 0-1: Health & Perfil Propio (Me)
  
  /** 1. GET /health - Health check (público) */
  getHealth: () => fetchClient<{ status: string }>('/health'),

  /** 2. GET /me - Mi perfil [AUTH] */
  getMe: () => fetchClient<User>('/me'),

  /** 3. PATCH /me - Actualizar nombre/apellidos/username/avatar [AUTH] */
  updateProfile: (data: { firstName?: string; lastName?: string; username?: string; avatarUrl?: string | null }) =>
    fetchClient<User>('/me', { method: 'PATCH', body: JSON.stringify(data) }),

  /** 4. POST /auth/change-password - Cambiar contraseña [AUTH] */
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    fetchClient<{ success: boolean; message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  /** 4b. POST /auth/verify-password - Verificar contraseña actual [AUTH] */
  verifyCurrentPassword: (password: string) =>
    fetchClient<{ valid: boolean }>('/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),

  /** 4c. GET /auth/change-password/status - Verificar si puede cambiar contraseña [AUTH] */
  getChangePasswordStatus: () =>
    fetchClient<
      | { canChange: true; changesUsed: number; changesMax: number }
      | { canChange: false; reason: 'too_many_changes'; nextAllowedAt: string; retryHours: number; message: string }
      | { canChange: false; reason: 'too_many_failures'; nextAllowedAt: string; retryMinutes: number; message: string }
    >('/auth/change-password/status'),

  /** 5. GET /me/notifications/preferences - Ver mis ajustes de notificaciones [AUTH] */
  getNotificationPreferences: () =>
    fetchClient<NotificationPreferences>('/me/notifications/preferences'),

  /** 6. PATCH /me/notifications/preferences - Cambiar ajustes [AUTH] */
  updateNotificationPreferences: (data: Partial<NotificationPreferences>) =>
    fetchClient<NotificationPreferences>('/me/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) }),

  /** 7. GET /me/notifications/enabled - ¿Tiene el usuario las notificaciones activadas? [AUTH] */
  getNotificationsEnabled: () =>
    fetchClient<{ enabled: boolean }>('/me/notifications/enabled'),

  /** 8. PATCH /me/notifications/enabled - Activar/desactivar notificaciones [AUTH] */
  setNotificationsEnabled: (enabled: boolean) =>
    fetchClient<{ enabled: boolean }>('/me/notifications/enabled', {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  /** 9. POST /me/push-token - Guardar Expo push token [AUTH] */
  savePushToken: (token: string) =>
    fetchClient<{ saved: boolean }>('/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};
