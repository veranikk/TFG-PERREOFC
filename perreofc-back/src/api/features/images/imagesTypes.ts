/**
 * Defines shared TypeScript types for the images backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

export interface ImageRecord {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  isProfile: boolean;
  takenAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
}
