/**
 * Mock data used by the frontend for leaderboard scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

import { LeaderboardEntry } from '../types';

export type LeaderboardPeriod = 'total' | 'mensual' | 'semanal';

// ── Total (temporada completa) ────────────────────────────────────────────────
export const MOCK_LEADERBOARD_TOTAL: LeaderboardEntry[] = [
  { rank: 1,  userId: 'u-fan-02', username: 'perreador99',     name: 'Carlos Martínez',   email: 'carlos.martinez@email.com',  points: 2840 },
  { rank: 2,  userId: 'u-fan-03', username: 'gol_de_oro',      name: 'Laura Sánchez',     email: 'laura.sanchez@email.com',    points: 2410 },
  { rank: 3,  userId: 'u-fan-04', username: 'furia_naranja',   name: 'Marcos Pérez',      email: 'marcos.perez@email.com',     points: 1985 },
  { rank: 4,  userId: 'u-fan-05', username: 'tiki_taka_pro',   name: 'Ana García',        email: 'ana.garcia@email.com',       points: 1720 },
  { rank: 5,  userId: 'u-fan-06', username: 'ultra_perreo',    name: 'Javier López',      email: 'javier.lopez@email.com',     points: 1540 },
  { rank: 6,  userId: 'u-fan-07', username: 'melocoton_fcb',   name: 'Sara Fernández',    email: 'sara.fernandez@email.com',   points: 1380 },
  { rank: 7,  userId: 'u-fan-08', username: 'cule_de_corazon', name: 'Diego Romero',      email: 'diego.romero@email.com',     points: 1220 },
  { rank: 8,  userId: 'u-fan-09', username: 'crack_total',     name: 'Paula Jiménez',     email: 'paula.jimenez@email.com',    points: 1050 },
  { rank: 9,  userId: 'u-fan-10', username: 'jugon_eterno',    name: 'Rubén Torres',      email: 'ruben.torres@email.com',     points: 890 },
  { rank: 10, userId: 'u-fan-11', username: 'fanatic_fc',      name: 'Marta Navarro',     email: 'marta.navarro@email.com',    points: 720 },
  { rank: 11, userId: 'user-001', username: 'aficionado1',     name: 'Aficionado Uno',    email: 'aficionado1@email.com',      points: 580, isCurrentUser: true },
  { rank: 12, userId: 'u-fan-12', username: 'balon_de_oro',    name: 'Iván Moreno',       email: 'ivan.moreno@email.com',      points: 430 },
  { rank: 13, userId: 'u-fan-13', username: 'pasion_futbol',   name: 'Cristina Ruiz',     email: 'cristina.ruiz@email.com',    points: 310 },
  { rank: 14, userId: 'u-fan-14', username: 'once_ideal',      name: 'Alberto Díaz',      email: 'alberto.diaz@email.com',     points: 195 },
  { rank: 15, userId: 'u-fan-15', username: 'nuevo_hincha',    name: 'Elena Vega',        email: 'elena.vega@email.com',       points: 80 },
];

// ── Mensual (abril 2026) ──────────────────────────────────────────────────────
export const MOCK_LEADERBOARD_MENSUAL: LeaderboardEntry[] = [
  { rank: 1,  userId: 'u-fan-06', username: 'ultra_perreo',    points: 340 },
  { rank: 2,  userId: 'u-fan-03', username: 'gol_de_oro',      points: 290 },
  { rank: 3,  userId: 'user-001', username: 'aficionado1',     points: 250, isCurrentUser: true },
  { rank: 4,  userId: 'u-fan-02', username: 'perreador99',     points: 210 },
  { rank: 5,  userId: 'u-fan-09', username: 'crack_total',     points: 185 },
  { rank: 6,  userId: 'u-fan-05', username: 'tiki_taka_pro',   points: 160 },
  { rank: 7,  userId: 'u-fan-13', username: 'pasion_futbol',   points: 140 },
  { rank: 8,  userId: 'u-fan-04', username: 'furia_naranja',   points: 120 },
  { rank: 9,  userId: 'u-fan-11', username: 'fanatic_fc',      points: 95 },
  { rank: 10, userId: 'u-fan-07', username: 'melocoton_fcb',   points: 75 },
  { rank: 11, userId: 'u-fan-08', username: 'cule_de_corazon', points: 60 },
  { rank: 12, userId: 'u-fan-10', username: 'jugon_eterno',    points: 45 },
  { rank: 13, userId: 'u-fan-12', username: 'balon_de_oro',    points: 30 },
  { rank: 14, userId: 'u-fan-14', username: 'once_ideal',      points: 20 },
  { rank: 15, userId: 'u-fan-15', username: 'nuevo_hincha',    points: 10 },
];

// ── Semanal (semana del 7-13 abril) ──────────────────────────────────────────
export const MOCK_LEADERBOARD_SEMANAL: LeaderboardEntry[] = [
  { rank: 1,  userId: 'u-fan-13', username: 'pasion_futbol',   points: 150 },
  { rank: 2,  userId: 'user-001', username: 'aficionado1',     points: 130, isCurrentUser: true },
  { rank: 3,  userId: 'u-fan-09', username: 'crack_total',     points: 110 },
  { rank: 4,  userId: 'u-fan-06', username: 'ultra_perreo',    points: 90 },
  { rank: 5,  userId: 'u-fan-03', username: 'gol_de_oro',      points: 80 },
  { rank: 6,  userId: 'u-fan-14', username: 'once_ideal',      points: 70 },
  { rank: 7,  userId: 'u-fan-05', username: 'tiki_taka_pro',   points: 60 },
  { rank: 8,  userId: 'u-fan-02', username: 'perreador99',     points: 50 },
  { rank: 9,  userId: 'u-fan-15', username: 'nuevo_hincha',    points: 40 },
  { rank: 10, userId: 'u-fan-11', username: 'fanatic_fc',      points: 30 },
  { rank: 11, userId: 'u-fan-04', username: 'furia_naranja',   points: 20 },
  { rank: 12, userId: 'u-fan-07', username: 'melocoton_fcb',   points: 15 },
  { rank: 13, userId: 'u-fan-08', username: 'cule_de_corazon', points: 10 },
  { rank: 14, userId: 'u-fan-10', username: 'jugon_eterno',    points: 5 },
  { rank: 15, userId: 'u-fan-12', username: 'balon_de_oro',    points: 0 },
];

// Alias para compatibilidad con api.ts
export const MOCK_LEADERBOARD = MOCK_LEADERBOARD_TOTAL;
