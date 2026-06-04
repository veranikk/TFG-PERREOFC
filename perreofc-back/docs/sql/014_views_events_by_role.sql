-- SQL migration or seed script for the backend database: 014 views events by role.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 014_views_events_by_role.sql
-- Sustituye v_events_with_visibility por vistas separadas por rol
-- y una vista global sin filtro de visibilidad (para admins).
-- ============================================================

DROP VIEW IF EXISTS public.v_events_with_visibility;

-- Eventos visibles solo para aficionados
CREATE VIEW public.v_events_aficionado AS
SELECT e.*
FROM public.events e
JOIN public.event_visibility ev ON ev.event_id = e.id
WHERE e.deleted_at IS NULL
  AND ev.role = 'aficionado';

-- Eventos visibles solo para jugadores
CREATE VIEW public.v_events_jugador AS
SELECT e.*
FROM public.events e
JOIN public.event_visibility ev ON ev.event_id = e.id
WHERE e.deleted_at IS NULL
  AND ev.role = 'jugador';

-- Todos los eventos sin filtro de visibilidad (uso interno / admin)
CREATE VIEW public.v_events_all AS
SELECT e.*
FROM public.events e
WHERE e.deleted_at IS NULL;
