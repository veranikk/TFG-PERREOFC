-- SQL migration or seed script for the backend database: 034 email change redesign.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- 034_email_change_redesign.sql
-- Rediseño del flujo de cambio de correo:
--   - Elimina la tabla email_change_pins (flujo de 3 pasos)
--   - Crea email_change_requests (PIN al nuevo correo, solo 2 pasos)
--   - Crea email_change_attempts (rate limiting: 3 cambios exitosos/24h)

DROP TABLE IF EXISTS email_change_pins;

-- Petición pendiente de cambio de correo (un único PIN activo por usuario)
CREATE TABLE IF NOT EXISTS email_change_requests (
  user_id     uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email   text        NOT NULL,
  pin_hash    text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_change_requests_owner" ON email_change_requests
  FOR ALL USING (auth.uid() = user_id);

-- Registro de intentos para rate limiting
CREATE TABLE IF NOT EXISTS email_change_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email    text,
  success      boolean     NOT NULL DEFAULT false,
  reason       text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_change_attempts_user_id_idx
  ON email_change_attempts (user_id, attempted_at DESC);

ALTER TABLE email_change_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_change_attempts_owner" ON email_change_attempts
  FOR ALL USING (auth.uid() = user_id);
