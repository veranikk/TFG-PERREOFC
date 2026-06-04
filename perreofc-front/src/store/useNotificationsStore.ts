/**
 * Zustand store for shared use notifications store state in the app.
 * Screens read and update this store when the state must survive across routes.
 */

import { create } from 'zustand';
import { notificationsApi } from '../services/api/modules/notifications';

interface NotificationsStore {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (n: number) => void;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      set({ unreadCount: result.count });
    } catch {
      // Silencioso — el badge simplemente no se actualiza en caso de error de red
    }
  },

  setUnreadCount: (n: number) => set({ unreadCount: n }),
}));
