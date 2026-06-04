/**
 * API module that wraps backend calls for players.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Player, PlayerStats, Match } from '../types';

/** 35. GET /players/:id - Perfil completo del jugador (datos personales, estadísticas, últimos partidos) */
export const playersApi = {
  // FASE 8: Jugadores

  getPlayerById: (id: string) => fetchClient<Player>(`/players/${id}`),

  /** 36. GET /players/:id/statistics - Estadísticas detalladas del jugador por temporada */
  getPlayerStatistics: (playerId: string) => fetchClient<PlayerStats[]>(`/players/${playerId}/statistics`),

  /** 37. GET /players/:id/matches - Partidos jugados por el jugador con filtro de temporada */
  getPlayerMatches: (playerId: string) => fetchClient<Match[]>(`/players/${playerId}/matches`),
};
