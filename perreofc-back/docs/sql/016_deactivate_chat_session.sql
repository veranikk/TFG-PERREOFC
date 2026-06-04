-- SQL migration or seed script for the backend database: 016 deactivate chat session.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 016_deactivate_chat_session.sql
-- Desactiva la sesión de chat de prueba usada durante desarrollo.
-- ============================================================

UPDATE public.chat_sessions
SET is_active = false
WHERE id = '6b886ff2-1c1d-4c83-a9db-7068502f8356';
