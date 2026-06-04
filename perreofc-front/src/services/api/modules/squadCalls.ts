/**
 * API module that wraps backend calls for squad calls.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';

export type KitSlot = 'titular' | 'suplente';

export interface SquadCallPlayer {
  playerId: number;
  playerName: string;
}

export interface SquadCallKit {
  shirtColor:  string | null;
  shirtColor1: string | null;
  shirtColor2: string | null;
  shortsColor: string | null;
  shortsColor1: string | null;
  socksColor:  string | null;
  socksColor1: string | null;
}

export interface SquadCall {
  id: string;
  matchId: number;
  reportTime:  string | null;
  location:    string | null;
  kitSlot:     KitSlot;
  shirtColor:  string | null;
  shortsColor: string | null;
  socksColor:  string | null;
  players:     SquadCallPlayer[];
  createdBy:   string;
  createdAt:   string;
  updatedAt:   string;
  kit:         SquadCallKit | null;
}

export interface UpsertSquadCallBody {
  reportTime?:  string | null;
  location?:    string | null;
  kitSlot:      KitSlot;
  shirtColor?:  string | null;
  shortsColor?: string | null;
  socksColor?:  string | null;
  players:      SquadCallPlayer[];
}

export const squadCallsApi = {
  /** GET /matches/:matchId/squad-call */
  getSquadCall: (matchId: string | number) =>
    fetchClient<SquadCall | null>(`/matches/${matchId}/squad-call`),

  /** POST /matches/:matchId/squad-call — upsert (admin/superadmin) */
  upsertSquadCall: (matchId: string | number, data: UpsertSquadCallBody) =>
    fetchClient<SquadCall>(`/matches/${matchId}/squad-call`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** DELETE /matches/:matchId/squad-call */
  deleteSquadCall: (matchId: string | number) =>
    fetchClient<void>(`/matches/${matchId}/squad-call`, { method: 'DELETE' }),
};
