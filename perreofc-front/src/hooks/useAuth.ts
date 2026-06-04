/**
 * Custom React hook for reusable use auth logic.
 * It hides stateful behavior behind a small API that components can consume cleanly.
 */

import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const { user, isLoading, login, logout } = useAuthStore();
  return { user, isLoading, login, logout, isAuthenticated: !!user };
}
