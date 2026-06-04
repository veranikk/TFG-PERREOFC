/**
 * Zustand store for shared use auth store state in the app.
 * Screens read and update this store when the state must survive across routes.
 */

import { create } from 'zustand';
import { User } from '../types';
import { saveSession, loadSession, clearSession } from '../services/auth';
import { removeAuthToken, removeRefreshToken } from '../services/api/apiClient';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  rememberMe: boolean;
  login: (user: User, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  rehydrate: () => Promise<void>;
  addPoints: (delta: number) => void;
  updateUser: (partial: Partial<User>) => void;
}

/** Inicializa la sesión guardada en storage seguro. Se llama al montar la app. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  rememberMe: true,

  /** Guarda la sesión en storage seguro si rememberMe=true y actualiza el estado. */
  login: async (user, rememberMe = true) => {
    if (rememberMe) await saveSession(user);
    set({ user, rememberMe });
  },

  /** Limpia todos los tokens y datos de sesión, vuelve al estado no autenticado. */
  logout: async () => {
    await clearSession();
    await removeAuthToken();
    await removeRefreshToken();
    set({ user: null, isLoading: false, rememberMe: true });
  },

  /** Carga la sesión guardada en storage y actualiza el estado de isLoading. */
  rehydrate: async () => {
    const user = await loadSession();
    set({ user, isLoading: false, rememberMe: true });
  },

  /** Añade puntos al usuario actual (mínimo 0) sin persistir en servidor. */
  addPoints: (delta) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, points: Math.max(0, s.user.points + delta) } }
        : s,
    ),

  /** Actualiza parcialmente el usuario y persiste si rememberMe está activado. */
  updateUser: (partial) =>
    set((s) => {
      if (!s.user) return s;
      const next = { ...s.user, ...partial };
      if (s.rememberMe) saveSession(next);
      return { user: next };
    }),
}));
