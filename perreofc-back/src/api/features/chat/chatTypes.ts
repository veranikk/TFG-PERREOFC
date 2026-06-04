/**
 * Defines shared TypeScript types for the chat backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];


export interface N8nPayload {
  message: string;
  user_rol: string;
  user_id: string;
  session_id: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}




