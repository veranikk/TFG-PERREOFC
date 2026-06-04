/**
 * Defines shared TypeScript types for the bets backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Bet = Database['public']['Tables']['user_bets']['Row'];
export type BetInsert = Database['public']['Tables']['user_bets']['Insert'];
export type BetUpdate = Database['public']['Tables']['user_bets']['Update'];




