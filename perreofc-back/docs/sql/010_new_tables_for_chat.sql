-- SQL migration or seed script for the backend database: 010 new tables for chat.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- PERREO FC — Chat con IA
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Tipo enum para el rol del emisor del mensaje
CREATE TYPE chat_sender AS ENUM ('user', 'assistant');

-- ------------------------------------------------------------
-- Sesiones de chat (una por usuario activa)
-- ------------------------------------------------------------
CREATE TABLE public.chat_sessions (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  started_at    timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active     boolean NOT NULL DEFAULT true,

  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_active  ON public.chat_sessions(user_id) WHERE is_active = true;

-- ------------------------------------------------------------
-- Mensajes del chat
-- ------------------------------------------------------------
CREATE TABLE public.chat_messages (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL,
  sender      chat_sender NOT NULL,
  content     text NOT NULL,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id)
    REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(session_id, created_at);

-- ------------------------------------------------------------
-- Trigger: actualiza last_message_at en la sesión
-- cada vez que se inserta un mensaje
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET last_message_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_last_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION update_session_last_message();

-- ------------------------------------------------------------
-- RLS (Row Level Security)
-- Cada usuario solo ve sus propias sesiones y mensajes.
-- Fastify usa el service role key → bypass automático.
-- Estas policies protegen accesos directos desde el cliente.
-- ------------------------------------------------------------
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Sesiones: solo el dueño
CREATE POLICY "chat_sessions_owner" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Mensajes: solo si la sesión es tuya
CREATE POLICY "chat_messages_owner" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
        AND s.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Vista auxiliar para n8n:
-- Devuelve los últimos N mensajes de una sesión
-- (n8n llamará a la tabla directamente via Supabase Tool,
--  esta view es opcional pero útil para depurar)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_chat_history AS
SELECT
  cm.id,
  cm.session_id,
  cm.sender,
  cm.content,
  cm.created_at,
  cs.user_id
FROM public.chat_messages cm
JOIN public.chat_sessions cs ON cs.id = cm.session_id
ORDER BY cm.created_at ASC;