/**
 * Mock data used by the frontend for users scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

import { User } from '../types';

// Credenciales mock — hardcoded para desarrollo
// TODO: eliminar cuando exista backend real
export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'u1',
    email: 'user@perreofc.com',
    password: 'perreo@2026',
    username: 'prueba_aficionado',
    firstName: 'Prueba',
    lastName: 'Aficionado',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 800,
    banned: false,
    createdAt: '2025-09-01T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'player@perreofc.com',
    password: 'perreo@2026',
    username: 'prueba_jugador',
    firstName: 'Prueba',
    lastName: 'Jugador',
    role: 'jugador',
    avatarUrl: undefined,
    points: 0,
    banned: false,
    createdAt: '2025-08-15T10:00:00Z',
  },
  {
    id: 'u3',
    email: 'admin@perreofc.com',
    password: 'perreo@2026',
    username: 'prueba_admin',
    firstName: 'Prueba',
    lastName: 'Admin',
    role: 'admin',
    avatarUrl: undefined,
    points: 0,
    banned: false,
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'u4',
    email: 'superadmin@perreofc.com',
    password: 'perreo@2026',
    username: 'prueba_superadmin',
    firstName: 'Prueba',
    lastName: 'Superadmin',
    role: 'superadmin',
    avatarUrl: undefined,
    points: 0,
    banned: false,
    createdAt: '2025-01-01T10:00:00Z',
  },
  // Usuarios extra para poblar la lista de gestión de usuarios
  {
    id: 'u5',
    email: 'madridpeach@perreofc.com',
    password: 'perreo@2026',
    username: 'MadridPeach',
    firstName: 'Miguel',
    lastName: 'Torres',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 1490,
    banned: false,
    createdAt: '2025-09-10T10:00:00Z',
  },
  {
    id: 'u6',
    email: 'gavilover@perreofc.com',
    password: 'perreo@2026',
    username: 'GaviLover',
    firstName: 'Andrea',
    lastName: 'Ruiz',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 1205,
    banned: false,
    createdAt: '2025-09-12T10:00:00Z',
  },
  {
    id: 'u7',
    email: 'perreofan99@perreofc.com',
    password: 'perreo@2026',
    username: 'PerreoFan99',
    firstName: 'Iván',
    lastName: 'López',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 1800,
    banned: false,
    createdAt: '2025-09-05T10:00:00Z',
  },
  {
    id: 'u8',
    email: 'peachking@perreofc.com',
    password: 'perreo@2026',
    username: 'PeachKing',
    firstName: 'Daniel',
    lastName: 'Fernández',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 1000,
    banned: false,
    createdAt: '2025-09-20T10:00:00Z',
  },
  {
    id: 'u9',
    email: 'sumaiya@perreofc.com',
    password: 'perreo@2026',
    username: 'Sumaiya',
    firstName: 'Sumaiya',
    lastName: 'Ahmed',
    role: 'aficionado',
    avatarUrl: undefined,
    points: 900,
    banned: false,
    createdAt: '2025-10-01T10:00:00Z',
  },
];

export function mockLogin(
  email: string,
  password: string,
): (User & { password: string }) | null {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  return user ?? null;
}
