-- SQL migration or seed script for the backend database: 020 match squad calls.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- Migration 020: match_squad_calls
-- Convocatoria pre-partido creada por admin/superadmin
-- Separada de match_lineup_entries (que se rellena por scraping post-partido)

create table if not exists match_squad_calls (
  id             uuid primary key default gen_random_uuid(),
  match_id       integer not null references matches(id) on delete cascade,
  report_time    text,          -- HH:mm — hora de presentación
  location       text,          -- lugar de presentación (puede diferir del estadio)
  kit_slot       text not null default 'titular' check (kit_slot in ('titular', 'suplente')),
  created_by     uuid not null references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (match_id)              -- una sola convocatoria por partido
);

create table if not exists match_squad_call_players (
  id              uuid primary key default gen_random_uuid(),
  squad_call_id   uuid not null references match_squad_calls(id) on delete cascade,
  player_id       integer not null references players(id) on delete cascade,
  player_name     text not null,
  unique (squad_call_id, player_id)
);

-- RLS: admin client bypasses RLS, no policies needed (we use service role key)
-- Indices para búsquedas frecuentes
create index if not exists idx_squad_calls_match_id on match_squad_calls(match_id);
create index if not exists idx_squad_call_players_squad_call_id on match_squad_call_players(squad_call_id);
create index if not exists idx_squad_call_players_player_id on match_squad_call_players(player_id);
