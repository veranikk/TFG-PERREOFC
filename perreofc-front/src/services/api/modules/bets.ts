/**
 * API module that wraps backend calls for bets.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Bet } from '../types';

export const betsApi = {
  // FASE 9: Apuestas (Gamificación) [AUTH]
  
  /** 38. POST /bets - Crear apuesta (home/draw/away) */
  createBet: (data: { matchId: string; prediction: 'home' | 'draw' | 'away'; pointsWagered: number }) =>
    fetchClient<Bet>('/bets', { method: 'POST', body: JSON.stringify({ ...data, matchId: Number(data.matchId) }) }),

  /** 39. GET /bets - Mi historial de apuestas */
  getMyBets: () => fetchClient<Bet[]>('/bets'),

  /** 40. GET /matches/:id/bets - Mis apuestas para un partido específico */
  getBetsByMatch: (matchId: string) => fetchClient<Bet[]>(`/matches/${matchId}/bets`),

  /** 41. PUT /bets/:id - Editar apuesta (si el partido no ha empezado) */
  updateBet: (id: string, data: { prediction: 'home' | 'draw' | 'away'; pointsWagered: number }) => 
    fetchClient<Bet>(`/bets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** 42. DELETE /bets/:id - Cancelar apuesta y recuperar puntos */
  cancelBet: (id: string) => fetchClient<void>(`/bets/${id}`, { method: 'DELETE' }),

  /** 43. GET /users/me/bets/statistics - Resumen de mi éxito en apuestas */
  getMyBetStatistics: () => fetchClient<any>('/users/me/bets/statistics'),

  /** 44. GET /leaderboard/bets - Top apostadores de la plataforma */
  getBetsLeaderboard: () => fetchClient<any[]>('/leaderboard/bets'),

  /** 45. POST /bets/settle - Liquidar apuestas de un partido [ADMIN] */
  settleBetsForMatch: (matchId: string) => 
    fetchClient<void>('/bets/settle', { method: 'POST', body: JSON.stringify({ matchId }) }),
};
