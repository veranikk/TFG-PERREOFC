-- SQL migration or seed script for the backend database: 012 views events players classification scorers.
-- Run it in order with the rest of the SQL files so Supabase schema changes stay consistent.

-- ============================================================
-- 012_views_events_players_classification_scorers.sql
-- Crea vistas iniciales para eventos con visibilidad, jugadores
-- completos, clasificación y goleadores.
-- ============================================================

-- Vista: eventos con sus roles de visibilidad agregados
CREATE VIEW public.v_events_with_visibility AS
SELECT
  e.*,
  array_agg(ev.role) AS visible_for_roles
FROM public.events e
LEFT JOIN public.event_visibility ev ON ev.event_id = e.id
WHERE e.deleted_at IS NULL
GROUP BY e.id;

-- Vista: jugadores con stats completos de temporada
CREATE VIEW public.v_players_full AS
SELECT
  p.id,
  p.full_name,
  p.first_name,
  p.last_name,
  p.birth_year,
  p.photo_url,
  p.is_goalkeeper,
  t.name AS team_name,
  tp.dorsal,
  tp.position,
  s.name AS season_name,
  pss.matches_played,
  pss.matches_starting,
  pss.matches_substitute,
  pss.goals_total,
  pss.goals_avg,
  pss.minutes_total,
  pss.yellow_cards,
  pss.red_cards,
  pss.double_yellow_cards
FROM public.players p
LEFT JOIN public.team_players tp ON tp.player_id = p.id
LEFT JOIN public.teams t ON t.id = tp.team_id
LEFT JOIN public.seasons s ON s.id = tp.season_id
LEFT JOIN public.player_season_stats pss ON (
  pss.player_id = p.id AND
  pss.team_id = tp.team_id AND
  pss.season_id = tp.season_id
);

-- Vista: clasificación completa con datos de grupo, competición y temporada
CREATE VIEW public.v_classification_full AS
SELECT
  ce.id,
  ce.position,
  ce.team_name,
  ce.team_shield_url,
  ce.pj,
  ce.wins,
  ce.draws,
  ce.losses,
  ce.goals_for,
  ce.goals_against,
  ce.pts,
  ce.pts_sanction,
  ce.round_number,
  ce.round_date,
  cg.name AS group_name,
  c.name AS competition_name,
  c.type AS competition_type,
  s.name AS season_name
FROM public.classification_entries ce
JOIN public.competition_groups cg ON cg.id = ce.group_id
JOIN public.competitions c ON c.id = cg.competition_id
JOIN public.seasons s ON s.id = c.season_id;

-- Vista: goleadores completos con datos de grupo, competición y temporada
CREATE VIEW public.v_top_scorers_full AS
SELECT
  ts.id,
  ts.position,
  ts.player_name,
  ts.player_photo_url,
  ts.team_name,
  ts.team_shield_url,
  ts.matches_played,
  ts.goals,
  ts.penalty_goals,
  ts.goals_per_match,
  ts.snapshot_date,
  cg.name AS group_name,
  c.name AS competition_name,
  s.name AS season_name
FROM public.top_scorers ts
JOIN public.competition_groups cg ON cg.id = ts.group_id
JOIN public.competitions c ON c.id = cg.competition_id
JOIN public.seasons s ON s.id = c.season_id;
