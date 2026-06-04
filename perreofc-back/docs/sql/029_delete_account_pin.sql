-- SQL migration or seed script for the backend database: 029 delete account pin.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================
-- 1. TABLA DE PINS DE ELIMINACIÓN DE CUENTA
-- ============================================
CREATE TABLE IF NOT EXISTS public.delete_account_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Un único PIN activo por usuario (upsert por user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_delete_account_pins_user
  ON public.delete_account_pins(user_id);

CREATE INDEX IF NOT EXISTS idx_delete_account_pins_expires
  ON public.delete_account_pins(expires_at);

-- ============================================
-- 2. PERMISOS
-- ============================================
-- Solo el service_role (admin client) puede operar esta tabla
REVOKE ALL ON public.delete_account_pins FROM anon, authenticated;

-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE public.delete_account_pins ENABLE ROW LEVEL SECURITY;

-- Sin políticas públicas: solo el service_role accede via admin client
