/**
 * Custom React hook for reusable use chat logic.
 * It hides stateful behavior behind a small API that components can consume cleanly.
 */

import { useState } from 'react';
import { chatApi } from '../services/api/modules/chat';
import { useAuthStore } from '../store/useAuthStore';
import { getAuthToken } from '../services/api/apiClient';

export interface ChatMessageLocal {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function useChat() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessageLocal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const token = await getAuthToken();
    if (!user || !token) {
      throw new Error('Usuario no autenticado');
    }

    const userMsg: ChatMessageLocal = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    const placeholderId = `assistant-${Date.now()}-loading`;
    const placeholder: ChatMessageLocal = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(trimmed);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                id: response.message.id,
                role: 'assistant' as const,
                content: response.message.content,
                created_at: response.message.created_at,
                isLoading: false,
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                ...msg,
                content: 'No se pudo conectar con el agente. Inténtalo de nuevo.',
                isLoading: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    chatApi.closeSession().catch(() => {});
  };

  return { messages, isLoading, sendMessage, clearMessages };
}
