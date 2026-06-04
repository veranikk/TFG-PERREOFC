-- SQL migration or seed script for the backend database: 017 players position columns.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 017_players_position_columns.sql
-- Añade columnas position y position_code a la tabla players
-- y las rellena para los jugadores del equipo actual.
-- ============================================================

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS position      character varying,
  ADD COLUMN IF NOT EXISTS position_code character varying;

-- Valores: PORTERO/POR, DEFENSA/DEF, MEDIOCENTRO/CEN, DELANTERO/DEL
UPDATE public.players
SET
  position = CASE id
    WHEN 5024606   THEN 'PORTERO'
    WHEN 1149729   THEN 'DELANTERO'
    WHEN 799875    THEN 'MEDIOCENTRO'
    WHEN 1134528   THEN 'DEFENSA'
    WHEN 631418    THEN 'DELANTERO'
    WHEN 2799840   THEN 'DELANTERO'
    WHEN 745455    THEN 'MEDIOCENTRO'
    WHEN 26024997  THEN 'MEDIOCENTRO'
    WHEN 244237    THEN 'DELANTERO'
    WHEN 386272    THEN 'DEFENSA'
    WHEN 13191     THEN 'MEDIOCENTRO'
    WHEN 238321    THEN 'MEDIOCENTRO'
    WHEN 237973    THEN 'PORTERO'
    WHEN 714048    THEN 'DELANTERO'
    WHEN 1047158   THEN 'MEDIOCENTRO'
    WHEN 400055    THEN 'DEFENSA'
    WHEN 13451393  THEN 'DEFENSA'
    WHEN 588412    THEN 'DEFENSA'
    WHEN 424911    THEN 'MEDIOCENTRO'
    WHEN 13682     THEN 'DEFENSA'
    WHEN 4972114   THEN 'DELANTERO'
    WHEN 892324    THEN 'DELANTERO'
    WHEN 238674    THEN 'DEFENSA'
    WHEN 328180    THEN 'PORTERO'
    WHEN 13190     THEN 'DELANTERO'
  END,
  position_code = CASE id
    WHEN 5024606   THEN 'POR'
    WHEN 1149729   THEN 'DEL'
    WHEN 799875    THEN 'CEN'
    WHEN 1134528   THEN 'DEF'
    WHEN 631418    THEN 'DEL'
    WHEN 2799840   THEN 'DEL'
    WHEN 745455    THEN 'CEN'
    WHEN 26024997  THEN 'CEN'
    WHEN 244237    THEN 'DEL'
    WHEN 386272    THEN 'DEF'
    WHEN 13191     THEN 'CEN'
    WHEN 238321    THEN 'CEN'
    WHEN 237973    THEN 'POR'
    WHEN 714048    THEN 'DEL'
    WHEN 1047158   THEN 'CEN'
    WHEN 400055    THEN 'DEF'
    WHEN 13451393  THEN 'DEF'
    WHEN 588412    THEN 'DEF'
    WHEN 424911    THEN 'CEN'
    WHEN 13682     THEN 'DEF'
    WHEN 4972114   THEN 'DEL'
    WHEN 892324    THEN 'DEL'
    WHEN 238674    THEN 'DEF'
    WHEN 328180    THEN 'POR'
    WHEN 13190     THEN 'DEL'
  END
WHERE id IN (
  5024606, 1149729, 799875, 1134528, 631418, 2799840,
  745455, 26024997, 244237, 386272, 13191, 238321,
  237973, 714048, 1047158, 400055, 13451393, 588412,
  424911, 13682, 4972114, 892324, 238674, 328180, 13190
);
