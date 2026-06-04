/**
 * Custom React hook for reusable use role logic.
 * It hides stateful behavior behind a small API that components can consume cleanly.
 */

import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types';

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const role: UserRole | null = user?.role ?? null;

  return {
    role,
    isAficionado:  role === 'aficionado',
    isPlayer:      role === 'jugador',
    isAdmin:       role === 'admin' || role === 'superadmin',
    isStrictAdmin: role === 'admin',
    isSuperAdmin:  role === 'superadmin',
    // Puede ver contenido de entrenamiento/convocatorias
    hasSquadAccess: role === 'jugador' || role === 'admin' || role === 'superadmin',
    // Puede crear/editar contenido
    canEdit: role === 'admin' || role === 'superadmin',
    // Tiene sistema de puntos
    hasPoints: role === 'aficionado',
  };
}
