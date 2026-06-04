/**
 * API module that wraps backend calls for player images.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { PlayerImage } from '../../../types';

export const playerImagesApi = {
  /** GET /players/:id/images — lista de imágenes del jugador (excluye deleted_at) */
  getImages: async (playerId: string): Promise<PlayerImage[]> => {
    const res = await fetchClient<any>(`/players/${playerId}/images`);
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  /** POST /players/:id/images — añadir imagen al jugador */
  addImage: async (playerId: string, data: { url: string; is_profile: boolean; description?: string }): Promise<PlayerImage> => {
    const res = await fetchClient<any>(`/players/${playerId}/images`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  /** PATCH /players/:id/images/:imageId/set-profile — establecer foto de perfil */
  setProfile: (playerId: string, imageId: string) =>
    fetchClient<PlayerImage>(`/players/${playerId}/images/${imageId}/set-profile`, {
      method: 'PATCH',
    }),

  /** DELETE /players/:id/images/:imageId — eliminar imagen (soft delete) */
  deleteImage: (playerId: string, imageId: string) =>
    fetchClient<void>(`/players/${playerId}/images/${imageId}`, {
      method: 'DELETE',
    }),
};
