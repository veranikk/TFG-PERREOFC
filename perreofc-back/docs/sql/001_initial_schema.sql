-- SQL migration or seed script for the backend database: 001 initial schema.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role         AS ENUM ('aficionado', 'jugador', 'admin', 'superadmin');
CREATE TYPE event_type        AS ENUM ('match', 'friendly', 'training', 'medical', 'dinner', 'meeting', 'other');
CREATE TYPE visibility_role   AS ENUM ('aficionado', 'jugador', 'admin', 'superadmin');
CREATE TYPE match_status      AS ENUM ('upcoming', 'live', 'finished', 'suspended');
CREATE TYPE media_type        AS ENUM ('photo', 'video');
CREATE TYPE match_side        AS ENUM ('home', 'away');
CREATE TYPE bet_prediction    AS ENUM ('home', 'draw', 'away');
CREATE TYPE bet_result        AS ENUM ('pending', 'win', 'loss');
CREATE TYPE kit_slot          AS ENUM ('titular', 'suplente');
CREATE TYPE points_action     AS ENUM ('register', 'daily_login', 'vote_mvp', 'bet', 'win_bet', 'adjustment');
CREATE TYPE competition_type  AS ENUM ('liga', 'copa', 'other');
CREATE TYPE form_result       AS ENUM ('G', 'E', 'P');
CREATE TYPE staff_role        AS ENUM ('entrenador', 'segundo_entrenador', 'delegado', 'auxiliar', 'preparador_fisico', 'otro');

-- ============================================================
-- SEASONS
-- ============================================================

