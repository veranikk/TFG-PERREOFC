-- SQL migration or seed script for the backend database: 005 migration users.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Esto BORRA todos los datos existentes en users y tablas dependientes.
-- Como tienes solo datos de prueba, no pasa nada.
TRUNCATE TABLE users CASCADE;

-- 1. Eliminar password_hash (lo gestiona Supabase Auth)
ALTER TABLE users DROP COLUMN password_hash;

-- 2. Eliminar email (vive en auth.users.email; lo lees del JWT o JOIN)
ALTER TABLE users DROP COLUMN email;

-- 3. Vincular users.id a auth.users.id
ALTER TABLE users
  ADD CONSTRAINT users_id_fk_auth FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Añadir last_login_at (lo usaremos para el daily bonus)
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

-- 5. Añadir banned_reason (para auditoría, lo pide el endpoint de ban)
ALTER TABLE users ADD COLUMN banned_reason TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      (NEW.raw_app_meta_data->>'role')::user_role,
      'aficionado'::user_role
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();