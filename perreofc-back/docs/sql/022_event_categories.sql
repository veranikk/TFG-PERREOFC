-- SQL migration or seed script for the backend database: 022 event categories.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Tabla de tipos de evento (catálogo visual: nombre display + color)
-- Incluye los tipos fijos del sistema + permite tipos personalizados
CREATE TABLE event_categories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(50) NOT NULL,
    color      VARCHAR(7)  NOT NULL,
    slug       VARCHAR(50),           -- coincide con el valor del enum para tipos fijos, NULL para custom
    is_system  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT event_categories_name_unique UNIQUE (name)
);

-- Seeds: tipos fijos del sistema
INSERT INTO event_categories (name, color, slug, is_system) VALUES
  ('Partido',         '#FE6128', 'match',    TRUE),
  ('Amistoso',        '#FE6128', 'friendly', TRUE),
  ('Entrenamiento',   '#3AAA35', 'training', TRUE),
  ('Médico',          '#EC4899', 'medical',  TRUE),
  ('Cena',            '#8B5CF6', 'dinner',   TRUE),
  ('Reunión',         '#75A8E0', 'meeting',  TRUE),
  ('Otro',            '#9F9CA5', 'other',    TRUE);

-- Cambiar events.type de enum a VARCHAR para soportar tipos dinámicos
ALTER TABLE events
  ALTER COLUMN type TYPE VARCHAR(50) USING type::TEXT;

-- Campos de recurrencia
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS recurrence_type     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
