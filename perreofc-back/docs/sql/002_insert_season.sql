-- SQL migration or seed script for the backend database: 002 insert season.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

INSERT INTO seasons (id, name, is_current) VALUES (21, '2025-2026', true);