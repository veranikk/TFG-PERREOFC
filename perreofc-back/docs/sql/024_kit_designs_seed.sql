-- SQL migration or seed script for the backend database: 024 kit designs seed.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Seed: equipaciones del equipo 24141910 (Perreo FC)
-- kit_number 1 = titular, kit_number 2 = alternativa (si se añade en el futuro)

INSERT INTO kit_designs (team_id, kit_number, shirt1, shirt1_hex, shirt2, shirt2_hex, short1, short1_hex, short2, short2_hex, socks, socks_hex)
VALUES (
  24141910,
  1,
  'naranja', '#FF6B00',   -- camiseta 1
  'blanca',  '#FFFFFF',   -- camiseta 2
  'naranja', '#FF6B00',   -- pantalón 1
  'negro',   '#000000',   -- pantalón 2
  'blancos', '#FFFFFF'    -- calcetines (única opción)
)
ON CONFLICT (team_id, kit_number) DO UPDATE SET
  shirt1     = EXCLUDED.shirt1,
  shirt1_hex = EXCLUDED.shirt1_hex,
  shirt2     = EXCLUDED.shirt2,
  shirt2_hex = EXCLUDED.shirt2_hex,
  short1     = EXCLUDED.short1,
  short1_hex = EXCLUDED.short1_hex,
  short2     = EXCLUDED.short2,
  short2_hex = EXCLUDED.short2_hex,
  socks      = EXCLUDED.socks,
  socks_hex  = EXCLUDED.socks_hex;
