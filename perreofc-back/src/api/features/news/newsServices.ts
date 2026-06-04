/**
 * Contains the business and persistence logic for the news backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import type { Database } from '../../../shared/types/database.js';
import { NotFoundError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';

const NEWS_TABLE = 'news_articles';

type NewsRow = Database['public']['Tables']['news_articles']['Row'];
type NewsUpdate = Partial<NewsRow>;
type NewsListRow = NewsRow & { author?: { username?: string | null } | null };
type NewsDetailRow = NewsRow & { author?: { id?: string | null; username?: string | null } | null };

/** Obtiene lista de noticias publicadas (no borradas, publicadas y no futuras) con filtros y paginación. */
export async function getNews(params: {
  category?: string;
  featured?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortDir: string;
}) {
  const supabase = getAdminClient();
  const col = params.sortBy === 'publishedAt' ? 'published_at' : 'created_at';
  const rangeFrom = (params.page - 1) * params.limit;

  let query = supabase
    .from(NEWS_TABLE as any)
    .select('id, title, image_url, category, published_at, is_featured, author:users(username)', { count: 'exact' })
    .is('deleted_at', null)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order(col, { ascending: params.sortDir === 'asc' })
    .range(rangeFrom, rangeFrom + params.limit - 1);

  if (params.category) query = query.eq('category', params.category);
  if (params.featured !== undefined) query = query.eq('is_featured', params.featured);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as NewsListRow[];

  return {
    data: rows.map((n) => ({
      id: n.id,
      title: n.title,
      imageUrl: n.image_url,
      category: n.category,
      author: n.author?.username ?? null,
      publishedAt: n.published_at,
      isFeatures: n.is_featured,
    })),
    pagination: { page: params.page, limit: params.limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / params.limit) },
  };
}

export async function getNewsById(id: string) {
  const { data, error } = await getAdminClient()
    .from(NEWS_TABLE as any)
    .select('id, title, body, image_url, category, published_at, is_featured, created_at, author:users(id, username)')
    .eq('id', id)
    .is('deleted_at', null)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .single();

  if (error || !data) throw new NotFoundError('Artículo no encontrado');

  const row = data as unknown as NewsDetailRow;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    category: row.category,
    author: row.author?.username ?? null,
    authorId: row.author?.id ?? null,
    publishedAt: row.published_at,
    isFeatures: row.is_featured,
    createdAt: row.created_at,
  };
}

/** Crea noticia nueva. Si se marca como destacada, quita el destacado a otras noticias. */
export async function createNews(authorId: string, authorUsername: string, fields: {
  title: string;
  body: string;
  imageUrl?: string | null;
  category: string;
  isFeatures?: boolean;
  publishedAt?: string | null;
}) {
  // Si se va a destacar, quitamos el destacado a cualquier otra noticia existente
  if (fields.isFeatures) {
    await getAdminClient()
      .from(NEWS_TABLE as any)
      .update({ is_featured: false })
      .eq('is_featured', true)
      .is('deleted_at', null);
  }

  const { data, error } = await getAdminClient()
    .from(NEWS_TABLE as any)
    .insert({
      title: fields.title,
      body: fields.body,
      image_url: fields.imageUrl ?? null,
      category: fields.category,
      is_featured: fields.isFeatures ?? false,
      published_at: fields.publishedAt ?? null,
      author_id: authorId,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo crear la noticia');

  const row = data as unknown as NewsRow;

  await logAction({
    userId: authorId,
    username: authorUsername,
    action: 'news.create',
    entityType: NEWS_TABLE,
    entityId: row.id,
  });

  return row;
}

/** Actualiza noticia existente (campos parciales). Si se marca como destacada, quita el destacado a otras. */
export async function updateNews(userId: string, username: string, id: string, fields: Partial<{
  title: string;
  body: string;
  imageUrl: string | null;
  category: string;
  isFeatures: boolean;
  publishedAt: string | null;
}>) {
  const supabase = getAdminClient();
  const { data: existing } = await supabase.from(NEWS_TABLE as any).select('id').eq('id', id).is('deleted_at', null).single();
  if (!existing) throw new NotFoundError('Artículo no encontrado');

  // Si se marca como destacada, quitar destacado de otras noticias
  if (fields.isFeatures === true) {
    await supabase
      .from(NEWS_TABLE as any)
      .update({ is_featured: false })
      .eq('is_featured', true)
      .neq('id', id)
      .is('deleted_at', null);
  }

  const update: NewsUpdate = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.body !== undefined) update.body = fields.body;
  if (fields.imageUrl !== undefined) update.image_url = fields.imageUrl;
  if (fields.category !== undefined) update.category = fields.category;
  if (fields.isFeatures !== undefined) update.is_featured = fields.isFeatures;
  if (fields.publishedAt !== undefined) update.published_at = fields.publishedAt;

  const { data, error } = await supabase.from(NEWS_TABLE as any).update(update).eq('id', id).select().single();
  if (error || !data) throw error ?? new Error('No se pudo actualizar la noticia');

  await logAction({
    userId,
    username,
    action: 'news.update',
    entityType: NEWS_TABLE,
    entityId: id,
  });

  return data as unknown as NewsRow;
}

export async function deleteNews(userId: string, username: string, id: string) {
  const { data: existing } = await getAdminClient().from(NEWS_TABLE as any).select('id').eq('id', id).is('deleted_at', null).single();
  if (!existing) throw new NotFoundError('Artículo no encontrado');

  await getAdminClient().from(NEWS_TABLE as any).update({ deleted_at: new Date().toISOString() }).eq('id', id);

  await logAction({
    userId,
    username,
    action: 'news.delete',
    entityType: NEWS_TABLE,
    entityId: id,
  });
}





