/**
 * API module that wraps backend calls for home.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Standing, PlayerStats } from '../types';

export const homeApi = {
  // FASE 11: Endpoints de Home & Puntos

  /** 51. GET /home - Widgets de la pantalla de inicio */
  getHomeWidgets: () => fetchClient<any>('/home'),

  /** 52. GET /classification - Clasificación rápida (usa el equipo favorito por defecto) */
  getQuickClassification: () => fetchClient<Standing[]>('/classification'),

  /** 53. GET /top-scorers - Goleadores rápidos */
  getQuickTopScorers: (limit = 100) => fetchClient<PlayerStats[]>(`/top-scorers?limit=${limit}`),

  /** 54. GET /leaderboard - Ranking de puntos total (Solo aficionados) */
  getPointsLeaderboard: () => fetchClient<any[]>('/leaderboard'),

  /** 55. GET /points/config - Configuración de puntos (cuanto se gana por cada acción) */
  getPointsConfig: () => fetchClient<any>('/points/config'),

  /** 55b. PATCH /admin/points/config - Actualizar configuración de puntos [SUPERADMIN] */
  updatePointsConfig: (data: { register?: number; dailyLogin?: number; voteMvp?: number; winBet?: number }) =>
    fetchClient<any>('/admin/points/config', { method: 'PATCH', body: JSON.stringify(data) }),

  /** 55c. PATCH /admin/matches/:matchId/mvp-deadline - Fijar fecha límite votación MVP [ADMIN] */
  setMvpDeadline: (matchId: string | number, date: string) =>
    fetchClient<{ matchId: number; mvpVotingDeadline: string }>(`/admin/matches/${matchId}/mvp-deadline`, { method: 'PATCH', body: JSON.stringify({ date }) }),

  /** 56. POST /me/daily-login - Reclamar puntos diarios [AUTH, Solo Aficionado] */
  claimDailyLogin: () => fetchClient<{ pointsAwarded: number; newBalance: number; alreadyClaimed: boolean }>('/me/daily-login', { method: 'POST' }),

  /** 57. GET /me/points - Mi historial de puntos */
  getMyPointsHistory: (params?: { action?: string; since?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.since)  qs.set('since', params.since);
    if (params?.page)   qs.set('page', String(params.page));
    if (params?.limit)  qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchClient<{ data: any[]; pagination: any }>(`/me/points${query}`);
  },

  /** 58. POST /mvp-votes - Votar MVP del partido [AUTH] */
  voteMvp: (data: { matchId: string; playerId: string }) =>
    fetchClient<{ matchId: number; playerId: number; playerName: string; pointsAwarded: number; newBalance: number }>('/mvp-votes', { method: 'POST', body: JSON.stringify(data) }),

  /** 59. GET /mvp-votes/:matchId - Ver resultado de votación */
  getMvpVotes: (matchId: string) => fetchClient<any>(`/mvp-votes/${matchId}`),
};
