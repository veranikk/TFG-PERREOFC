/**
 * API module that wraps backend calls for matches.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Match, Lineup, MatchEvent } from '../types';

export const matchesApi = {
  // FASE 6: Partidos (Matches)
  
  /** 27. GET /matches/:id - Detalle completo del partido */
  getMatchById: (id: string) => fetchClient<Match>(`/matches/${id}`),

  /** 28. GET /matches/:id/lineups - Alineaciones (titulares y suplentes) */
  getMatchLineups: (matchId: string) => fetchClient<Lineup[]>(`/matches/${matchId}/lineups`),

  /** 29. GET /matches/:id/events - Cronología (goles, tarjetas, cambios) */
  getMatchEvents: (matchId: string) => fetchClient<MatchEvent[]>(`/matches/${matchId}/events`),

  /** 30. GET /matches/:id/stats - Estadísticas comparativas (home vs away) */
  getMatchStats: (matchId: string) => fetchClient<any>(`/matches/${matchId}/stats`),
};
