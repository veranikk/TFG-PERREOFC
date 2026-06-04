/**
 * Defines shared TypeScript types for the upload backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

export interface UploadResult {
  publicUrl: string;
  path: string;
  bucket: string;
}
