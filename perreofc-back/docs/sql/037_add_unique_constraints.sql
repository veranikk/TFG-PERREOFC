-- SQL migration or seed script for the backend database: 037 add unique constraints.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 037: Añadir constraints de unicidad que faltaban
-- ============================================================
-- IMPORTANTE: ejecutar ANTES de 038 y 039.
-- Ejecutar primero las queries de verificación (comentadas abajo).
-- Si devuelven filas, resolver los duplicados manualmente antes de aplicar.
-- ============================================================

-- Verificación previa: ¿hay duplicados en team_players?
-- SELECT team_id, player_id, season_id, COUNT(*)
-- FROM team_players GROUP BY 1,2,3 HAVING COUNT(*) > 1;

-- Verificación previa: ¿hay duplicados en player_season_stats?
-- SELECT player_id, team_id, season_id, COUNT(*)
-- FROM player_season_stats GROUP BY 1,2,3 HAVING COUNT(*) > 1;

-- Verificación previa: ¿hay más de 1 temporada activa?
-- SELECT COUNT(*) FROM seasons WHERE is_current = true;  -- debe ser <= 1

-- -------------------------------------------------------
-- 1. Garantizar que solo puede haber una temporada activa
-- -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_one_current
  ON public.seasons (is_current)
  WHERE is_current = true;

-- -------------------------------------------------------
-- 2. Evitar jugadores duplicados por equipo/temporada
-- -------------------------------------------------------
ALTER TABLE public.team_players
  ADD CONSTRAINT uq_team_players UNIQUE (team_id, player_id, season_id);

-- -------------------------------------------------------
-- 3. Evitar stats duplicadas por jugador/equipo/temporada
-- -------------------------------------------------------
ALTER TABLE public.player_season_stats
  ADD CONSTRAINT uq_player_season_stats UNIQUE (player_id, team_id, season_id);
