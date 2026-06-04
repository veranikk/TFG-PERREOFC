/**
 * Contains the business and persistence logic for the classification backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { env } from '../../../shared/env.js';
import { getClubShieldsByTeamIds, resolveShield } from '../../../shared/shieldUtils.js';

const FORM_COLUMN = 'result';

function translateForm(code: string | null): 'W' | 'D' | 'L' | null {
  switch (code?.toUpperCase()) {
    case 'G': case 'W': return 'W';
    case 'E': case 'D': return 'D';
    case 'P': case 'L': return 'L';
    default: return null;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export async function getClassification(groupId: number, roundNumber?: number) {
  const supabase = getAdminClient();

  // 1. Resolver round
  let targetRound = roundNumber;
  if (!targetRound) {
    const { data, error } = await supabase
      .from('classification_entries')
      .select('round_number')
      .eq('group_id', groupId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Sin clasificación para este grupo');
    targetRound = data.round_number;
  }

  // 2. Grupo + competición
  const { data: group, error: groupErr } = await supabase
    .from('competition_groups')
    .select('id, name, competitions(name)')
    .eq('id', groupId)
    .single();
  if (groupErr || !group) throw new NotFoundError('Grupo no encontrado');

  // 3. Entries y form en paralelo
  const [entriesRes, formRes] = await Promise.all([
    supabase
      .from('classification_entries')
      .select('id, position, team_id, team_name, team_shield_url, pj, wins, draws, losses, goals_for, goals_against, pts, pts_sanction, round_date')
      .eq('group_id', groupId)
      .eq('round_number', targetRound)
      .order('position', { ascending: true }),
    supabase
      .from('classification_form')
      .select(`classification_entry_id, ${FORM_COLUMN}, position`)
      .order('position', { ascending: true }),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  if (formRes.error) throw formRes.error;

  const formByEntry = new Map<string, Array<'W' | 'D' | 'L'>>();
  for (const f of (formRes.data ?? []) as any[]) {
    const arr = formByEntry.get(f.classification_entry_id) ?? [];
    const translated = translateForm(f[FORM_COLUMN]);
    if (translated) arr.push(translated);
    formByEntry.set(f.classification_entry_id, arr);
  }

  const competitionName = (group.competitions as any)?.name ?? null;

  // Resolver escudos desde clubs (Supabase Storage)
  const teamIds = (entriesRes.data ?? []).map((e) => e.team_id).filter((id): id is number => id != null);
  const clubShields = await getClubShieldsByTeamIds([...new Set(teamIds)]);

  return {
    groupId: group.id,
    groupName: group.name,
    competitionName,
    roundNumber: targetRound,
    roundDate: entriesRes.data?.[0]?.round_date ?? null,
    entries: (entriesRes.data ?? []).map((e) => ({
      position: e.position,
      teamId: e.team_id,
      teamName: e.team_name,
      teamShieldUrl: resolveShield(e.team_id, e.team_shield_url, clubShields),
      pj: e.pj,
      wins: e.wins,
      draws: e.draws,
      losses: e.losses,
      goalsFor: e.goals_for,
      goalsAgainst: e.goals_against,
      pts: e.pts,
      ptsSanction: e.pts_sanction,
      form: formByEntry.get(e.id) ?? [],
      isOwnTeam: e.team_id === env.OWN_TEAM_ID,
    })),
  };
}




