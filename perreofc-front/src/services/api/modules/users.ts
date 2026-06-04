/**
 * API module that wraps backend calls for users.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { User, PaginatedResponse, Bet } from '../types';

export const usersApi = {
  // FASE 2: Usuarios (Gestión & Admin)
  
  /** 7. GET /users/:userId - Perfil público de otro usuario */
  getUserProfile: (userId: string) => fetchClient<User>(`/users/${userId}`),

  /** 8. GET /users/:userId/stats - Stats de apuestas de un usuario */
  getUserStats: (userId: string) => fetchClient<any>(`/users/${userId}/stats`),

  /** 9. DELETE /users/me - Soft delete de mi propia cuenta [AUTH] */
  deleteMyAccount: () => fetchClient<void>('/users/me', { method: 'DELETE' }),

  /** Solicitar eliminación de cuenta — envía un PIN de 8 dígitos al email [AUTH] */
  requestDeleteAccount: () =>
    fetchClient<{ message: string }>('/users/me/delete-request', { method: 'POST' }),

  /** Confirmar eliminación de cuenta con el PIN recibido por email [AUTH] */
  confirmDeleteAccount: (pin: string) =>
    fetchClient<{ message: string }>('/users/me/delete-confirm', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  /** 10. GET /admin/users - Listado paginado de usuarios [ADMIN] */
  getUsers: (page = 1, limit = 10) => fetchClient<PaginatedResponse<User>>(`/admin/users?page=${page}&limit=${limit}`),

  /** 11. PUT /admin/users/:userId - Cambiar rol de un usuario [ADMIN] */
  changeUserRole: (userId: string, role: 'user' | 'admin' | 'superadmin') => 
    fetchClient<User>(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }),

  /** 12. DELETE /admin/users/:userId - Hard delete de usuario [SUPERADMIN] */
  hardDeleteUser: (userId: string) => fetchClient<void>(`/admin/users/${userId}`, { method: 'DELETE' }),

  /** 13. GET /admin/users/:userId - Detalle con email [ADMIN] */
  getAdminUser: (userId: string) => fetchClient<any>(`/admin/users/${userId}`),

  /** 14. PATCH /admin/users/:userId/points - Ajustar puntos [SUPERADMIN] */
  adjustUserPoints: (userId: string, delta: number) =>
    fetchClient<{ userId: string; delta: number; newPoints: number }>(
      `/admin/users/${userId}/points`,
      { method: 'PATCH', body: JSON.stringify({ delta }) },
    ),

  /** 15. PATCH /admin/users/:userId/ban - Banear/desbanear usuario [ADMIN] */
  banUser: (userId: string, banned: boolean, banReason?: string) =>
    fetchClient<{ id: string; banned: boolean; banReason: string | null }>(
      `/admin/users/${userId}/ban`,
      { method: 'PATCH', body: JSON.stringify({ banned, banReason }) },
    ),

  /** 16. GET /admin/players/unlinked - Jugadores sin cuenta de usuario [ADMIN] */
  getUnlinkedPlayers: () =>
    fetchClient<{ id: number; fullName: string; firstName: string; lastName: string; photoUrl: string | null }[]>(
      '/admin/players/unlinked',
    ),

  /** Cambio de correo (solo aficionados) */
  emailChangeStatus: () =>
    fetchClient<{
      canChange: boolean;
      reason?: 'too_many_changes' | 'too_many_failures';
      nextAllowedAt?: string;
      retryHours?: number;
      retryMinutes?: number;
      message?: string;
      changesUsed?: number;
      changesMax?: number;
    }>('/users/me/email-change/status'),

  requestEmailChange: (newEmail: string, currentPassword: string) =>
    fetchClient<{ message: string }>('/users/me/email-change/request', {
      method: 'POST',
      body: JSON.stringify({ newEmail, currentPassword }),
    }),

  confirmEmailChange: (pin: string) =>
    fetchClient<{ message: string; newEmail: string }>('/users/me/email-change/confirm', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  /** 16. POST /admin/users - Crear usuario desde panel admin [ADMIN] */
  createAdminUser: (data: {
    role: 'jugador' | 'admin' | 'superadmin';
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    playerId?: number;
  }) =>
    fetchClient<User>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
};
