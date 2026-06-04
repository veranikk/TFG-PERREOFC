/**
 * Defines shared TypeScript types for the seasons backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Season = Database['public']['Tables']['seasons']['Row'];
export type SeasonInsert = Database['public']['Tables']['seasons']['Insert'];
export type SeasonUpdate = Database['public']['Tables']['seasons']['Update'];




