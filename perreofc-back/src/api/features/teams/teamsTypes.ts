/**
 * Defines shared TypeScript types for the teams backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];

export type Club = Database['public']['Tables']['clubs']['Row'];




