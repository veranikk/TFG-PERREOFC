/**
 * Defines shared TypeScript types for the competitions backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Competition = Database['public']['Tables']['competitions']['Row'];
export type CompetitionInsert = Database['public']['Tables']['competitions']['Insert'];
export type CompetitionUpdate = Database['public']['Tables']['competitions']['Update'];




