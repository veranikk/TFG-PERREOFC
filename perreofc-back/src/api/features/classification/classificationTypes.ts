/**
 * Defines shared TypeScript types for the classification backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type ClassificationEntry = Database['public']['Tables']['classification_entries']['Row'];
export type ClassificationForm = Database['public']['Tables']['classification_form']['Row'];




