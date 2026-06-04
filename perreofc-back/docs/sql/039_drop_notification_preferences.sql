-- SQL migration or seed script for the backend database: 039 drop notification preferences.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 039: Eliminar tabla notification_preferences (obsoleta)
-- ============================================================
-- Esta tabla fue reemplazada por:
--   - users.notifications_enabled  (migración 035)
--   - users.push_token              (migración 036)
--
-- Ejecutar DESPUÉS de desplegar el backend actualizado
-- (meServices.ts ya no hace queries a notification_preferences).
-- ============================================================
DROP TABLE IF EXISTS public.notification_preferences;
