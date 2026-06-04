-- SQL migration or seed script for the backend database: 021 squad call kit colors.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Migration 021: add kit color choices to match_squad_calls
-- Stores per-piece color selection so any kit combination can be saved
-- independently of kit_slot (which is kept for backwards compat)

alter table match_squad_calls
  add column if not exists shirt_color  varchar(50),
  add column if not exists shorts_color varchar(50),
  add column if not exists socks_color  varchar(50);
