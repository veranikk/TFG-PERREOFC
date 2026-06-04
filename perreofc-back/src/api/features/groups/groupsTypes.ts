/**
 * Defines shared TypeScript types for the groups backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Group = Database['public']['Tables']['competition_groups']['Row'];
export type GroupInsert = Database['public']['Tables']['competition_groups']['Insert'];
export type GroupUpdate = Database['public']['Tables']['competition_groups']['Update'];




