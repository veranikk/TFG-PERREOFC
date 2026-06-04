/**
 * API module that wraps backend calls for staff images.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { StaffImage } from '../../../types';

export const staffImagesApi = {
  /** GET /staff/:id/images — lista de imágenes del miembro de staff */
  getImages: async (staffId: string): Promise<StaffImage[]> => {
    const res = await fetchClient<any>(`/staff/${staffId}/images`);
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  /** POST /staff/:id/images — añadir imagen al staff */
  addImage: async (staffId: string, data: { url: string; is_profile: boolean; description?: string }): Promise<StaffImage> => {
    const res = await fetchClient<any>(`/staff/${staffId}/images`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  /** PATCH /staff/:id/images/:imageId/set-profile — establecer foto de perfil */
  setProfile: (staffId: string, imageId: string) =>
    fetchClient<StaffImage>(`/staff/${staffId}/images/${imageId}/set-profile`, {
      method: 'PATCH',
    }),

  /** DELETE /staff/:id/images/:imageId — eliminar imagen (soft delete) */
  deleteImage: (staffId: string, imageId: string) =>
    fetchClient<void>(`/staff/${staffId}/images/${imageId}`, {
      method: 'DELETE',
    }),
};
