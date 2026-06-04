/**
 * Defines shared TypeScript types for the auth backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];




