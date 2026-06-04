/**
 * Defines shared TypeScript types for the squad calls backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

export type KitSlot = 'titular' | 'suplente';

export interface SquadCallPlayer {
  playerId: number;
  playerName: string;
}

export interface SquadCall {
  id: string;
  matchId: number;
  reportTime: string | null;
  location: string | null;
  kitSlot: KitSlot;
  shirtColor:  string | null;
  shortsColor: string | null;
  socksColor:  string | null;
  players: SquadCallPlayer[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SquadCallWithKit extends SquadCall {
  kit: {
    shirtColor: string | null;
    shirtColor1: string | null;
    shirtColor2: string | null;
    shortsColor: string | null;
    shortsColor1: string | null;
    socksColor: string | null;
    socksColor1: string | null;
  } | null;
}
