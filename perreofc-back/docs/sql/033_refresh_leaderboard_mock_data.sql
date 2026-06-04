-- SQL migration or seed script for the backend database: 033 refresh leaderboard mock data.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 033_refresh_leaderboard_mock_data.sql
-- Refresca las transacciones semanales y mensuales de los
-- usuarios mock del leaderboard para la semana y mes actuales.
-- Ejecutar en Supabase SQL Editor cuando los datos expiren.
-- ============================================================

-- Limpiar transacciones semanales/mensuales previas de los mocks
DELETE FROM public.points_transactions
WHERE user_id::text LIKE 'aa000001-0000-0000-0000-0000000000%'
  AND action IN ('daily_login', 'vote_mvp')
  AND created_at >= date_trunc('month', now() - interval '1 month');

-- ── Transacciones del MES ACTUAL (leaderboard mensual) ────────
INSERT INTO public.points_transactions (user_id, amount, action, created_at) VALUES
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 50,  'vote_mvp',    date_trunc('month', now()) + '3 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('month', now()) + '4 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 50,  'vote_mvp',    date_trunc('month', now()) + '5 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 200, 'win_bet',     date_trunc('month', now()) + '6 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('month', now()) + '7 days'::interval),
  ('aa000001-0000-0000-0000-000000000001', 50,  'vote_mvp',    date_trunc('month', now()) + '8 days'::interval),
  ('aa000001-0000-0000-0000-000000000002', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000002', 10,  'daily_login', date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000002', 50,  'vote_mvp',    date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000002', 10,  'daily_login', date_trunc('month', now()) + '3 days'::interval),
  ('aa000001-0000-0000-0000-000000000002', 200, 'win_bet',     date_trunc('month', now()) + '4 days'::interval),
  ('aa000001-0000-0000-0000-000000000002', 10,  'daily_login', date_trunc('month', now()) + '5 days'::interval),
  ('aa000001-0000-0000-0000-000000000002', 50,  'vote_mvp',    date_trunc('month', now()) + '6 days'::interval),
  ('aa000001-0000-0000-0000-000000000003', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000003', 50,  'vote_mvp',    date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000003', 10,  'daily_login', date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000003', 200, 'win_bet',     date_trunc('month', now()) + '4 days'::interval),
  ('aa000001-0000-0000-0000-000000000003', 10,  'daily_login', date_trunc('month', now()) + '5 days'::interval),
  ('aa000001-0000-0000-0000-000000000004', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000004', 50,  'vote_mvp',    date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000004', 10,  'daily_login', date_trunc('month', now()) + '4 days'::interval),
  ('aa000001-0000-0000-0000-000000000004', 200, 'win_bet',     date_trunc('month', now()) + '6 days'::interval),
  ('aa000001-0000-0000-0000-000000000005', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000005', 50,  'vote_mvp',    date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000005', 10,  'daily_login', date_trunc('month', now()) + '3 days'::interval),
  ('aa000001-0000-0000-0000-000000000006', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000006', 50,  'vote_mvp',    date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000007', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000007', 50,  'vote_mvp',    date_trunc('month', now()) + '4 days'::interval),
  ('aa000001-0000-0000-0000-000000000008', 10,  'daily_login', date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000008', 10,  'daily_login', date_trunc('month', now()) + '3 days'::interval),
  ('aa000001-0000-0000-0000-000000000009', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000010', 10,  'daily_login', date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000011', 10,  'daily_login', date_trunc('month', now())),
  ('aa000001-0000-0000-0000-000000000012', 10,  'daily_login', date_trunc('month', now()) + '2 days'::interval),
  ('aa000001-0000-0000-0000-000000000013', 10,  'daily_login', date_trunc('month', now()) + '1 day'::interval),
  ('aa000001-0000-0000-0000-000000000014', 10,  'daily_login', date_trunc('month', now()));

-- ── Transacciones de la SEMANA ACTUAL (leaderboard semanal) ───
INSERT INTO public.points_transactions (user_id, amount, action, created_at) VALUES
  ('aa000001-0000-0000-0000-000000000001', 10,  'daily_login', date_trunc('week', now()) + '1 hour'::interval),
  ('aa000001-0000-0000-0000-000000000001', 200, 'win_bet',     date_trunc('week', now()) + '2 hours'::interval),
  ('aa000001-0000-0000-0000-000000000001', 50,  'vote_mvp',    date_trunc('week', now()) + '3 hours'::interval),
  ('aa000001-0000-0000-0000-000000000003', 10,  'daily_login', date_trunc('week', now()) + '1 hour'::interval),
  ('aa000001-0000-0000-0000-000000000003', 200, 'win_bet',     date_trunc('week', now()) + '4 hours'::interval),
  ('aa000001-0000-0000-0000-000000000002', 10,  'daily_login', date_trunc('week', now()) + '2 hours'::interval),
  ('aa000001-0000-0000-0000-000000000002', 200, 'win_bet',     date_trunc('week', now()) + '5 hours'::interval),
  ('aa000001-0000-0000-0000-000000000005', 10,  'daily_login', date_trunc('week', now()) + '1 hour'::interval),
  ('aa000001-0000-0000-0000-000000000005', 50,  'vote_mvp',    date_trunc('week', now()) + '6 hours'::interval),
  ('aa000001-0000-0000-0000-000000000004', 50,  'vote_mvp',    date_trunc('week', now()) + '2 hours'::interval),
  ('aa000001-0000-0000-0000-000000000004', 10,  'daily_login', date_trunc('week', now()) + '7 hours'::interval),
  ('aa000001-0000-0000-0000-000000000006', 10,  'daily_login', date_trunc('week', now()) + '3 hours'::interval),
  ('aa000001-0000-0000-0000-000000000007', 10,  'daily_login', date_trunc('week', now()) + '4 hours'::interval),
  ('aa000001-0000-0000-0000-000000000009', 10,  'daily_login', date_trunc('week', now()) + '5 hours'::interval),
  ('aa000001-0000-0000-0000-000000000010', 10,  'daily_login', date_trunc('week', now()) + '6 hours'::interval);
