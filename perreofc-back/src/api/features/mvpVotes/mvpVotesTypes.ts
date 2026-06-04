/**
 * Defines shared TypeScript types for the mvp votes backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type MvpVote = Database['public']['Tables']['mvp_votes']['Row'];
export type MvpVoteInsert = Database['public']['Tables']['mvp_votes']['Insert'];




