-- SQL migration or seed script for the backend database: 023 kit designs redesign.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Migration 023: redesign kit_designs table
-- Replace scraper-populated CSS/color columns with clean name+hex fields.
-- Rows will be inserted manually by the admin via Supabase dashboard.

ALTER TABLE kit_designs
  DROP COLUMN IF EXISTS shirt_color,
  DROP COLUMN IF EXISTS shirt_color1,
  DROP COLUMN IF EXISTS shirt_color2,
  DROP COLUMN IF EXISTS shirt_type_code,
  DROP COLUMN IF EXISTS shirt_css_class,
  DROP COLUMN IF EXISTS shorts_color,
  DROP COLUMN IF EXISTS shorts_color1,
  DROP COLUMN IF EXISTS shorts_css_class,
  DROP COLUMN IF EXISTS socks_color,
  DROP COLUMN IF EXISTS socks_color1,
  DROP COLUMN IF EXISTS socks_css_class,

  ADD COLUMN IF NOT EXISTS shirt1      VARCHAR(50),   -- ej. 'blanca'
  ADD COLUMN IF NOT EXISTS shirt1_hex  VARCHAR(10),   -- ej. '#FFFFFF'
  ADD COLUMN IF NOT EXISTS shirt2      VARCHAR(50),   -- ej. 'naranja'
  ADD COLUMN IF NOT EXISTS shirt2_hex  VARCHAR(10),   -- ej. '#FF6B00'
  ADD COLUMN IF NOT EXISTS short1      VARCHAR(50),   -- ej. 'negro'
  ADD COLUMN IF NOT EXISTS short1_hex  VARCHAR(10),   -- ej. '#000000'
  ADD COLUMN IF NOT EXISTS short2      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS short2_hex  VARCHAR(10),
  ADD COLUMN IF NOT EXISTS socks       VARCHAR(50),   -- ej. 'blancos'
  ADD COLUMN IF NOT EXISTS socks_hex   VARCHAR(10);   -- ej. '#FFFFFF'
