/**
 * API module that wraps backend calls for leagues.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Season, Competition, Standing, PlayerStats, Group, Match, PaginatedResponse } from '../types';

export const leaguesApi = {
  // FASE 3-5: Estructura de Liga (Seasons, Competitions, Groups)
  
  /** 13. GET /seasons - Listado de temporadas */
  getSeasons: () => fetchClient<Season[]>('/seasons'),

  /** 14. GET /seasons/current - Temporada activa */
  getCurrentSeason: () => fetchClient<Season>('/seasons/current'),

  /** 15. GET /seasons/:id - Detalle de temporada */
  getSeasonById: (id: string) => fetchClient<Season>(`/seasons/${id}`),

  /** 16. GET /seasons/:id/competitions - Competiciones por temporada */
  getCompetitionsBySeason: (seasonId: string) => fetchClient<Competition[]>(`/seasons/${seasonId}/competitions`),

  /** 17. GET /competitions/:id - Detalle de competición */
  getCompetitionById: (id: string) => fetchClient<Competition>(`/competitions/${id}`),

  /** 18. GET /competitions/:id/standings - Clasificación (soporta ?roundNumber) */
  getStandings: (competitionId: string, roundNumber?: number) => {
    const query = roundNumber ? `?roundNumber=${roundNumber}` : '';
    return fetchClient<Standing[]>(`/competitions/${competitionId}/standings${query}`);
  },

  /** 19. GET /competitions/:id/top-scorers - Ranking de goleadores */
  getTopScorers: (competitionId: string) => fetchClient<PlayerStats[]>(`/competitions/${competitionId}/top-scorers`),

  /** 20. GET /competitions/:id/top-assists - Ranking de asistentes (mockup) */
  getTopAssists: (competitionId: string) => fetchClient<PlayerStats[]>(`/competitions/${competitionId}/top-assists`),

  /** 21. GET /competitions/:id/most-yellow-cards - Ranking de amarillas */
  getMostYellowCards: (competitionId: string) => fetchClient<PlayerStats[]>(`/competitions/${competitionId}/most-yellow-cards`),

  /** 22. GET /competitions/:id/most-red-cards - Ranking de rojas */
  getMostRedCards: (competitionId: string) => fetchClient<PlayerStats[]>(`/competitions/${competitionId}/most-red-cards`),

  /** 23. GET /competitions/:id/groups - Grupos de la competición */
  getGroupsByCompetition: (competitionId: string) => fetchClient<Group[]>(`/competitions/${competitionId}/groups`),

  /** 24. GET /groups/:id - Header del grupo (nombre, liga) */
  getGroupById: (id: string) => fetchClient<Group>(`/groups/${id}`),

  /** 25. GET /groups/:id/matches - Partidos del grupo (paginado) */
  getMatchesByGroup: (groupId: string, page = 1, limit = 10) => 
    fetchClient<PaginatedResponse<Match>>(`/groups/${groupId}/matches?page=${page}&limit=${limit}`),

  /** 26. GET /groups/:id/matches/round/current - Partidos de la jornada actual */
  getCurrentRoundMatchesByGroup: (groupId: string) => fetchClient<Match[]>(`/groups/${groupId}/matches/round/current`),
};
