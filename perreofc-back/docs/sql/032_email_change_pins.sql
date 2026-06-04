-- SQL migration or seed script for the backend database: 032 email change pins.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- 032_email_change_pins.sql
-- Tabla para el flujo de cambio de correo en dos pasos (aficionados):
--   step 1: PIN enviado al correo actual para verificar identidad
--   step 2: PIN enviado al correo nuevo para verificarlo

CREATE TABLE IF NOT EXISTS email_change_pins (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_email  text        NOT NULL,
  step       text        NOT NULL CHECK (step IN ('identity_pending', 'email_pending')),
  pin_hash   text        NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Solo el propio usuario puede leer su fila (RLS en caso de que la tabla esté expuesta)
ALTER TABLE email_change_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_change_pins_owner" ON email_change_pins
  FOR ALL USING (auth.uid() = user_id);
