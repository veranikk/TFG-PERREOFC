/**
 * Contains the business and persistence logic for the news backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError, ConflictError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';

const TABLE = 'news_categories';

export async function getCategories() {
  const { data, error } = await getAdminClient()
    .from(TABLE as any)
    .select('id, name, color, created_at')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id:        c.id,
    name:      c.name,
    color:     c.color,
    createdAt: c.created_at,
  }));
}

export async function createCategory(
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
    action: 'news_category.create',
    entityType: TABLE,
    entityId: (data as any).id,
  });

  const row = data as any;
  return { id: row.id, name: row.name, color: row.color, createdAt: row.created_at };
}

export async function deleteCategory(
  userId: string,
  username: string,
  id: string,
) {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(TABLE as any)
    .select('name')
    .eq('id', id)
    .single();

  if (!existing) throw new NotFoundError('Categoría no encontrada');

  const { count, error: countErr } = await supabase
    .from('news_articles' as any)
    .select('id', { count: 'exact', head: true })
    .eq('category', (existing as any).name)
    .is('deleted_at', null);

  if (countErr) throw countErr;
  if ((count ?? 0) > 0) {
    throw new ConflictError(
      `No se puede eliminar: ${count} artículo${count !== 1 ? 's' : ''} usa${count === 1 ? '' : 'n'} esta categoría`,
    );
  }

  await supabase.from(TABLE as any).delete().eq('id', id);

  await logAction({
    userId,
    username,
    action: 'news_category.delete',
    entityType: TABLE,
    entityId: id,
  });
}
