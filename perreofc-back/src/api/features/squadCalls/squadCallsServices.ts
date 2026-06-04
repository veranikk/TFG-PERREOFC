/**
 * Contains the business and persistence logic for the squad calls backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';
import { env } from '../../../shared/env.js';
import type { KitSlot, SquadCallPlayer, SquadCallWithKit } from './squadCallsTypes.js';

const supabase = () => getAdminClient();

async function fetchKit(kitSlot: KitSlot) {
  const kitNumber = kitSlot === 'titular' ? 1 : 2;
  const { data } = await supabase()
    .from('kit_designs')
    .select('shirt_color, shirt_color1, shirt_color2, shorts_color, shorts_color1, socks_color, socks_color1')
    .eq('team_id', env.OWN_TEAM_ID)
    .eq('kit_number', kitNumber)
    .maybeSingle();
  if (!data) return null;
  return {
    shirtColor:  data.shirt_color,
    shirtColor1: data.shirt_color1,
    shirtColor2: data.shirt_color2,
    shortsColor: data.shorts_color,
    shortsColor1: data.shorts_color1,
    socksColor:  data.socks_color,
    socksColor1: data.socks_color1,
  };
}

async function fetchSquadCall(matchId: number): Promise<SquadCallWithKit | null> {
  const db = supabase();

  const { data: call, error } = await db
    .from('match_squad_calls' as any)
    .select('id, match_id, report_time, location, kit_slot, shirt_color, shorts_color, socks_color, created_by, created_at, updated_at')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw error;
  if (!call) return null;

  const { data: players, error: pe } = await db
    .from('match_squad_call_players' as any)
    .select('player_id, player_name')
    .eq('squad_call_id', call.id);

  if (pe) throw pe;

  const kit = await fetchKit(call.kit_slot as KitSlot);

  return {
    id:          call.id,
    matchId:     call.match_id,
    reportTime:  call.report_time,
    location:    call.location,
    kitSlot:     call.kit_slot as KitSlot,
    shirtColor:  call.shirt_color ?? null,
    shortsColor: call.shorts_color ?? null,
    socksColor:  call.socks_color ?? null,
    players:     (players ?? []).map((p: any) => ({ playerId: p.player_id, playerName: p.player_name })),
    createdBy:   call.created_by,
    createdAt:   call.created_at,
    updatedAt:   call.updated_at,
    kit,
  };
}

export async function getSquadCall(matchId: number): Promise<SquadCallWithKit | null> {
  // Verificar partido existe
  const { data: match } = await supabase().from('matches').select('id').eq('id', matchId).maybeSingle();
  if (!match) throw new NotFoundError('Partido no encontrado');
  return fetchSquadCall(matchId);
}

export async function upsertSquadCall(
  userId: string,
  username: string,
  matchId: number,
  fields: {
    reportTime?:  string | null;
    location?:    string | null;
    kitSlot:      KitSlot;
    shirtColor?:  string | null;
    shortsColor?: string | null;
    socksColor?:  string | null;
    players:      SquadCallPlayer[];
  },
): Promise<SquadCallWithKit> {
  const db = supabase();

  // Verificar partido existe y es upcoming
  const { data: match } = await db
    .from('matches')
    .select('id, status')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) throw new NotFoundError('Partido no encontrado');

  const now = new Date().toISOString();

  // Upsert en match_squad_calls
  const { data: existing } = await db
    .from('match_squad_calls' as any)
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  let squadCallId: string;

  if (existing) {
    const { data: updated, error } = await db
      .from('match_squad_calls' as any)
      .update({
        report_time:  fields.reportTime ?? null,
        location:     fields.location ?? null,
        kit_slot:     fields.kitSlot,
        shirt_color:  fields.shirtColor  ?? null,
        shorts_color: fields.shortsColor ?? null,
        socks_color:  fields.socksColor  ?? null,
        updated_at:   now,
      })
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    squadCallId = updated.id;

    // Borrar jugadores previos y reinsertar
    await db.from('match_squad_call_players' as any).delete().eq('squad_call_id', squadCallId);
  } else {
    const { data: created, error } = await db
      .from('match_squad_calls' as any)
      .insert({
        match_id:     matchId,
        report_time:  fields.reportTime ?? null,
        location:     fields.location ?? null,
        kit_slot:     fields.kitSlot,
        shirt_color:  fields.shirtColor  ?? null,
        shorts_color: fields.shortsColor ?? null,
        socks_color:  fields.socksColor  ?? null,
        created_by:   userId,
        created_at:   now,
        updated_at:   now,
      })
      .select('id')
      .single();
    if (error) throw error;
    squadCallId = created.id;
  }

  // Insertar jugadores
  if (fields.players.length > 0) {
    const { error: pe } = await db
      .from('match_squad_call_players' as any)
      .insert(fields.players.map((p) => ({
        squad_call_id: squadCallId,
        player_id:     p.playerId,
        player_name:   p.playerName,
      })));
    if (pe) throw pe;
  }

  await logAction({
    userId,
    username,
    action: existing ? 'squad_call.update' : 'squad_call.create',
    entityType: 'match_squad_calls',
    entityId: squadCallId,
  });

  // Notificar a jugadores convocados
  await notifyPlayers(matchId, squadCallId, fields.players, !!existing);

  const result = await fetchSquadCall(matchId);
  return result!;
}

async function notifyPlayers(
  matchId: number,
  squadCallId: string,
  players: SquadCallPlayer[],
  isUpdate: boolean,
) {
  const db = supabase();

  // Obtener user_id de cada jugador convocado (players.user_id)
  if (players.length === 0) return;

  const playerIds = players.map((p) => p.playerId);
  const { data: playerRows } = await db
    .from('players')
    .select('id, user_id, full_name')
    .in('id', playerIds);

  const usersToNotify = (playerRows ?? []).filter((p: any) => p.user_id);
  if (usersToNotify.length === 0) return;

  // Obtener datos del partido para el mensaje
  const { data: match } = await db
    .from('matches')
    .select('date, time, home_team_name, away_team_name')
    .eq('id', matchId)
    .maybeSingle();

  const matchLabel = match
    ? `${match.home_team_name} vs ${match.away_team_name}`
    : 'partido';
  const title = isUpdate ? '📋 Convocatoria actualizada' : '📋 ¡Estás convocado!';
  const body = isUpdate
    ? `La convocatoria para ${matchLabel} ha sido actualizada.`
    : `Has sido convocado para ${matchLabel}. Revisa los detalles en la app.`;

  const now = new Date().toISOString();
  const notifications = usersToNotify.map((p: any) => ({
    user_id:    p.user_id,
    title,
    body,
    type:       'squad_call',
    read:       false,
    created_at: now,
  }));

  await db.from('notifications' as any).insert(notifications);
}

export async function deleteSquadCall(userId: string, username: string, matchId: number) {
  const db = supabase();

  const { data: existing } = await db
    .from('match_squad_calls' as any)
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  if (!existing) throw new NotFoundError('Convocatoria no encontrada');

  await db.from('match_squad_calls' as any).delete().eq('id', existing.id);

  await logAction({
    userId,
    username,
    action: 'squad_call.delete',
    entityType: 'match_squad_calls',
    entityId: existing.id,
  });
}
