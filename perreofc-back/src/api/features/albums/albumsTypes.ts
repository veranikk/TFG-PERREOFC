/**
 * Defines shared TypeScript types for the albums backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

export interface AlbumRecord {
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

export interface PhotoRecord {
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