CREATE TABLE seasons (
    id         SMALLINT    PRIMARY KEY,       -- codigo_temporada
    name       VARCHAR(20) NOT NULL UNIQUE,   -- '2025-2026'
    is_current BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ============================================================
-- VENUES
-- ============================================================

CREATE TABLE venues (
    id        INTEGER      PRIMARY KEY,       -- codigo_campo
    name      VARCHAR(200) NOT NULL,
    address   TEXT,
    photo_url TEXT
);

-- ============================================================
-- CLUBS
-- ============================================================

CREATE TABLE clubs (
    id            INTEGER      PRIMARY KEY,   -- codigo_club
    name          VARCHAR(200) NOT NULL,
    shield_url    TEXT,
    email         VARCHAR(255),
    phone         VARCHAR(100),
    address       VARCHAR(255),
    city          VARCHAR(100),
    province      VARCHAR(100),
    postal_code   VARCHAR(10),
    website       VARCHAR(255),
    home_venue_id INTEGER      REFERENCES venues (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
    id             INTEGER      PRIMARY KEY,  -- codigo_equipo
    club_id        INTEGER      NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    category       VARCHAR(100),
    category_code  INTEGER,
    home_venue_id  INTEGER      REFERENCES venues (id) ON DELETE SET NULL,
    home_day       SMALLINT,
    home_schedule  VARCHAR(50),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_club ON teams (club_id);

-- ============================================================
-- KIT DESIGNS
-- ============================================================

CREATE TABLE kit_designs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         INTEGER     NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
    kit_number      SMALLINT    NOT NULL DEFAULT 1,
    shirt_color     VARCHAR(50),
    shorts_color    VARCHAR(50),
    socks_color     VARCHAR(50),
    shirt_type_code SMALLINT,
    shirt_css_class VARCHAR(100),
    shirt_color1    VARCHAR(10),
    shirt_color2    VARCHAR(10),
    shorts_css_class VARCHAR(100),
    shorts_color1   VARCHAR(10),
    socks_css_class VARCHAR(100),
    socks_color1    VARCHAR(10),
    CONSTRAINT kit_designs_unique UNIQUE (team_id, kit_number)
);

-- ============================================================
-- COMPETITIONS
-- ============================================================

CREATE TABLE competitions (
    id        INTEGER          PRIMARY KEY,   -- codigo_competicion
    name      VARCHAR(200)     NOT NULL,
    type      competition_type NOT NULL DEFAULT 'liga',
    season_id SMALLINT         NOT NULL REFERENCES seasons (id) ON DELETE RESTRICT
);

CREATE INDEX idx_competitions_season ON competitions (season_id);

-- ============================================================
-- COMPETITION GROUPS
-- ============================================================

CREATE TABLE competition_groups (
    id             INTEGER      PRIMARY KEY,  -- codgrupo
    competition_id INTEGER      NOT NULL REFERENCES competitions (id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL      -- 'Grupo 20', 'PRIMERA RONDA'
);

CREATE INDEX idx_groups_competition ON competition_groups (competition_id);

-- ============================================================
-- MATCH ROUNDS (Jornadas)
-- ============================================================

CREATE TABLE match_rounds (
    id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id     INTEGER  NOT NULL REFERENCES competition_groups (id) ON DELETE CASCADE,
    round_number SMALLINT NOT NULL,
    round_date   DATE,
    CONSTRAINT rounds_unique UNIQUE (group_id, round_number)
);

CREATE INDEX idx_rounds_group ON match_rounds (group_id);

-- ============================================================
-- PLAYERS
-- ============================================================

CREATE TABLE players (
    id           INTEGER      PRIMARY KEY,    -- codigo_jugador
    full_name    VARCHAR(200) NOT NULL,       -- 'APELLIDO, NOMBRE'
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    birth_year   SMALLINT,
    photo_url    TEXT,
    is_goalkeeper BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAM PLAYERS (Plantilla por temporada)
-- ============================================================

CREATE TABLE team_players (
    id        UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id   INTEGER  NOT NULL REFERENCES teams   (id) ON DELETE CASCADE,
    player_id INTEGER  NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    season_id SMALLINT NOT NULL REFERENCES seasons (id) ON DELETE RESTRICT,
    dorsal    SMALLINT CHECK (dorsal BETWEEN 0 AND 99),
    position  VARCHAR(50),
    CONSTRAINT team_players_unique UNIQUE (team_id, player_id, season_id)
);

CREATE INDEX idx_team_players_team   ON team_players (team_id, season_id);
CREATE INDEX idx_team_players_player ON team_players (player_id);

-- ============================================================
-- PLAYER SEASON STATS (por competición)
-- ============================================================

CREATE TABLE player_season_stats (
    id                   UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id            INTEGER  NOT NULL REFERENCES players      (id) ON DELETE CASCADE,
    team_id              INTEGER  NOT NULL REFERENCES teams        (id) ON DELETE CASCADE,
    competition_id       INTEGER  NOT NULL REFERENCES competitions (id) ON DELETE CASCADE,
    season_id            SMALLINT NOT NULL REFERENCES seasons      (id) ON DELETE RESTRICT,
    matches_called       SMALLINT NOT NULL DEFAULT 0,
    matches_starting     SMALLINT NOT NULL DEFAULT 0,
    matches_substitute   SMALLINT NOT NULL DEFAULT 0,
    matches_played       SMALLINT NOT NULL DEFAULT 0,
    goals_total          SMALLINT NOT NULL DEFAULT 0,
    goals_avg            DECIMAL(5,3) NOT NULL DEFAULT 0,
    minutes_total        INTEGER  NOT NULL DEFAULT 0,
    minutes_avg          DECIMAL(7,2) NOT NULL DEFAULT 0,
    yellow_cards         SMALLINT NOT NULL DEFAULT 0,
    red_cards            SMALLINT NOT NULL DEFAULT 0,
    double_yellow_cards  SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT player_stats_unique UNIQUE (player_id, team_id, competition_id, season_id)
);

CREATE INDEX idx_player_stats_player ON player_season_stats (player_id, season_id);
CREATE INDEX idx_player_stats_team   ON player_season_stats (team_id, season_id);

-- ============================================================
-- STAFF MEMBERS
-- ============================================================

CREATE TABLE staff_members (
    id         INTEGER      PRIMARY KEY,      -- cod_delegado / cod_tecnico / cod_auxiliar
    full_name  VARCHAR(200) NOT NULL,
    photo_url  TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAM STAFF (Cuerpo técnico por temporada)
-- ============================================================

CREATE TABLE team_staff (
    id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id          INTEGER    NOT NULL REFERENCES teams         (id) ON DELETE CASCADE,
    staff_id         INTEGER    NOT NULL REFERENCES staff_members (id) ON DELETE CASCADE,
    season_id        SMALLINT   NOT NULL REFERENCES seasons       (id) ON DELETE RESTRICT,
    role             staff_role NOT NULL,
    role_description VARCHAR(100),
    CONSTRAINT team_staff_unique UNIQUE (team_id, staff_id, season_id, role)
);

-- ============================================================
-- MATCHES (Actas)
-- ============================================================

CREATE TABLE matches (
    id                 INTEGER      PRIMARY KEY,   -- codacta
    round_id           UUID         REFERENCES match_rounds  (id) ON DELETE SET NULL,
    home_team_id       INTEGER      REFERENCES teams         (id) ON DELETE SET NULL,
    away_team_id       INTEGER      REFERENCES teams         (id) ON DELETE SET NULL,
    home_team_name     VARCHAR(200) NOT NULL,
    away_team_name     VARCHAR(200) NOT NULL,
    home_shield_url    TEXT,
    away_shield_url    TEXT,
    home_score         SMALLINT     CHECK (home_score >= 0),
    away_score         SMALLINT     CHECK (away_score >= 0),
    home_penalty_score SMALLINT,
    away_penalty_score SMALLINT,
    status             match_status NOT NULL DEFAULT 'upcoming',
    is_closed          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_suspended       BOOLEAN      NOT NULL DEFAULT FALSE,
    date               DATE         NOT NULL,
    time               TIME,
    venue_id           INTEGER      REFERENCES venues        (id) ON DELETE SET NULL,
    venue_name         VARCHAR(200),
    home_formation     VARCHAR(20),
    away_formation     VARCHAR(20),
    home_delegate      VARCHAR(200),
    home_coach_id      INTEGER      REFERENCES staff_members (id) ON DELETE SET NULL,
    home_coach_name    VARCHAR(200),
    away_coach_id      INTEGER      REFERENCES staff_members (id) ON DELETE SET NULL,
    away_coach_name    VARCHAR(200),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_date      ON matches (date);
CREATE INDEX idx_matches_home_team ON matches (home_team_id);
CREATE INDEX idx_matches_away_team ON matches (away_team_id);
CREATE INDEX idx_matches_round     ON matches (round_id);
CREATE INDEX idx_matches_status    ON matches (status);

-- ============================================================
-- MATCH LINEUP ENTRIES
-- ============================================================

CREATE TABLE match_lineup_entries (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id      INTEGER     NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    side          match_side  NOT NULL,
    player_id     INTEGER     REFERENCES players (id) ON DELETE SET NULL,
    player_name   VARCHAR(200) NOT NULL,
    dorsal        SMALLINT,
    is_starter    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_substitute BOOLEAN     NOT NULL DEFAULT FALSE,
    is_captain    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_goalkeeper BOOLEAN     NOT NULL DEFAULT FALSE,
    position      VARCHAR(50),
    pos_x         DECIMAL(5,2) CHECK (pos_x BETWEEN 0 AND 100),
    pos_y         DECIMAL(5,2) CHECK (pos_y BETWEEN 0 AND 100)
);

CREATE INDEX idx_lineup_match  ON match_lineup_entries (match_id);
CREATE INDEX idx_lineup_player ON match_lineup_entries (player_id);

-- ============================================================
-- MATCH GOALS
-- ============================================================

CREATE TABLE match_goals (
    id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id       INTEGER    NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    side           match_side NOT NULL,
    player_id      INTEGER    REFERENCES players (id) ON DELETE SET NULL,
    player_name    VARCHAR(200) NOT NULL,
    minute         SMALLINT   NOT NULL CHECK (minute > 0),
    goal_type_code SMALLINT   NOT NULL,    -- 100=normal, 101=penalti
    is_own_goal    BOOLEAN    NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_goals_match  ON match_goals (match_id);
CREATE INDEX idx_goals_player ON match_goals (player_id);

-- ============================================================
-- MATCH CARDS
-- ============================================================

CREATE TABLE match_cards (
    id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id       INTEGER    NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    side           match_side NOT NULL,
    player_id      INTEGER    REFERENCES players (id) ON DELETE SET NULL,
    player_name    VARCHAR(200) NOT NULL,
    minute         SMALLINT,
    card_type_code SMALLINT   NOT NULL    -- 100=amarilla, 101=roja, 102=doble amarilla
);

CREATE INDEX idx_cards_match ON match_cards (match_id);

-- ============================================================
-- MATCH STAFF ENTRIES
-- ============================================================

CREATE TABLE match_staff_entries (
    id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id         INTEGER    NOT NULL REFERENCES matches       (id) ON DELETE CASCADE,
    side             match_side NOT NULL,
    staff_id         INTEGER    REFERENCES staff_members (id) ON DELETE SET NULL,
    staff_name       VARCHAR(200) NOT NULL,
    role_description VARCHAR(100)
);

CREATE INDEX idx_match_staff ON match_staff_entries (match_id);

-- ============================================================
-- CLASSIFICATION ENTRIES
-- ============================================================

CREATE TABLE classification_entries (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        INTEGER  NOT NULL REFERENCES competition_groups (id) ON DELETE CASCADE,
    round_number    SMALLINT NOT NULL,
    round_date      DATE,
    position        SMALLINT NOT NULL CHECK (position > 0),
    team_id         INTEGER  REFERENCES teams (id) ON DELETE SET NULL,
    team_name       VARCHAR(200) NOT NULL,
    team_shield_url TEXT,
    pj              SMALLINT NOT NULL DEFAULT 0,
    wins            SMALLINT NOT NULL DEFAULT 0,
    draws           SMALLINT NOT NULL DEFAULT 0,
    losses          SMALLINT NOT NULL DEFAULT 0,
    penalties       SMALLINT NOT NULL DEFAULT 0,
    goals_for       SMALLINT NOT NULL DEFAULT 0,
    goals_against   SMALLINT NOT NULL DEFAULT 0,
    pts             SMALLINT NOT NULL DEFAULT 0,
    pts_sanction    SMALLINT NOT NULL DEFAULT 0,
    pj_home         SMALLINT NOT NULL DEFAULT 0,
    wins_home       SMALLINT NOT NULL DEFAULT 0,
    draws_home      SMALLINT NOT NULL DEFAULT 0,
    losses_home     SMALLINT NOT NULL DEFAULT 0,
    pts_home        SMALLINT NOT NULL DEFAULT 0,
    pj_away         SMALLINT NOT NULL DEFAULT 0,
    wins_away       SMALLINT NOT NULL DEFAULT 0,
    draws_away      SMALLINT NOT NULL DEFAULT 0,
    losses_away     SMALLINT NOT NULL DEFAULT 0,
    pts_away        SMALLINT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT classification_unique UNIQUE (group_id, round_number, position)
);

CREATE INDEX idx_classification_group ON classification_entries (group_id, round_number);
CREATE INDEX idx_classification_team  ON classification_entries (team_id);

-- ============================================================
-- CLASSIFICATION FORM (racha de últimos 5 partidos)
-- ============================================================

CREATE TABLE classification_form (
    classification_entry_id UUID        NOT NULL REFERENCES classification_entries (id) ON DELETE CASCADE,
    position                SMALLINT    NOT NULL CHECK (position BETWEEN 1 AND 5),
    result                  form_result NOT NULL,
    PRIMARY KEY (classification_entry_id, position)
);

-- ============================================================
-- USERS (App interna)
-- ============================================================

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    username      VARCHAR(50)  NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'aficionado',
    avatar_url    TEXT,
    points        INTEGER      NOT NULL DEFAULT 0 CHECK (points >= 0),
    banned        BOOLEAN      NOT NULL DEFAULT FALSE,
    player_id     INTEGER      REFERENCES players (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    CONSTRAINT users_email_unique    UNIQUE (email),
    CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE INDEX idx_users_role      ON users (role)      WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email     ON users (email)     WHERE deleted_at IS NULL;
CREATE INDEX idx_users_player    ON users (player_id) WHERE deleted_at IS NULL;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE notification_preferences (
    user_id         UUID        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    push_enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
    email_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
    match_reminders BOOLEAN     NOT NULL DEFAULT TRUE,
    news_updates    BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTS (Calendario interno)
-- ============================================================

CREATE TABLE events (
    id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    type        event_type NOT NULL,
    date        DATE       NOT NULL,
    time        TIME,
    location    VARCHAR(255),
    match_id    INTEGER    REFERENCES matches (id) ON DELETE SET NULL,
    created_by  UUID       REFERENCES users   (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_events_date  ON events (date)     WHERE deleted_at IS NULL;
CREATE INDEX idx_events_match ON events (match_id) WHERE deleted_at IS NULL;

-- ============================================================
-- EVENT VISIBILITY
-- ============================================================

CREATE TABLE event_visibility (
    event_id UUID            NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    role     visibility_role NOT NULL,
    PRIMARY KEY (event_id, role)
);

-- ============================================================
-- NEWS ARTICLES
-- ============================================================

CREATE TABLE news_articles (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(500) NOT NULL,
    body         TEXT         NOT NULL,
    image_url    TEXT,
    category     VARCHAR(50)  NOT NULL,
    author_id    UUID         REFERENCES users (id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    is_featured  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_news_published ON news_articles (published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_news_category  ON news_articles (category)          WHERE deleted_at IS NULL;

-- ============================================================
-- MEDIA IMAGES
-- ============================================================

CREATE TABLE media_images (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    description   TEXT,
    location      VARCHAR(255),
    type          media_type  NOT NULL DEFAULT 'photo',
    taken_at      TIMESTAMPTZ,
    uploaded_by   UUID        REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_media_taken ON media_images (taken_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- POINTS CONFIG (singleton)
-- ============================================================

CREATE TABLE points_config (
    id          SMALLINT    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    register    INTEGER     NOT NULL DEFAULT 100  CHECK (register    >= 0),
    daily_login INTEGER     NOT NULL DEFAULT 10   CHECK (daily_login >= 0),
    vote_mvp    INTEGER     NOT NULL DEFAULT 50   CHECK (vote_mvp    >= 0),
    bet         INTEGER     NOT NULL DEFAULT 0    CHECK (bet         >= 0),
    win_bet     INTEGER     NOT NULL DEFAULT 200  CHECK (win_bet     >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID        REFERENCES users (id) ON DELETE SET NULL
);

INSERT INTO points_config (id) VALUES (1);

-- ============================================================
-- POINTS TRANSACTIONS
-- ============================================================

CREATE TABLE points_transactions (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount         INTEGER       NOT NULL,
    action         points_action NOT NULL,
    reference_id   TEXT,         -- TEXT soporta UUID e INTEGER
    reference_type VARCHAR(50),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_user   ON points_transactions (user_id, created_at DESC);
CREATE INDEX idx_points_action ON points_transactions (action);

-- ============================================================
-- MVP VOTES
-- ============================================================

CREATE TABLE mvp_votes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
    match_id   INTEGER     NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    player_id  INTEGER     NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mvp_votes_unique UNIQUE (user_id, match_id)
);

CREATE INDEX idx_mvp_match ON mvp_votes (match_id);

-- ============================================================
-- USER BETS
-- ============================================================

CREATE TABLE user_bets (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID           NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
    match_id       INTEGER        NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    prediction     bet_prediction NOT NULL,
    points_wagered INTEGER        NOT NULL CHECK (points_wagered > 0),
    points_won     INTEGER,
    result         bet_result     NOT NULL DEFAULT 'pending',
    settled_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT user_bets_unique UNIQUE (user_id, match_id)
);

CREATE INDEX idx_bets_match ON user_bets (match_id);
CREATE INDEX idx_bets_user  ON user_bets (user_id);

-- ============================================================
-- SYSTEM LOGS
-- ============================================================

CREATE TABLE system_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   TEXT,        -- polimórfico (UUID o INTEGER según entidad)
    user_id     UUID         REFERENCES users (id) ON DELETE SET NULL,
    username    VARCHAR(50)  NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_action  ON system_logs (action);
CREATE INDEX idx_logs_user    ON system_logs (user_id);
CREATE INDEX idx_logs_created ON system_logs (created_at DESC);
CREATE INDEX idx_logs_entity  ON system_logs (entity_type, entity_id);