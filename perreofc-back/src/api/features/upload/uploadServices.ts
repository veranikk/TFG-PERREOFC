/**
 * Contains the business and persistence logic for the upload backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { BadRequestError } from '../../errors.js';
import type { UploadResult } from './uploadTypes.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function collectStream(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

function transformGoogleDriveUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// ─── Upload to Supabase Storage ───────────────────────────────────────────────

export async function uploadFileToStorage(
  bucket: string,
  storagePath: string,
  fileStream: NodeJS.ReadableStream,
  contentType: string,
): Promise<UploadResult> {
  const buffer = await collectStream(fileStream);
  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { publicUrl, path: storagePath, bucket };
}

// ─── Upload from URL ──────────────────────────────────────────────────────────

export async function uploadFromUrl(
  sourceUrl: string,
  bucket: string,
  storagePath: string,
): Promise<UploadResult> {
  const downloadUrl = transformGoogleDriveUrl(sourceUrl);

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new BadRequestError(`No se pudo descargar la URL: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { publicUrl, path: storagePath, bucket };
}
