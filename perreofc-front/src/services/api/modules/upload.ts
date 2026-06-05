/**
 * API module that wraps backend calls for upload.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { getAuthToken } from '../apiClient';
import { UploadResult } from '../../../types';
import type { Photo } from './albums';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * Upload a local file (from expo-image-picker) to the backend via multipart/form-data.
 * Endpoints: /upload/player/:id, /upload/staff/:id, /upload/news/:id, /upload/media
 *
 * ⚠️ Must NOT use fetchClient — it forces Content-Type: application/json.
 * ⚠️ React Native FormData requires the object form { uri, name, type }, NOT a Blob.
 * ⚠️ Never set Content-Type manually — the runtime must set it with the correct multipart boundary.
 */
export async function uploadFile(endpoint: string, localUri: string): Promise<UploadResult> {
  const token = await getAuthToken();
  const filename = localUri.split('/').pop() ?? 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = MIME_MAP[ext] ?? 'image/jpeg';

  const body = new FormData();
  // React Native requires this object form — using Blob breaks on Android/iOS
  body.append('file', { uri: localUri, name: filename, type } as any);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type here — let the runtime add the multipart boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `Upload failed: ${res.status}`);
  }
  // Backend wraps response: { success: true, data: { publicUrl, path, bucket } }
  const json = await res.json();
  return (json?.data ?? json) as UploadResult;
}

/**
 * Upload a photo/video to an album.
 * Endpoint: POST /upload/album/:albumId
 * Sube el archivo al bucket media-gallery y crea el registro en media_images vinculado al álbum.
 * Devuelve el Photo ya persistido en BD.
 */
export async function uploadAlbumPhoto(albumId: string, localUri: string, description?: string | null): Promise<Photo> {
  const token = await getAuthToken();
  const filename = localUri.split('/').pop() ?? 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = MIME_MAP[ext] ?? 'image/jpeg';

  const body = new FormData();
  body.append('file', { uri: localUri, name: filename, type } as any);

  const qs = description ? `?description=${encodeURIComponent(description)}` : '';
  const res = await fetch(`${BASE_URL}/upload/album/${albumId}${qs}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload failed: ${res.status}`);
  }
  const json = await res.json();
  // Backend responde: { success: true, data: Photo[] }
  const result = json?.data ?? json;
  return (Array.isArray(result) ? result[0] : result) as Photo;
}

/**
 * Upload an image from an external URL (Google Drive, Dropbox, direct link) to Supabase via the backend.
 * Endpoint: POST /upload/from-url
 * Body: { url, bucket, path }
 */
export async function uploadFromUrl(url: string, bucket: string, path: string): Promise<UploadResult> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/upload/from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url, bucket, path }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `Upload from URL failed: ${res.status}`);
  }
  // Backend wraps response: { success: true, data: { publicUrl, path, bucket } }
  const json = await res.json();
  return (json?.data ?? json) as UploadResult;
}
