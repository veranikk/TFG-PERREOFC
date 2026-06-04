/**
 * Persistence module that upserts scraped competition groups data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { Database } from '../shared/types/database.js';
import type { ScrapedGroup } from '../scrapers/competitions.js';

type GroupInsert = Database['public']['Tables']['competition_groups']['Insert'];
type PersistableGroup = ScrapedGroup | { id: number; name: string };

function toGroupRow(
  group: PersistableGroup,
  competitionId: number,
): GroupInsert {
  const maybeFullGroup = group as Partial<ScrapedGroup>;

  return {
    id: group.id,
    name: group.name,
    competition_id: maybeFullGroup.competition_id ?? competitionId,
    scraped_at: new Date().toISOString(),
  };
}

export async function upsertCompetitionGroups(
  groups: PersistableGroup[],
  opts: { seasonId: number; competitionId: number },
) {
  const supabase = getAdminClient();
  const persistedGroups: Array<{ id: number; name: string }> = [];

  for (const group of groups) {
    try {
      const { error } = await supabase
        .from('competition_groups')
        .upsert(
          toGroupRow(group, opts.competitionId),
          { onConflict: 'id' },
        );

      if (error) throw error;
      persistedGroups.push({ id: group.id, name: group.name });
    } catch (error) {
      console.error('Error upserting competition group', {
        groupId: group.id,
        competitionId: opts.competitionId,
        error,
      });
    }
  }

  return { groups: persistedGroups };
}
