-- SQL migration or seed script for the backend database: 025 media albums.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Migration 025: media_albums
-- Crea la tabla de álbumes y añade album_id a la tabla media_images existente

-- ── Álbumes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_albums (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  event_date   DATE,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- ── Enlazar media_images con álbumes ─────────────────────────────────────────
ALTER TABLE media_images
  ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES media_albums(id) ON DELETE SET NULL;

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_media_albums_deleted_at  ON media_albums(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_albums_event_date  ON media_albums(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_images_album_id    ON media_images(album_id);
