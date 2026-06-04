/**
 * Defines shared TypeScript types for the notifications backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];




