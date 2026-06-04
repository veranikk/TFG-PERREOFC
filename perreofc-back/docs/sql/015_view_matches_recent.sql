-- SQL migration or seed script for the backend database: 015 view matches recent.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 015_view_matches_recent.sql
-- Vista de los 5 partidos más recientes, ordenados por fecha
-- descendente. Depende de v_matches_full (debe existir antes).
-- ============================================================

CREATE OR REPLACE VIEW public.v_matches_recent AS
SELECT *
FROM public.v_matches_full
ORDER BY date DESC
LIMIT 5;
