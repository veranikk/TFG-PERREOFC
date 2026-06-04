-- SQL migration or seed script for the backend database: 026 change password.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================
-- 1. TABLA DE INTENTOS DE CAMBIO DE CONTRASEÑA
-- ============================================
CREATE TABLE IF NOT EXISTS public.password_change_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_change_attempts_user_id 
  ON public.password_change_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_attempts_timestamp 
  ON public.password_change_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_change_attempts_user_timestamp 
  ON public.password_change_attempts(user_id, attempted_at DESC);

-- ============================================
-- 2. TABLA DE INTENTOS DE RESET DE CONTRASEÑA
-- ============================================
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_timestamp 
  ON public.password_reset_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip_timestamp 
  ON public.password_reset_attempts(ip_address, attempted_at DESC);

-- ============================================
-- 3. RPC PARA CAMBIAR CONTRASEÑA
-- ============================================
CREATE OR REPLACE FUNCTION public.change_user_password(new_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticación
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validar contraseña
  IF new_password IS NULL OR new_password = '' THEN
    RETURN json_build_object('error', 'Password cannot be empty');
  END IF;

  IF length(new_password) < 8 THEN
    RETURN json_build_object('error', 'Password must be at least 8 characters');
  END IF;

  -- Actualizar contraseña (bcrypt)
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  -- Registrar en audit_logs si existe la tabla
  INSERT INTO public.system_logs (action, entity_type, entity_id, user_id, username, details)
  VALUES (
    'PASSWORD_CHANGED',
    'user',
    v_user_id::text,
    v_user_id,
    (SELECT username FROM public.users WHERE id = v_user_id),
    json_build_object('timestamp', NOW())::text
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.change_user_password(TEXT) TO authenticated;

-- ============================================
-- 4. PERMISOS EN LAS TABLAS
-- ============================================
GRANT INSERT ON public.password_change_attempts TO authenticated;
GRANT INSERT ON public.password_reset_attempts TO anon, authenticated;
GRANT SELECT ON public.password_change_attempts TO authenticated;

-- ============================================
-- 5. ENABLE RLS (Row Level Security)
-- ============================================
ALTER TABLE public.password_change_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- RLS: Los usuarios solo ven sus propios intentos
CREATE POLICY "Users see own password change attempts"
  ON public.password_change_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Cualquiera puede insertar intentos de reset
CREATE POLICY "Anyone can insert password reset attempts"
  ON public.password_reset_attempts
  FOR INSERT
  WITH CHECK (true);