-- SQL migration or seed script for the backend database: 003 fetch matches.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

ALTER TABLE player_season_stats DROP CONSTRAINT IF EXISTS player_stats_unique;
ALTER TABLE player_season_stats DROP COLUMN IF EXISTS competition_id;
ALTER TABLE player_season_stats
  ADD CONSTRAINT player_stats_unique
  UNIQUE (player_id, team_id, season_id);