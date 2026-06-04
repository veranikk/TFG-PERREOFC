-- SQL migration or seed script for the backend database: 018 news remove read time rename featured.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- Migration 018: news_articles — quitar read_time_minutes,
--                renombrar featured → is_featured
-- ============================================================
-- Ejecutar en Supabase SQL Editor

ALTER TABLE news_articles
  DROP COLUMN IF EXISTS read_time_minutes;

ALTER TABLE news_articles
  RENAME COLUMN featured TO is_featured;
