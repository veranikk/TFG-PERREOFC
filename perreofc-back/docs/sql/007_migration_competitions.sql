-- SQL migration or seed script for the backend database: 007 migration competitions.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- =============================================================================
-- competitions module — migración INCREMENTAL (solo ALTER TABLE)
-- Tus tablas ya existen. Este script solo añade columnas que faltan.
-- Ejecutar en el SQL Editor de Supabase.
-- Guardar en db/migrations/00X_competitions_module.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SEASONS — añadir start_date, end_date
-- ---------------------------------------------------------------------------

ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date   DATE;

-- Rellenar las tres temporadas conocidas
INSERT INTO seasons (id, name, start_date, end_date, is_current) VALUES
  (21, '2025-2026', '2025-07-01', '2026-06-30', true),
  (20, '2024-2025', '2024-07-01', '2025-06-30', false),
  (19, '2023-2024', '2023-06-29', '2024-06-30', false)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date   = EXCLUDED.end_date,
  is_current = EXCLUDED.is_current;

-- Solo una temporada activa
CREATE UNIQUE INDEX IF NOT EXISTS seasons_is_current_unique
  ON seasons (is_current) WHERE is_current = true;

-- ---------------------------------------------------------------------------
-- 2. GAME_TYPES — tabla nueva (catálogo estático)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_types (
  id    SMALLINT PRIMARY KEY,
  name  VARCHAR(30) NOT NULL
);

INSERT INTO game_types (id, name) VALUES
  (1, 'Futbol-11'),
  (2, 'Futbol-7'),
  (3, 'Fútbol Sala'),
  (4, 'Fútbol-5'),
  (5, 'Fútbol-Playa')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ---------------------------------------------------------------------------
-- 3. COMPETITIONS — añadir columnas de metadatos de rffm
--    Tu tabla ya tiene: id, name, type, season_id
-- ---------------------------------------------------------------------------

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS game_type_id          SMALLINT REFERENCES game_types(id),
  ADD COLUMN IF NOT EXISTS category_id           BIGINT,
  ADD COLUMN IF NOT EXISTS category_name         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS group_category_id     BIGINT,
  ADD COLUMN IF NOT EXISTS group_category_name   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS is_active             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date            DATE,
  ADD COLUMN IF NOT EXISTS end_date              DATE,
  ADD COLUMN IF NOT EXISTS display_order         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_win            SMALLINT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS points_draw           SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS points_loss           SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_minutes         SMALLINT NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS num_parts             SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS show_scorers          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_player_stats     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_standings        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS scraped_at            TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_competitions_season   ON competitions (season_id);
CREATE INDEX IF NOT EXISTS idx_competitions_active   ON competitions (season_id, is_active);
CREATE INDEX IF NOT EXISTS idx_competitions_gametype ON competitions (game_type_id);

-- ---------------------------------------------------------------------------
-- 4. COMPETITION_GROUPS — añadir season_name y competition_type
--    Tu tabla ya tiene: id, competition_id, name
--    OJO: competition_type es el enum 'liga'|'copa' que ya tienes en competitions
-- ---------------------------------------------------------------------------

ALTER TABLE competition_groups
  ADD COLUMN IF NOT EXISTS season_name      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS competition_type VARCHAR(10)
    CHECK (competition_type IN ('liga', 'copa')),
  ADD COLUMN IF NOT EXISTS scraped_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_groups_competition ON competition_groups (competition_id);

-- ---------------------------------------------------------------------------
-- 5. MATCHES — añadir columnas de rffm que faltan
--    Tu tabla ya tiene casi todo. Añadimos:
--      - round_number (jornada como entero, tu round_id es UUID para otra cosa)
--      - external_home_team_id / external_away_team_id (código rffm, para reconciliar FK)
--      - group_id (FK a competition_groups)
--      - competition_id (desnormalizado para queries rápidas)
--      - scraped_at
--    OJO: tu columna se llama home_score/away_score, no home_goals/away_goals
--         y date (no match_date), time (no match_time) — el scraper ya mapea a esto
-- ---------------------------------------------------------------------------

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS group_id               INTEGER REFERENCES competition_groups(id),
  ADD COLUMN IF NOT EXISTS competition_id         INTEGER,
  ADD COLUMN IF NOT EXISTS round_number           SMALLINT,
  ADD COLUMN IF NOT EXISTS external_home_team_id  BIGINT,
  ADD COLUMN IF NOT EXISTS external_away_team_id  BIGINT,
  ADD COLUMN IF NOT EXISTS scraped_at             TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_matches_group          ON matches (group_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition    ON matches (competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_date           ON matches (date);
CREATE INDEX IF NOT EXISTS idx_matches_group_round    ON matches (group_id, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_ext_home       ON matches (external_home_team_id)
  WHERE external_home_team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_ext_away       ON matches (external_away_team_id)
  WHERE external_away_team_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. RLS — lectura pública para las tablas nuevas
-- ---------------------------------------------------------------------------

ALTER TABLE game_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read game_types" ON game_types;
CREATE POLICY "public read game_types" ON game_types FOR SELECT USING (true);

-- Las demás (competitions, competition_groups, matches, seasons) asumimos
-- que ya tienen sus políticas de lectura pública del schema inicial.
-- Si no las tienen, descomenta:
-- ALTER TABLE competitions      ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read competitions"       ON competitions       FOR SELECT USING (true);
-- ALTER TABLE competition_groups ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read competition_groups" ON competition_groups FOR SELECT USING (true);
