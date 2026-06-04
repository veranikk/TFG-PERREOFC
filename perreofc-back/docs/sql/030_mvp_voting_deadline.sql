-- SQL migration or seed script for the backend database: 030 mvp voting deadline.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- 030_mvp_voting_deadline.sql
-- Añade un plazo de votación MVP por partido y horas configurables en points_config

-- Columna en matches: se rellena automáticamente con el primer voto (NOW() + mvp_voting_hours)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mvp_voting_deadline TIMESTAMPTZ;

-- Columna en points_config: cuántas horas dura la votación MVP tras el partido (default 48h)
ALTER TABLE points_config ADD COLUMN IF NOT EXISTS mvp_voting_hours INTEGER NOT NULL DEFAULT 48;
