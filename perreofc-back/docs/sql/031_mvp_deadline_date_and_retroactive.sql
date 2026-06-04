-- SQL migration or seed script for the backend database: 031 mvp deadline date and retroactive.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- 031_mvp_deadline_date_and_retroactive.sql
-- Cambia el sistema de plazo MVP: en vez de "horas globales" el admin elige
-- una fecha concreta por partido (cierra a las 23:59 de ese día).

-- 1. Quitar la columna de horas globales que ya no usamos
ALTER TABLE points_config DROP COLUMN IF EXISTS mvp_voting_hours;

-- 2. Marcar todos los partidos finalizados sin deadline como "cerrados":
--    se usa la fecha del partido + 1 día a las 23:59:59, que para partidos
--    de temporadas pasadas ya habrá expirado, y así se muestran como "cerrados".
UPDATE matches
SET mvp_voting_deadline = (date::timestamp + INTERVAL '1 day' + TIME '23:59:59')
WHERE status = 'finished'
  AND mvp_voting_deadline IS NULL;
