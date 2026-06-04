/**
 * Contains the business and persistence logic for the events backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import type { Database, TablesUpdate } from '../../../shared/types/database.js';
import { NotFoundError, ForbiddenError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';

type Role = Database['public']['Enums']['visibility_role'];

export async function getEvents(userRole: Role, params: {
  from?: string; to?: string; type?: string;
}) {
  const supabase = getAdminClient();

  // Obtener IDs visibles para el rol del usuario
  const { data: visibleIds } = await supabase
    .from('event_visibility')
    .select('event_id')
    .eq('role', userRole);

  const ids = (visibleIds ?? []).map((v: any) => v.event_id);
  if (ids.length === 0) return { data: [] };

  let query = supabase
    .from('events')
    .select('id, title, description, type, date, time, location, match_id')
    .is('deleted_at', null)
    .in('id', ids)
    .order('date', { ascending: true });

  if (params.from) query = query.gte('date', params.from);
  if (params.to) query = query.lte('date', params.to);
  if (params.type) query = query.eq('type', params.type);

  const { data, error } = await query;
  if (error) throw error;

  // Visibility para cada evento
  const evtIds = (data ?? []).map((e: any) => e.id);
  const { data: allVis } = await supabase.from('event_visibility').select('event_id, role').in('event_id', evtIds);
  const visByEvent = new Map<string, string[]>();
  for (const v of allVis ?? []) {
    const arr = visByEvent.get(v.event_id) ?? [];
    arr.push(v.role);
    visByEvent.set(v.event_id, arr);
  }

  return {
    data: (data ?? []).map((e: any) => ({
      id: e.id, title: e.title, description: e.description,
      type: e.type, date: e.date, time: e.time, location: e.location,
      matchId: e.match_id, isCancelled: false,
      visibility: visByEvent.get(e.id) ?? [],
    })),
  };
}

export async function getEventById(id: string, userRole: Role) {
  const supabase = getAdminClient();

  // Verificar visibilidad
  const { data: vis } = await supabase
    .from('event_visibility')
    .select('role')
    .eq('event_id', id)
    .eq('role', userRole)
    .maybeSingle();
  if (!vis) throw new ForbiddenError('No tienes acceso a este evento');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error || !data) throw new NotFoundError('Evento no encontrado');

  // Datos del partido si tiene matchId
  let match = null;
  if (data.match_id) {
    const { data: m } = await supabase
      .from('matches')
      .select('id, home_team_name, away_team_name, home_score, away_score, status, home_shield_url, away_shield_url')
      .eq('id', data.match_id)
      .single();
    if (m) match = { id: m.id, homeTeam: m.home_team_name, awayTeam: m.away_team_name, homeScore: m.home_score, awayScore: m.away_score, status: m.status, homeShieldUrl: m.home_shield_url, awayShieldUrl: m.away_shield_url };
  }

  const { data: allVis } = await supabase.from('event_visibility').select('role').eq('event_id', id);

  const recurrence = data.recurrence_type ? {
    type:     data.recurrence_type,
    interval: data.recurrence_interval ?? 1,
    endDate:  data.recurrence_end_date ?? undefined,
  } : undefined;

  return {
    id: data.id, title: data.title, description: data.description,
    type: data.type, date: data.date, time: data.time, location: data.location,
    matchId: data.match_id, isCancelled: false,
    visibility: (allVis ?? []).map((v: any) => v.role),
    recurrence,
    match,
  };
}

async function upsertVisibility(supabase: any, eventId: string, roles: Role[]) {
  // Admin y superadmin siempre incluidos
  const ensured = [...new Set([...roles, 'admin' as Role, 'superadmin' as Role])];
  await supabase.from('event_visibility').delete().eq('event_id', eventId);
  await supabase.from('event_visibility').insert(ensured.map((role) => ({ event_id: eventId, role })));
}

export async function createEvent(userId: string, username: string, fields: {
  title: string; description?: string | null; type: EventType;
  date: string; time?: string | null; location?: string | null;
  matchId?: number | null; visibility: Role[];
  recurrence?: { type: string; interval: number; endDate?: string } | null;
}) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: fields.title, description: fields.description ?? null,
      type: fields.type, date: fields.date, time: fields.time ?? null,
      location: fields.location ?? null, match_id: fields.matchId ?? null,
      created_by: userId,
      recurrence_type:     fields.recurrence?.type ?? null,
      recurrence_interval: fields.recurrence?.interval ?? null,
      recurrence_end_date: fields.recurrence?.endDate ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await upsertVisibility(supabase, data.id, fields.visibility);
  await logAction({
    userId,
    username,
    action: 'event.create',
    entityType: 'events',
    entityId: data.id,
  });
  return data;
}

export async function updateEvent(userId: string, username: string, id: string, fields: Partial<{
  title: string; description: string | null; type: EventType;
  date: string; time: string | null; location: string | null;
  matchId: number | null; visibility: Role[];
  recurrence: { type: string; interval: number; endDate?: string } | null;
}>) {
  const supabase = getAdminClient();

  const { data: existing } = await supabase.from('events').select('id').eq('id', id).is('deleted_at', null).single();
  if (!existing) throw new NotFoundError('Evento no encontrado');

  const update: TablesUpdate<'events'> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.type !== undefined) update.type = fields.type;
  if (fields.date !== undefined) update.date = fields.date;
  if (fields.time !== undefined) update.time = fields.time;
  if (fields.location !== undefined) update.location = fields.location;
  if (fields.matchId !== undefined) update.match_id = fields.matchId;
  if (fields.recurrence !== undefined) {
    (update as any).recurrence_type     = fields.recurrence?.type ?? null;
    (update as any).recurrence_interval = fields.recurrence?.interval ?? null;
    (update as any).recurrence_end_date = fields.recurrence?.endDate ?? null;
  }

  const { data, error } = await supabase.from('events').update(update).eq('id', id).select().single();
  if (error) throw error;

  if (fields.visibility) await upsertVisibility(supabase, id, fields.visibility);
  await logAction({
    userId,
    username,
    action: 'event.update',
    entityType: 'events',
    entityId: id,
  });
  return data;
}

export async function deleteEvent(userId: string, username: string, id: string) {
  const { data: existing } = await getAdminClient().from('events').select('id').eq('id', id).is('deleted_at', null).single();
  if (!existing) throw new NotFoundError('Evento no encontrado');
  await getAdminClient().from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  await logAction({
    userId,
    username,
    action: 'event.delete',
    entityType: 'events',
    entityId: id,
  });
}





