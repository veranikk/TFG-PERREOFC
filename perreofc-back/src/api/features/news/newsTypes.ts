/**
 * Defines shared TypeScript types for the news backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type News = Database['public']['Tables']['news_articles']['Row'];
export type NewsInsert = Database['public']['Tables']['news_articles']['Insert'];
export type NewsUpdate = Database['public']['Tables']['news_articles']['Update'];




