/**
 * API module that wraps backend calls for chat.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';

export interface ChatResponse {
  session_id: string;
  message: {
    id: string;
    content: string;
    created_at: string;
  };
}

export const chatApi = {
  /** POST /chat/message - Enviar mensaje al agente IA [AUTH] */
  sendMessage: (message: string): Promise<ChatResponse> =>
    fetchClient<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /** DELETE /chat/session - Cerrar sesión activa para empezar de cero [AUTH] */
  closeSession: (): Promise<void> =>
    fetchClient<void>('/chat/session', { method: 'DELETE' }),
};
