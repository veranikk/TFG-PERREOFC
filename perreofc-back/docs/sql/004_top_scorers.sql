-- SQL migration or seed script for the backend database: 004 top scorers.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

CREATE TABLE top_scorers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id INTEGER NOT NULL REFERENCES competition_groups(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  position SMALLINT NOT NULL CHECK (position > 0),

  -- Jugador
  external_player_id INTEGER NOT NULL,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name VARCHAR(200) NOT NULL,
  player_photo_url TEXT,

  -- Equipo
  external_team_id INTEGER NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  team_name VARCHAR(200) NOT NULL,
  team_shield_url TEXT,

  -- Estadísticas (acumulado de la temporada en ese momento)
  matches_played SMALLINT NOT NULL DEFAULT 0,
  goals SMALLINT NOT NULL DEFAULT 0,
  penalty_goals SMALLINT NOT NULL DEFAULT 0,
  goals_per_match DECIMAL(4,2),

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT top_scorers_unique UNIQUE (group_id, snapshot_date, position)
);

CREATE INDEX idx_top_scorers_group_date ON top_scorers (group_id, snapshot_date DESC);
CREATE INDEX idx_top_scorers_player ON top_scorers (external_player_id);
CREATE INDEX idx_top_scorers_team ON top_scorers (external_team_id);