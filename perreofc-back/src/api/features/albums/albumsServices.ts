/**
 * Contains the business and persistence logic for the albums backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';
import type { AlbumRecord, PhotoRecord } from './albumsTypes.js';

const ALBUMS_TABLE = 'media_albums';
const IMAGES_TABLE = 'media_images';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapAlbum(row: any): AlbumRecord {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? null,
    coverUrl:    row.cover_url ?? null,
    eventDate:   row.event_date ?? null,
    createdBy:   row.created_by ?? null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
    photoCount:  row.photo_count ?? undefined,
  };
}

function mapPhoto(row: any): PhotoRecord {
  return {
    id:           row.id,
    albumId:      row.album_id,
    url:          row.url,
    thumbnailUrl: row.thumbnail_url ?? null,
    description:  row.description ?? null,
    location:     row.location ?? null,
    type:         row.type ?? 'photo',
    takenAt:      row.taken_at ?? null,
    uploadedBy:   row.uploaded_by ?? null,
    createdAt:    row.created_at,
  };
}

// ─── Albums CRUD ──────────────────────────────────────────────────────────────

export async function getAlbums(params: { page: number; limit: number }) {
  const supabase = getAdminClient();
  const rangeFrom = (params.page - 1) * params.limit;

  const { data, error, count } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('id, title, description, cover_url, event_date, created_by, created_at, updated_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeFrom + params.limit - 1);

  if (error) throw error;

  const albums = (data ?? []) as any[];
  const albumIds = albums.map((a) => a.id);

  let photoCounts: Record<string, number> = {};
  if (albumIds.length > 0) {
    const { data: counts } = await supabase
      .from(IMAGES_TABLE as any)
      .select('album_id')
      .in('album_id', albumIds)
      .is('deleted_at', null);

    (counts ?? []).forEach((r: any) => {
      photoCounts[r.album_id] = (photoCounts[r.album_id] ?? 0) + 1;
    });
  }

  return {
    data: albums.map((a) => mapAlbum({ ...a, photo_count: photoCounts[a.id] ?? 0 })),
    pagination: {
      page:       params.page,
      limit:      params.limit,
      total:      count ?? 0,
      totalPages: Math.ceil((count ?? 0) / params.limit),
    },
  };
}

export async function getAlbumById(id: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('id, title, description, cover_url, event_date, created_by, created_at, updated_at')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new NotFoundError('Álbum no encontrado');

  const { data: photos } = await supabase
    .from(IMAGES_TABLE as any)
    .select('id, album_id, url, thumbnail_url, description, location, type, taken_at, uploaded_by, created_at')
    .eq('album_id', id)
    .is('deleted_at', null)
    .order('taken_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  return {
    ...mapAlbum(data as any),
    photos: (photos ?? []).map(mapPhoto),
  };
}

export async function createAlbum(
  actorId: string,
  actorUsername: string,
  fields: { title: string; description?: string | null; coverUrl?: string | null; eventDate?: string | null },
): Promise<AlbumRecord> {
  const { data, error } = await getAdminClient()
    .from(ALBUMS_TABLE as any)
    .insert({
      title:       fields.title,
      description: fields.description ?? null,
      cover_url:   fields.coverUrl ?? null,
      event_date:  fields.eventDate ?? null,
      created_by:  actorId,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo crear el álbum');

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.create',
    entityType: ALBUMS_TABLE,
    entityId:   (data as any).id,
  });

  return mapAlbum(data as any);
}

export async function updateAlbum(
  actorId: string,
  actorUsername: string,
  id: string,
  fields: Partial<{ title: string; description: string | null; coverUrl: string | null; eventDate: string | null }>,
): Promise<AlbumRecord> {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!existing) throw new NotFoundError('Álbum no encontrado');

  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined)       update.title       = fields.title;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.coverUrl !== undefined)    update.cover_url   = fields.coverUrl;
  if (fields.eventDate !== undefined)   update.event_date  = fields.eventDate;

  const { data, error } = await supabase
    .from(ALBUMS_TABLE as any)
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo actualizar el álbum');

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.update',
    entityType: ALBUMS_TABLE,
    entityId:   id,
  });

  return mapAlbum(data as any);
}

export async function deleteAlbum(actorId: string, actorUsername: string, id: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!existing) throw new NotFoundError('Álbum no encontrado');

  const now = new Date().toISOString();

  // Soft-delete de todas las fotos del álbum
  await supabase
    .from(IMAGES_TABLE as any)
    .update({ deleted_at: now })
    .eq('album_id', id)
    .is('deleted_at', null);

  await supabase
    .from(ALBUMS_TABLE as any)
    .update({ deleted_at: now })
    .eq('id', id);

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.delete',
    entityType: ALBUMS_TABLE,
    entityId:   id,
  });
}

// ─── Photos CRUD ──────────────────────────────────────────────────────────────

export async function getAlbumPhotos(albumId: string): Promise<PhotoRecord[]> {
  const { data: album } = await getAdminClient()
    .from(ALBUMS_TABLE as any)
    .select('id')
    .eq('id', albumId)
    .is('deleted_at', null)
    .single();

  if (!album) throw new NotFoundError('Álbum no encontrado');

  const { data, error } = await getAdminClient()
    .from(IMAGES_TABLE as any)
    .select('id, album_id, url, thumbnail_url, description, location, type, taken_at, uploaded_by, created_at')
    .eq('album_id', albumId)
    .is('deleted_at', null)
    .order('taken_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPhoto);
}

export async function addPhoto(
  actorId: string,
  actorUsername: string,
  albumId: string,
  fields: { url: string; thumbnailUrl?: string | null; description?: string | null; location?: string | null; type?: 'photo' | 'video'; takenAt?: string | null },
): Promise<PhotoRecord> {
  const supabase = getAdminClient();

  const { data: album } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('id, cover_url')
    .eq('id', albumId)
    .is('deleted_at', null)
    .single();

  if (!album) throw new NotFoundError('Álbum no encontrado');

  const { data, error } = await supabase
    .from(IMAGES_TABLE as any)
    .insert({
      album_id:      albumId,
      url:           fields.url,
      thumbnail_url: fields.thumbnailUrl ?? null,
      description:   fields.description ?? null,
      location:      fields.location ?? null,
      type:          fields.type ?? 'photo',
      taken_at:      fields.takenAt ?? null,
      uploaded_by:   actorId,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo añadir la foto');

  // Si el álbum no tiene portada, asignar esta foto automáticamente
  if (!(album as any).cover_url) {
    await supabase
      .from(ALBUMS_TABLE as any)
      .update({ cover_url: fields.url, updated_at: new Date().toISOString() })
      .eq('id', albumId);
  }

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.photo.add',
    entityType: IMAGES_TABLE,
    entityId:   (data as any).id,
  });

  return mapPhoto(data as any);
}

export async function updatePhoto(
  actorId: string,
  actorUsername: string,
  albumId: string,
  photoId: string,
  fields: Partial<{ description: string | null; location: string | null; takenAt: string | null }>,
): Promise<PhotoRecord> {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(IMAGES_TABLE as any)
    .select('id')
    .eq('id', photoId)
    .eq('album_id', albumId)
    .is('deleted_at', null)
    .single();

  if (!existing) throw new NotFoundError('Foto no encontrada');

  const update: Record<string, any> = {};
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.location !== undefined)    update.location    = fields.location;
  if (fields.takenAt !== undefined)     update.taken_at    = fields.takenAt;

  const { data, error } = await supabase
    .from(IMAGES_TABLE as any)
    .update(update)
    .eq('id', photoId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo actualizar la foto');

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.photo.update',
    entityType: IMAGES_TABLE,
    entityId:   photoId,
  });

  return mapPhoto(data as any);
}

export async function deletePhoto(
  actorId: string,
  actorUsername: string,
  albumId: string,
  photoId: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from(IMAGES_TABLE as any)
    .select('id, url')
    .eq('id', photoId)
    .eq('album_id', albumId)
    .is('deleted_at', null)
    .single();

  if (!existing) throw new NotFoundError('Foto no encontrada');

  await supabase
    .from(IMAGES_TABLE as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', photoId);

  // Si era la portada, buscar otra foto del álbum para sustituirla
  const { data: album } = await supabase
    .from(ALBUMS_TABLE as any)
    .select('cover_url')
    .eq('id', albumId)
    .single();

  if ((album as any)?.cover_url === (existing as any).url) {
    const { data: nextPhoto } = await supabase
      .from(IMAGES_TABLE as any)
      .select('url')
      .eq('album_id', albumId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    await supabase
      .from(ALBUMS_TABLE as any)
      .update({
        cover_url:  (nextPhoto as any)?.url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', albumId);
  }

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.photo.delete',
    entityType: IMAGES_TABLE,
    entityId:   photoId,
  });
}

export async function setAlbumCover(
  actorId: string,
  actorUsername: string,
  albumId: string,
  photoId: string,
): Promise<void> {
  const supabase = getAdminClient();

  const { data: photo } = await supabase
    .from(IMAGES_TABLE as any)
    .select('id, url')
    .eq('id', photoId)
    .eq('album_id', albumId)
    .is('deleted_at', null)
    .single();

  if (!photo) throw new NotFoundError('Foto no encontrada');

  await supabase
    .from(ALBUMS_TABLE as any)
    .update({ cover_url: (photo as any).url, updated_at: new Date().toISOString() })
    .eq('id', albumId);

  await logAction({
    userId:     actorId,
    username:   actorUsername,
    action:     'album.cover.set',
    entityType: ALBUMS_TABLE,
    entityId:   albumId,
  });
}
