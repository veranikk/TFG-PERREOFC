-- SQL migration or seed script for the backend database: 038 drop derived and unused columns.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 038: Eliminar columnas derivadas, redundantes y sin uso
-- ============================================================
-- Ejecutar DESPUÉS de desplegar los cambios de código:
--   - scraper/player.ts (ya no genera goals_avg/minutes_avg)
--   - scraper/upsertCompetitionGroups.ts (ya no escribe season_name/competition_type)
-- ============================================================

-- -------------------------------------------------------
-- v_players_full: recrear sin goals_avg (columna a eliminar)
-- El valor se calcula ahora en la propia vista.
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.v_players_full;
CREATE VIEW public.v_players_full AS
SELECT
  p.id,
  p.full_name,
  p.first_name,
  p.last_name,
  p.birth_year,
  p.photo_url,
  p.is_goalkeeper,
  t.name AS team_name,
  tp.dorsal,
  tp.position,
  s.name AS season_name,
  pss.matches_played,
  pss.matches_starting,
  pss.matches_substitute,
  pss.goals_total,
  ROUND(pss.goals_total::numeric / NULLIF(pss.matches_played, 0), 2) AS goals_avg,
  pss.minutes_total,
  pss.yellow_cards,
  pss.red_cards,
  pss.double_yellow_cards
FROM public.players p
LEFT JOIN public.team_players tp ON tp.player_id = p.id
LEFT JOIN public.teams t ON t.id = tp.team_id
LEFT JOIN public.seasons s ON s.id = tp.season_id
LEFT JOIN public.player_season_stats pss ON (
  pss.player_id = p.id AND
  pss.team_id = tp.team_id AND
  pss.season_id = tp.season_id
);

-- -------------------------------------------------------
-- player_season_stats: eliminar campos derivados
-- (calculables: goals_total/matches_played y minutes_total/matches_played)
-- -------------------------------------------------------
ALTER TABLE public.player_season_stats
  DROP COLUMN IF EXISTS goals_avg,
  DROP COLUMN IF EXISTS minutes_avg;

-- -------------------------------------------------------
-- teams: eliminar columnas sin uso en backend ni frontend
-- -------------------------------------------------------
ALTER TABLE public.teams
  DROP COLUMN IF EXISTS home_day,
  DROP COLUMN IF EXISTS home_schedule;

-- -------------------------------------------------------
-- competition_groups: eliminar columnas redundantes
-- (obtenibles via JOIN con competitions y seasons)
-- -------------------------------------------------------
ALTER TABLE public.competition_groups
  DROP COLUMN IF EXISTS season_name,
  DROP COLUMN IF EXISTS competition_type;
