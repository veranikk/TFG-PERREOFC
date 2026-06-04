/**
 * Defines shared TypeScript types for the points backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type PointsTransaction = Database['public']['Tables']['points_transactions']['Row'];
export type PointsConfig = Database['public']['Tables']['points_config']['Row'];




