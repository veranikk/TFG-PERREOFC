/**
 * API module that wraps backend calls for teams.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Team, Player, Match } from '../types';

export const teamsApi = {
  // FASE 7: Equipos
  
  /** 31. GET /teams/:id - Info del equipo y club */
  getTeamById: (id: string) => fetchClient<Team>(`/teams/${id}`),

  /** 32. GET /teams/:id/squad - Plantilla con fotos y dorsales */
  getTeamSquad: (teamId: string) => fetchClient<Player[]>(`/teams/${teamId}/squad`),

  /** 33. GET /teams/:id/matches - Calendario de resultados del equipo */
  getTeamMatches: (teamId: string) => fetchClient<Match[]>(`/teams/${teamId}/matches`),

  /** 34. GET /teams/:id/statistics - Estadísticas acumuladas del equipo */
  getTeamStatistics: (teamId: string) => fetchClient<any>(`/teams/${teamId}/statistics`),

  /** GET /teams/:id/kits - Diseños de equipaciones del equipo */
  getTeamKits: (teamId: string) => fetchClient<Array<{
    kitNumber: number;
    shirt1:    string | null;
    shirt1Hex: string | null;
    shirt2:    string | null;
    shirt2Hex: string | null;
    short1:    string | null;
    short1Hex: string | null;
    short2:    string | null;
    short2Hex: string | null;
    socks:     string | null;
    socksHex:  string | null;
  }>>(`/teams/${teamId}/kits`),
};
