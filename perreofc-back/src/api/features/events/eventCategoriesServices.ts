/**
 * Contains the business and persistence logic for the events backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError, ConflictError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';

const TABLE = 'event_categories';

export async function getEventCategories() {
  const { data, error } = await getAdminClient()
    .from(TABLE as any)
    .select('id, name, color, slug, is_system, created_at')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id:        c.id,
    name:      c.name,
    color:     c.color,
    slug:      c.slug ?? null,
    isSystem:  c.is_system ?? false,
    createdAt: c.created_at,
  }));
}

export async function createEventCategory(
  userId: string,
  username: string,
  fields: { name: string; color: string },
) {
  const { data, error } = await getAdminClient()
    .from(TABLE as any)
    .insert({ name: fields.name, color: fields.color })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new ConflictError('Ya existe una categoría con ese nombre');
    throw error;
  }

  await logAction({
    userId,
    username,
    action: 'event_category.create',
    entityType: TABLE,
    entityId: (data as any).id,
  });

  const row = data as any;
  return { id: row.id, name: row.name, color: row.color, createdAt: row.created_at };
}

export async function deleteEventCategory(
  userId: string,
  username: string,
  id: string,
) {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(TABLE as any)
    .select('name, is_system')
    .eq('id', id)
    .single();

  if (!existing) throw new NotFoundError('Categoría no encontrada');
  if ((existing as any).is_system) throw new ConflictError('No se pueden eliminar los tipos del sistema');

  await supabase.from(TABLE as any).delete().eq('id', id);

  await logAction({
    userId,
    username,
    action: 'event_category.delete',
    entityType: TABLE,
    entityId: id,
  });
}
