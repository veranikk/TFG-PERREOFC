/**
 * Mock data used by the frontend for matches scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

import { Match } from '../types';

// Alineación base de Perreo FC (4-3-3) — atacando hacia arriba (y bajos = arriba del campo)
const PERREO_LINEUP = [
  { playerId: 'p1',  name: 'R. García',   dorsal: 1,  position: 'Portero',  x: 50, y: 88 },
  { playerId: 'p3',  name: 'Á. Martín',   dorsal: 3,  position: 'Lateral',  x: 20, y: 73 },
  { playerId: 'p4',  name: 'D. Romero',   dorsal: 4,  position: 'Central',  x: 39, y: 73 },
  { playerId: 'p5',  name: 'S. Torres',   dorsal: 5,  position: 'Central',  x: 61, y: 73 },
  { playerId: 'p2',  name: 'P. Méndez',   dorsal: 2,  position: 'Lateral',  x: 80, y: 73 },
  { playerId: 'p7',  name: 'B. Llorente', dorsal: 7,  position: 'Mediocen.', x: 27, y: 52 },
  { playerId: 'p6',  name: 'J. Muñoz',    dorsal: 6,  position: 'Mediocen.', x: 50, y: 52 },
  { playerId: 'p8',  name: 'C. Ruiz',     dorsal: 8,  position: 'Mediocen.', x: 73, y: 52 },
  { playerId: 'p10', name: 'T. García',   dorsal: 10, position: 'Extremo',  x: 23, y: 30 },
  { playerId: 'p9',  name: 'P. Núñez',    dorsal: 9,  position: 'Delantero', x: 50, y: 22 },
  { playerId: 'p11', name: 'M. Santos',   dorsal: 11, position: 'Extremo',  x: 77, y: 30 },
];

// Alineación rival genérica (4-4-2) — atacando hacia abajo (y altos = abajo del campo)
function rivalLineup(names: string[]) {
  const positions = [
    { x: 50, y: 12 }, // GK
    { x: 20, y: 25 }, // LB
    { x: 39, y: 25 }, // CB
    { x: 61, y: 25 }, // CB
    { x: 80, y: 25 }, // RB
    { x: 20, y: 45 }, // LM
    { x: 38, y: 45 }, // CM
    { x: 62, y: 45 }, // CM
    { x: 80, y: 45 }, // RM
    { x: 37, y: 68 }, // ST
    { x: 63, y: 68 }, // ST
  ];
  return names.map((name, i) => ({
    playerId: `rival-${i}`,
    name,
    dorsal: i + 1,
    position: ['Portero','Lateral','Central','Central','Lateral','Extremo','Mediocentro','Mediocentro','Extremo','Delantero','Delantero'][i],
    x: positions[i].x,
    y: positions[i].y,
  }));
}

export const MOCK_MATCHES: Match[] = [
  // ── JORNADA 22 · VICTORIA EN CASA ──────────────────────────────────────
  {
    id: 'match-001',
    homeTeam: 'Perreo FC',
    awayTeam: 'CD Montaña Blanca',
    homeScore: 3,
    awayScore: 1,
    status: 'finished',
    date: '2026-03-22',
    time: '12:00',
    location: 'Campo Municipal de Perreolandia',
    competition: 'Liga Municipal — Jornada 22',
    stats: {
      possession: [58, 42],
      shots: [14, 7],
      shotsOnTarget: [7, 3],
      corners: [6, 2],
      fouls: [9, 13],
      yellowCards: [1, 3],
      redCards: [0, 0],
    },
    lineup: {
      home: PERREO_LINEUP,
      away: rivalLineup(['P. Iglesias','R. Blanco','M. Sierra','J. Montaña','L. Cuesta','F. Pico','A. Nieve','G. Cumbre','H. Vega','I. Alpe','K. Roca']),
    },
  },
  // ── AMISTOSO · EMPATE FUERA ────────────────────────────────────────────
  {
    id: 'match-002',
    homeTeam: 'FC Retiro',
    awayTeam: 'Perreo FC',
    homeScore: 1,
    awayScore: 1,
    status: 'finished',
    date: '2026-03-29',
    time: '11:00',
    location: 'Campo Municipal de Retiro',
    competition: 'Amistoso de preparación',
    stats: {
      possession: [45, 55],
      shots: [8, 11],
      shotsOnTarget: [3, 4],
      corners: [3, 5],
      fouls: [11, 8],
      yellowCards: [2, 1],
      redCards: [0, 0],
    },
    lineup: {
      home: rivalLineup(['A. Parque','B. Lago','C. Fuente','D. Río','E. Mar','F. Arroyo','G. Bahía','H. Playa','I. Costa','J. Isla','K. Cabo']),
      away: PERREO_LINEUP,
    },
  },
  // ── JORNADA 23 · DERROTA FUERA ────────────────────────────────────────
  {
    id: 'match-003',
    homeTeam: 'Atlético Barrio',
    awayTeam: 'Perreo FC',
    homeScore: 2,
    awayScore: 0,
    status: 'finished',
    date: '2026-04-05',
    time: '17:00',
    location: 'Campo Antonio Fuentes',
    competition: 'Liga Municipal — Jornada 23',
    stats: {
      possession: [52, 48],
      shots: [12, 5],
      shotsOnTarget: [5, 1],
      corners: [7, 2],
      fouls: [8, 14],
      yellowCards: [1, 2],
      redCards: [0, 1],
    },
    lineup: {
      home: rivalLineup(['V. Barrio','W. Calle','X. Plaza','Y. Ronda','Z. Paseo','AA. Glorieta','AB. Avenida','AC. Bulevar','AD. Travesía','AE. Callejón','AF. Carretera']),
      away: PERREO_LINEUP,
    },
  },
  // ── JORNADA 24 · EN DIRECTO (HOY) ────────────────────────────────────
  {
    id: 'match-004',
    homeTeam: 'Perreo FC',
    awayTeam: 'Deportivo Norte',
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    date: '2026-04-11',
    time: '12:00',
    location: 'Campo Municipal de Perreolandia',
    competition: 'Liga Municipal — Jornada 24',
    weather: {
      temp: 18,
      description: 'Soleado',
      humidity: 45,
      wind: 12,
      icon: '☀️',
    },
    stats: {
      possession: [54, 46],
      shots: [7, 4],
      shotsOnTarget: [3, 1],
      corners: [3, 1],
      fouls: [5, 7],
      yellowCards: [0, 1],
      redCards: [0, 0],
    },
    lineup: {
      home: PERREO_LINEUP,
      away: rivalLineup(['N. Norte','O. Septentrión','Q. Boreal','R. Ártico','S. Polar','T. Tramontana','U. Cierzo','V. Nordeste','W. Noroeste','X. Aquilón','Y. Galerna']),
    },
  },
  // ── JORNADA 25 · PRÓXIMO ─────────────────────────────────────────────
  {
    id: 'match-005',
    homeTeam: 'Real Campillo FC',
    awayTeam: 'Perreo FC',
    status: 'upcoming',
    date: '2026-04-19',
    time: '12:00',
    location: 'Estadio El Campillo',
    competition: 'Liga Municipal — Jornada 25',
  },
  // ── COPA REGIONAL · PRÓXIMO ──────────────────────────────────────────
  {
    id: 'match-006',
    homeTeam: 'CF Praderas',
    awayTeam: 'Perreo FC',
    status: 'upcoming',
    date: '2026-04-26',
    time: '17:00',
    location: 'Estadio Las Praderas',
    competition: 'Copa Regional — Octavos de final',
  },
  // ── JORNADA 26 · PRÓXIMO ─────────────────────────────────────────────
  {
    id: 'match-007',
    homeTeam: 'Perreo FC',
    awayTeam: 'Unión Vallecas',
    status: 'upcoming',
    date: '2026-05-03',
    time: '12:00',
    location: 'Campo Municipal de Perreolandia',
    competition: 'Liga Municipal — Jornada 26',
  },
];
