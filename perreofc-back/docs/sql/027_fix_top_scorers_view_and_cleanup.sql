-- SQL migration or seed script for the backend database: 027 fix top scorers view and cleanup.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 027_fix_top_scorers_view_and_cleanup.sql
-- Corrige la vista v_top_scorers_full para devolver solo el
-- snapshot más reciente por grupo, y elimina snapshots históricos
-- dejando únicamente el último por cada group_id.
-- ============================================================

-- 1. Actualizar la vista para filtrar solo el snapshot más reciente por grupo
CREATE OR REPLACE VIEW public.v_top_scorers_full AS
SELECT
  ts.id,
  ts.position,
  ts.player_name,
  ts.player_photo_url,
  ts.team_name,
  ts.team_shield_url,
  ts.matches_played,
  ts.goals,
  ts.penalty_goals,
  ts.goals_per_match,
  ts.snapshot_date,
  cg.name AS group_name,
  c.name AS competition_name,
  s.name AS season_name
FROM public.top_scorers ts
JOIN public.competition_groups cg ON cg.id = ts.group_id
JOIN public.competitions c ON c.id = cg.competition_id
JOIN public.seasons s ON s.id = c.season_id
WHERE ts.snapshot_date = (
  SELECT MAX(ts2.snapshot_date)
  FROM public.top_scorers ts2
  WHERE ts2.group_id = ts.group_id
);

-- 2. Limpiar snapshots históricos: eliminar todo excepto el más reciente por grupo
DELETE FROM public.top_scorers
WHERE id NOT IN (
  SELECT DISTINCT ON (group_id, position) id
  FROM public.top_scorers
  ORDER BY group_id, position, snapshot_date DESC
);