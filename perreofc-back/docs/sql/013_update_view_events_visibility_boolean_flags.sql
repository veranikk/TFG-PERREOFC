-- SQL migration or seed script for the backend database: 013 update view events visibility boolean flags.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 013_update_view_events_visibility_boolean_flags.sql
-- Reemplaza v_events_with_visibility para incluir flags booleanos
-- por rol, facilitando filtros directos en queries.
-- ============================================================

DROP VIEW IF EXISTS public.v_events_with_visibility;

CREATE VIEW public.v_events_with_visibility AS
SELECT
  e.*,
  array_agg(ev.role::text) AS visible_for_roles,
  CASE WHEN array_agg(ev.role::text) @> ARRAY['aficionado']  THEN true ELSE false END AS visible_aficionado,
  CASE WHEN array_agg(ev.role::text) @> ARRAY['jugador']     THEN true ELSE false END AS visible_jugador,
  CASE WHEN array_agg(ev.role::text) @> ARRAY['admin']       THEN true ELSE false END AS visible_admin,
  CASE WHEN array_agg(ev.role::text) @> ARRAY['superadmin']  THEN true ELSE false END AS visible_superadmin
FROM public.events e
LEFT JOIN public.event_visibility ev ON ev.event_id = e.id
WHERE e.deleted_at IS NULL
GROUP BY e.id;
