/**
 * Contains the business and persistence logic for the home backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { env } from '../../../shared/env.js';
import { getClubShieldsByTeamIds, resolveShield } from '../../../shared/shieldUtils.js';

const OWN_TEAM_ID = env.OWN_TEAM_ID;

/** Obtiene datos de la pantalla home: próximo partido, último resultado, clasificación, goleador y noticias recientes. */
export async function getHome() {
  const supabase = getAdminClient();
  const newsTable = 'news';

  // Ejecutar todas las consultas en paralelo para minimizar latencia
  const [nextMatchRes, lastResultRes, standingRes, topScorerRes, newsRes] = await Promise.all([
    // Próximo partido del Perreo FC (status=upcoming, ordenado por fecha)
    supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_shield_url, away_shield_url, date, time, venue:venues(name)')
      .eq('status', 'upcoming')
      .or(`home_team_id.eq.${OWN_TEAM_ID},away_team_id.eq.${OWN_TEAM_ID}`)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Último resultado del Perreo FC (status=finished, ordenado por fecha descendente)
    supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score, home_shield_url, away_shield_url, date')
      .eq('status', 'finished')
      .or(`home_team_id.eq.${OWN_TEAM_ID},away_team_id.eq.${OWN_TEAM_ID}`)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Posición más reciente en clasificación
    supabase
      .from('classification_entries')
      .select('position, pts, pj, wins, draws, losses, goals_for, goals_against, round_number')
      .eq('team_id', OWN_TEAM_ID)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Máximo goleador del Perreo FC (snapshot más reciente)
    supabase
      .from('top_scorers')
      .select('player_name, goals, team_name, snapshot_date')
      .eq('external_team_id', OWN_TEAM_ID)
      .order('snapshot_date', { ascending: false })
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Últimas 3 noticias publicadas
    supabase
      .from(newsTable as any)
      .select('id, title, image_url, category, published_at, featured')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(3),
  ]);

  const next = nextMatchRes.data as any;
  const last = lastResultRes.data as any;
  const standing = standingRes.data as any;
  const topScorer = topScorerRes.data as any;
  // Si news_articles no existe o está vacía, devolvemos []
  const news = newsRes.error ? [] : (newsRes.data ?? []);

  // Resolver escudos desde clubs (Supabase Storage)
  const matchTeamIds = [next?.home_team_id, next?.away_team_id, last?.home_team_id, last?.away_team_id]
    .filter((id): id is number => id != null);
  const clubShields = await getClubShieldsByTeamIds([...new Set(matchTeamIds)]);

  return {
    nextMatch: next ? {
      id: next.id,
      homeTeamName: next.home_team_name,
      awayTeamName: next.away_team_name,
      homeShieldUrl: resolveShield(next.home_team_id, next.home_shield_url, clubShields),
      awayShieldUrl: resolveShield(next.away_team_id, next.away_shield_url, clubShields),
      date: next.date,
      time: next.time,
      venueName: next.venue?.name ?? null,
    } : null,
    lastResult: last ? {
      id: last.id,
      homeTeamName: last.home_team_name,
      awayTeamName: last.away_team_name,
      homeScore: last.home_score,
      awayScore: last.away_score,
      homeShieldUrl: resolveShield(last.home_team_id, last.home_shield_url, clubShields),
      awayShieldUrl: resolveShield(last.away_team_id, last.away_shield_url, clubShields),
      date: last.date,
    } : null,
    standing: standing ? {
      position: standing.position,
      pts: standing.pts,
      pj: standing.pj,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsFor: standing.goals_for,
      goalsAgainst: standing.goals_against,
    } : null,
    topScorer: topScorer ? {
      playerName: topScorer.player_name,
      goals: topScorer.goals,
      teamName: topScorer.team_name,
    } : null,
    latestNews: news.map((n: any) => ({
      id: n.id,
      title: n.title,
      imageUrl: n.image_url,
      category: n.category,
      publishedAt: n.published_at,
      featured: n.featured ?? false,
    })),
  };
}





