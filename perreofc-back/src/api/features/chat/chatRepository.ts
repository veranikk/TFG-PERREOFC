/**
 * Repository layer for chat database access.
 * It keeps Supabase chat queries separate from service orchestration and n8n calls.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import type { ChatMessage, ChatSession } from './chatTypes.js';

export async function getActiveSession(userId: string): Promise<ChatSession | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ChatSession | null;
}

export async function createSession(userId: string): Promise<ChatSession> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      started_at: now,
      last_message_at: now,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatSession;
}

export async function insertMessage(
  sessionId: string,
  sender: 'user' | 'assistant',
  content: string,
): Promise<ChatMessage> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender,
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Actualizar last_message_at de la sesión
  await supabase
    .from('chat_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId);

  return data as ChatMessage;
}

export async function closeActiveSession(userId: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('chat_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
}

export async function getRecentMessages(sessionId: string, limit: number): Promise<ChatMessage[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Devolver en orden ascendente (los más recientes al final)
  return ((data as ChatMessage[]) ?? []).reverse();
}




