-- SQL migration or seed script for the backend database: 028 view published news.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 028_view_published_news.sql
-- Crea una vista de noticias publicadas y no eliminadas para
-- uso en n8n y acceso público. Admin y Superadmin siguen
-- usando la tabla base news_articles para acceso completo.
-- ============================================================

-- Vista: noticias publicadas (sin borrar, con fecha de publicación pasada)
CREATE VIEW public.v_published_news AS
SELECT *
FROM public.news_articles
WHERE deleted_at IS NULL
  AND published_at IS NOT NULL
  AND published_at <= now();