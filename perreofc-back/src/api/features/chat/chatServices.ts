/**
 * Contains the business and persistence logic for the chat backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { env } from '../../../shared/env.js';
import { logger } from '../../../shared/logger.js';
import {
  closeActiveSession,
  createSession,
  getActiveSession,
  getRecentMessages,
  insertMessage,
} from './chatRepository.js';
import type { ChatMessage, N8nPayload } from './chatTypes.js';

export async function callN8nAgent(payload: N8nPayload): Promise<string> {
  const signal = AbortSignal.timeout(30000);

  let response: Response;
  try {
    response = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      logger.error({ context: 'n8n' }, 'Timeout alcanzado (30s)');
      throw new N8nTimeoutError();
    }
    logger.error({ context: 'n8n', errName: err.name, errMsg: err.message }, 'Error de red al llamar al webhook');
    throw new N8nUnavailableError(err.message);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '(sin cuerpo)');
    console.error(`[n8n] Status ${response.status}: ${errText}`);
    throw new N8nUnavailableError(`n8n respondió con status ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new N8nUnavailableError('Respuesta de n8n no es JSON válido');
  }

  logger.debug({ context: 'n8n', snippet: JSON.stringify(body).slice(0, 300) }, 'Respuesta recibida');

  const extract = (val: unknown): string | null => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return null;
  };

  // Array con { output } — formato estándar con respondWith: allIncomingItems
  if (Array.isArray(body) && body.length > 0) {
    const out = extract((body[0] as any)?.output) ?? extract((body[0] as any)?.text);
    if (out) return out;
  }

  // Objeto directo con { output } o { text }
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const out = extract((body as any).output) ?? extract((body as any).text);
    if (out) return out;
  }

  logger.error({ context: 'n8n', body: JSON.stringify(body).slice(0, 500) }, 'Respuesta vacía o formato inesperado');
  throw new N8nUnavailableError('El agente no generó una respuesta válida');
}

export async function processMessage(
  userId: string,
  userRole: string,
  message: string,
): Promise<{ session_id: string; message: ChatMessage }> {
  let session = await getActiveSession(userId);
  if (!session) {
    session = await createSession(userId);
  }

  await insertMessage(session.id, 'user', message);

  const recentMessages = await getRecentMessages(session.id, 6);

  const history = recentMessages
    .filter((m) => !(m.sender === 'user' && m.content === message))
    .map((m) => ({
      role: m.sender as 'user' | 'assistant',
      content: m.content,
    }));

  const n8nPayload: N8nPayload = {
    message,
    user_rol: userRole,
    user_id: userId,
    session_id: session.id,
    history,
  };

  const agentResponse = await callN8nAgent(n8nPayload);

  const assistantMessage = await insertMessage(session.id, 'assistant', agentResponse);

  return {
    session_id: session.id,
    message: assistantMessage,
  };
}

export async function resetSession(userId: string): Promise<void> {
  await closeActiveSession(userId);
}

export class N8nTimeoutError extends Error {
  constructor() {
    super('El agente no está disponible en este momento');
    this.name = 'N8nTimeoutError';
  }
}

export class N8nUnavailableError extends Error {
  constructor(detail?: string) {
    super('El agente no está disponible en este momento');
    this.name = 'N8nUnavailableError';
    if (detail) this.cause = detail;
  }
}