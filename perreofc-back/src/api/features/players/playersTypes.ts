/**
 * Defines shared TypeScript types for the players backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Player = Database['public']['Tables']['players']['Row'];
export type PlayerInsert = Database['public']['Tables']['players']['Insert'];
export type PlayerUpdate = Database['public']['Tables']['players']['Update'];

export type PlayerSeasonStats = Database['public']['Tables']['player_season_stats']['Row'];




