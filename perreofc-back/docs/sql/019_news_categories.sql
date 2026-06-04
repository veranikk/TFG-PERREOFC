-- SQL migration or seed script for the backend database: 019 news categories.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- Migration 019: tabla news_categories + seed
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE news_categories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(50) NOT NULL,
    color      VARCHAR(7)  NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT news_categories_name_unique UNIQUE (name)
);

CREATE INDEX idx_news_categories_name ON news_categories (name);

-- Seed con las categorías existentes (colores de CATEGORY_COLORS del frontend)
INSERT INTO news_categories (name, color) VALUES
    ('VICTORIA',   '#3AAA35'),
    ('DERROTA',    '#EF4444'),
    ('EMPATE',     '#9F9CA5'),
    ('CRÓNICA',    '#FE6128'),
    ('ANÁLISIS',   '#75A8E0'),
    ('ENTREVISTA', '#8B5CF6'),
    ('FICHAJE',    '#F59E0B'),
    ('CLUB',       '#9F9CA5'),
    ('PREVIA',     '#75A8E0'),
    ('EN DIRECTO', '#EF4444'),
    ('PARTIDO',    '#FE6128');
