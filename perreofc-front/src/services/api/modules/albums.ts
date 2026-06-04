/**
 * API module that wraps backend calls for albums.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';

export interface Album {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  eventDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

export interface AlbumDetail extends Album {
  photos: Photo[];
}

export interface Photo {
  id: string;
  albumId: string;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  location: string | null;
  type: 'photo' | 'video';
  takenAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface PaginatedAlbums {
  data: Album[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const albumsApi = {
  /** GET /albums — listado paginado */
  getAlbums: (page = 1, limit = 20) =>
    fetchClient<PaginatedAlbums>(`/albums?page=${page}&limit=${limit}`),

  /** GET /albums/:id — detalle con fotos */
  getAlbumById: (id: string) =>
    fetchClient<AlbumDetail>(`/albums/${id}`),

  /** POST /albums — crear álbum (admin/superadmin) */
  createAlbum: (data: { title: string; description?: string | null; coverUrl?: string | null; eventDate?: string | null }) =>
    fetchClient<Album>('/albums', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /albums/:id — actualizar álbum (admin/superadmin) */
  updateAlbum: (id: string, data: Partial<{ title: string; description: string | null; coverUrl: string | null; eventDate: string | null }>) =>
    fetchClient<Album>(`/albums/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** DELETE /albums/:id — eliminar álbum (admin/superadmin) */
  deleteAlbum: (id: string) =>
    fetchClient<void>(`/albums/${id}`, { method: 'DELETE' }),

  /** GET /albums/:id/photos — fotos del álbum */
  getAlbumPhotos: (albumId: string) =>
    fetchClient<Photo[]>(`/albums/${albumId}/photos`),

  /** POST /albums/:id/photos — añadir foto por URL (admin/superadmin) */
  addPhoto: (albumId: string, data: { url: string; thumbnailUrl?: string | null; description?: string | null; location?: string | null; type?: 'photo' | 'video'; takenAt?: string | null }) =>
    fetchClient<Photo>(`/albums/${albumId}/photos`, { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /albums/:id/photos/:photoId — actualizar metadatos de foto (admin/superadmin) */
  updatePhoto: (albumId: string, photoId: string, data: Partial<{ description: string | null; location: string | null; takenAt: string | null }>) =>
    fetchClient<Photo>(`/albums/${albumId}/photos/${photoId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** DELETE /albums/:id/photos/:photoId — eliminar foto (admin/superadmin) */
  deletePhoto: (albumId: string, photoId: string) =>
    fetchClient<void>(`/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }),

  /** PATCH /albums/:id/photos/:photoId/set-cover — establecer foto como portada */
  setAlbumCover: (albumId: string, photoId: string) =>
    fetchClient<void>(`/albums/${albumId}/photos/${photoId}/set-cover`, { method: 'PATCH' }),
};
