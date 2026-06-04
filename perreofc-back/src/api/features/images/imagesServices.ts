/**
 * Contains the business and persistence logic for the images backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';
import type { ImageRecord } from './imagesTypes.js';

// ─── Shared mapper ───────────────────────────────────────────────────────────

function mapImage(row: any): ImageRecord {
  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url ?? null,
    description: row.description ?? null,
    isProfile: row.is_profile,
    takenAt: row.taken_at ?? null,
    uploadedBy: row.uploaded_by ?? null,
    createdAt: row.created_at,
  };
}

// ─── Player Images ────────────────────────────────────────────────────────────

export async function getPlayerImages(playerId: number): Promise<ImageRecord[]> {
  const { data, error } = await getAdminClient()
    .from('player_images' as any)
    .select('id, url, thumbnail_url, description, is_profile, taken_at, uploaded_by, created_at')
    .eq('player_id', playerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapImage);
}

export async function addPlayerImage(
  playerId: number,
  body: { url: string; is_profile: boolean; description?: string; taken_at?: string },
  actorId: string,
  actorUsername: string,
): Promise<ImageRecord> {
  const { data, error } = await getAdminClient()
    .from('player_images' as any)
    .insert({
      player_id: playerId,
      url: body.url,
      is_profile: body.is_profile,
      description: body.description ?? null,
      taken_at: body.taken_at ?? null,
      uploaded_by: actorId,
    })
    .select()
    .single() as any;

  if (error || !data) throw error ?? new Error('No se pudo insertar la imagen');

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'player_image.add',
    entityType: 'player_images',
    entityId: data.id,
  });

  return mapImage(data);
}

export async function setPlayerProfileImage(
  playerId: number,
  imageId: string,
  actorId: string,
  actorUsername: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: img } = await supabase
    .from('player_images' as any)
    .select('id, url')
    .eq('id', imageId)
    .eq('player_id', playerId)
    .is('deleted_at', null)
    .single() as any;

  if (!img) throw new NotFoundError('Imagen no encontrada');

  await supabase
    .from('player_images' as any)
    .update({ is_profile: false })
    .eq('player_id', playerId);

  await supabase
    .from('player_images' as any)
    .update({ is_profile: true })
    .eq('id', imageId);

  await supabase
    .from('players')
    .update({ photo_url: img.url })
    .eq('id', playerId);

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'player_image.set_profile',
    entityType: 'player_images',
    entityId: imageId,
  });
}

export async function softDeletePlayerImage(
  playerId: number,
  imageId: string,
  actorId: string,
  actorUsername: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: img } = await supabase
    .from('player_images' as any)
    .select('id')
    .eq('id', imageId)
    .eq('player_id', playerId)
    .is('deleted_at', null)
    .single() as any;

  if (!img) throw new NotFoundError('Imagen no encontrada');

  await supabase
    .from('player_images' as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId);

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'player_image.delete',
    entityType: 'player_images',
    entityId: imageId,
  });
}

// ─── Staff Images ─────────────────────────────────────────────────────────────

export async function getStaffImages(staffId: number): Promise<ImageRecord[]> {
  const { data, error } = await getAdminClient()
    .from('staff_images' as any)
    .select('id, url, thumbnail_url, description, is_profile, taken_at, uploaded_by, created_at')
    .eq('staff_id', staffId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapImage);
}

export async function addStaffImage(
  staffId: number,
  body: { url: string; is_profile: boolean; description?: string; taken_at?: string },
  actorId: string,
  actorUsername: string,
): Promise<ImageRecord> {
  const { data, error } = await getAdminClient()
    .from('staff_images' as any)
    .insert({
      staff_id: staffId,
      url: body.url,
      is_profile: body.is_profile,
      description: body.description ?? null,
      taken_at: body.taken_at ?? null,
      uploaded_by: actorId,
    })
    .select()
    .single() as any;

  if (error || !data) throw error ?? new Error('No se pudo insertar la imagen');

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'staff_image.add',
    entityType: 'staff_images',
    entityId: data.id,
  });

  return mapImage(data);
}

export async function setStaffProfileImage(
  staffId: number,
  imageId: string,
  actorId: string,
  actorUsername: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: img } = await supabase
    .from('staff_images' as any)
    .select('id, url')
    .eq('id', imageId)
    .eq('staff_id', staffId)
    .is('deleted_at', null)
    .single() as any;

  if (!img) throw new NotFoundError('Imagen no encontrada');

  await supabase
    .from('staff_images' as any)
    .update({ is_profile: false })
    .eq('staff_id', staffId);

  await supabase
    .from('staff_images' as any)
    .update({ is_profile: true })
    .eq('id', imageId);

  await supabase
    .from('staff_members')
    .update({ photo_url: img.url })
    .eq('id', staffId);

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'staff_image.set_profile',
    entityType: 'staff_images',
    entityId: imageId,
  });
}

export async function softDeleteStaffImage(
  staffId: number,
  imageId: string,
  actorId: string,
  actorUsername: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: img } = await supabase
    .from('staff_images' as any)
    .select('id')
    .eq('id', imageId)
    .eq('staff_id', staffId)
    .is('deleted_at', null)
    .single() as any;

  if (!img) throw new NotFoundError('Imagen no encontrada');

  await supabase
    .from('staff_images' as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId);

  await logAction({
    userId: actorId,
    username: actorUsername,
    action: 'staff_image.delete',
    entityType: 'staff_images',
    entityId: imageId,
  });
}

// ─── News Image ───────────────────────────────────────────────────────────────

export async function setNewsImage(articleId: string, url: string): Promise<void> {
  const { error } = await getAdminClient()
    .from('news_articles')
    .update({ image_url: url })
    .eq('id', articleId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function clearNewsImage(articleId: string): Promise<void> {
  const { error } = await getAdminClient()
    .from('news_articles')
    .update({ image_url: null })
    .eq('id', articleId)
    .is('deleted_at', null);

  if (error) throw error;
}
