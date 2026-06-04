/**
 * API module that wraps backend calls for notifications.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Notification, NotificationsPaginated } from '../types';

export const notificationsApi = {
  // FASE 10: Notificaciones [AUTH]

  /** GET /notifications - Todas mis notificaciones (paginado) */
  getNotifications: (page = 1, limit = 20) =>
    fetchClient<NotificationsPaginated>(`/notifications?page=${page}&limit=${limit}`),

  /** GET /notifications/unread - Solo las pendientes de leer */
  getUnreadNotifications: (page = 1, limit = 20) =>
    fetchClient<NotificationsPaginated>(`/notifications/unread?page=${page}&limit=${limit}`),

  /** GET /notifications/unread-count - Conteo de no leídas (para badge) */
  getUnreadCount: () =>
    fetchClient<{ count: number }>('/notifications/unread-count'),

  /** PUT /notifications/:id - Marcar como leída */
  markAsRead: (id: string) =>
    fetchClient<{ id: string; read: boolean }>(`/notifications/${id}`, { method: 'PUT' }),

  /** POST /notifications/mark-all-read - Marcar todo el inbox como leído */
  markAllAsRead: () =>
    fetchClient<{ message: string; markedCount: number }>('/notifications/mark-all-read', { method: 'POST' }),

  /** DELETE /notifications/:id - Eliminar notificación */
  deleteNotification: (id: string) =>
    fetchClient<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),

  /** POST /notifications/broadcast - Envío masivo (admin/superadmin) */
  broadcast: (payload: {
    segment: 'all' | 'aficionados' | 'jugadores' | 'admins';
    title: string;
    body: string;
  }) =>
    fetchClient<{ sent: number }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
