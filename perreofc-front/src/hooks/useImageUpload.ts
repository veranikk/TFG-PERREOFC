/**
 * Custom React hook for reusable use image upload logic.
 * It hides stateful behavior behind a small API that components can consume cleanly.
 */

import { useState, useCallback } from 'react';
import { PickedImage } from '../components/ui/ImagePickerSheet';
import { uploadFile, uploadFromUrl } from '../services/api/modules/upload';

import { uploadAlbumPhoto } from '../services/api/modules/upload';
import type { Photo } from '../services/api/modules/albums';

export type UploadTarget =
  | { kind: 'player'; id: string }
  | { kind: 'staff';  id: string }
  | { kind: 'news';   id: string }
  | { kind: 'media' }
  | { kind: 'album';  id: string };

function resolveEndpoint(target: UploadTarget): string {
  switch (target.kind) {
    case 'player': return `/upload/player/${target.id}`;
    case 'staff':  return `/upload/staff/${target.id}`;
    case 'news':   return `/upload/news/${target.id}`;
    case 'media':  return '/upload/media';
    case 'album':  return `/upload/album/${target.id}`;
  }
}

function resolveBucketAndPath(target: UploadTarget): { bucket: string; path: string } {
  const ts = Date.now();
  switch (target.kind) {
    case 'player': return { bucket: 'player-photos',  path: `player-${target.id}-${ts}` };
    case 'staff':  return { bucket: 'staff-photos',   path: `staff-${target.id}-${ts}` };
    case 'news':   return { bucket: 'news-images',    path: `news-${target.id}-${ts}` };
    case 'media':  return { bucket: 'media-gallery',  path: `media-${ts}` };
    case 'album':  return { bucket: 'media-gallery',  path: `albums/${target.id}/${ts}` };
  }
}

async function uploadOne(image: PickedImage, target: UploadTarget): Promise<string> {
  // Album: endpoint dedicado que también persiste en media_images
  if (target.kind === 'album') {
    if (image.isLocal) {
      const photo = await uploadAlbumPhoto(target.id, image.uri);
      return photo.url;
    } else {
      // URL externa: delegar al caller (no aplica para uploadOne genérico)
      return image.uri;
    }
  }
  if (image.isLocal) {
    const result = await uploadFile(resolveEndpoint(target), image.uri);
    return result.publicUrl;
  } else {
    const { bucket, path } = resolveBucketAndPath(target);
    const result = await uploadFromUrl(image.uri, bucket, path);
    return result.publicUrl;
  }
}

interface UseImageUploadReturn {
  isLoading: boolean;
  error: string | null;
  /** Sube una imagen. Devuelve la publicUrl o null si hay error. */
  upload: (image: PickedImage, target: UploadTarget) => Promise<string | null>;
  /** Sube varias imágenes en paralelo. Devuelve las URLs que tuvieron éxito. */
  uploadMany: (images: PickedImage[], target: UploadTarget) => Promise<string[]>;
  reset: () => void;
}

/**
 * Hook reutilizable para subir imágenes.
 * No gestiona la visibilidad del ImagePickerSheet — el caller controla eso
 * para evitar problemas con modales anidados en Android.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (image: PickedImage, target: UploadTarget): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await uploadOne(image, target);
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir la imagen');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadMany = useCallback(async (images: PickedImage[], target: UploadTarget): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(images.map((img) => uploadOne(img, target)));
      const urls: string[] = [];
      const failures: string[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          urls.push(r.value);
        } else {
          failures.push(`Imagen ${i + 1}: ${r.reason?.message ?? 'error'}`);
        }
      });
      if (failures.length > 0) {
        setError(failures.join('\n'));
      }
      return urls;
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir las imágenes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { isLoading, error, upload, uploadMany, reset };
}
