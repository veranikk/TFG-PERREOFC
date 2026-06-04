/**
 * Defines shared TypeScript types for the matches backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];

export type MatchRound = Database['public']['Tables']['match_rounds']['Row'];
export type MatchLineup = Database['public']['Tables']['match_lineup_entries']['Row'];




