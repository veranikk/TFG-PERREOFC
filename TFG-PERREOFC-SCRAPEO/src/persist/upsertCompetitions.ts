/**
 * Persistence module that upserts scraped competitions data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { Database } from '../shared/types/database.js';
import type { ScrapedCompetition } from '../scrapers/competitions.js';

type CompetitionInsert = Database['public']['Tables']['competitions']['Insert'];

function mapCompetitionType(type: ScrapedCompetition['competition_type']): CompetitionInsert['type'] {
  return type === 1 ? 'copa' : 'liga';
}

function toCompetitionRow(competition: ScrapedCompetition, seasonId: number): CompetitionInsert {
  return {
    id: competition.id,
    name: competition.name,
    type: mapCompetitionType(competition.competition_type),
    season_id: seasonId,
    game_type_id: competition.game_type_id,
    category_id: competition.category_id,
    category_name: competition.category_name,
    group_category_id: competition.group_category_id,
    group_category_name: competition.group_category_name,
    is_active: competition.is_active,
    start_date: competition.start_date || null,
    end_date: competition.end_date || null,
    display_order: competition.order,
    points_win: competition.points_win,
    points_draw: competition.points_draw,
    points_loss: competition.points_loss,
    match_minutes: competition.match_minutes,
    num_parts: competition.num_parts,
    show_scorers: competition.show_scorers,
    show_player_stats: competition.show_player_stats,
    show_standings: competition.show_standings,
    scraped_at: new Date().toISOString(),
  };
}

export async function upsertCompetitions(
  competitions: ScrapedCompetition[],
  opts: { seasonId: number },
) {
  const supabase = getAdminClient();
  let upserted = 0;

  for (const competition of competitions) {
    try {
      const { error } = await supabase
        .from('competitions')
        .upsert(toCompetitionRow(competition, opts.seasonId), { onConflict: 'id' });

      if (error) throw error;
      upserted += 1;
    } catch (error) {
      console.error('Error upserting competition', {
        competitionId: competition.id,
        error,
      });
    }
  }

  return { upserted };
}
