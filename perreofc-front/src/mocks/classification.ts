/**
 * Mock data used by the frontend for classification scenarios.
 * These fixtures help screens render predictable examples while developing or testing.
 */

import { ClassificationEntry } from '../types';

export const MOCK_CLASSIFICATION: ClassificationEntry[] = [
  { pos: 1,  teamId: 't01', teamName: 'CD Montaña Alta',     pts: 52, pj: 25, w: 16, d: 4, l: 5,  gf: 48, gc: 22 },
  { pos: 2,  teamId: 't02', teamName: 'Atlético Barrancos',  pts: 49, pj: 25, w: 15, d: 4, l: 6,  gf: 44, gc: 28 },
  { pos: 3,  teamId: 'pfc', teamName: 'Perreo FC',           pts: 47, pj: 25, w: 14, d: 5, l: 6,  gf: 51, gc: 31, isOwn: true },
  { pos: 4,  teamId: 't04', teamName: 'CF Los Pinos',        pts: 43, pj: 25, w: 13, d: 4, l: 8,  gf: 39, gc: 33 },
  { pos: 5,  teamId: 't05', teamName: 'Deportivo Norte',     pts: 41, pj: 25, w: 12, d: 5, l: 8,  gf: 36, gc: 30 },
  { pos: 6,  teamId: 't06', teamName: 'UD Villanueva',       pts: 38, pj: 25, w: 11, d: 5, l: 9,  gf: 33, gc: 34 },
  { pos: 7,  teamId: 't07', teamName: 'SD Ribera',           pts: 35, pj: 25, w: 10, d: 5, l: 10, gf: 30, gc: 35 },
  { pos: 8,  teamId: 't08', teamName: 'Racing Pueblo Nuevo', pts: 32, pj: 25, w: 9,  d: 5, l: 11, gf: 28, gc: 38 },
  { pos: 9,  teamId: 't09', teamName: 'CD Montaña Blanca',   pts: 28, pj: 25, w: 8,  d: 4, l: 13, gf: 27, gc: 42 },
  { pos: 10, teamId: 't10', teamName: 'FC Camino Real',      pts: 24, pj: 25, w: 6,  d: 6, l: 13, gf: 24, gc: 44 },
  { pos: 11, teamId: 't11', teamName: 'Unión Valcárcel',     pts: 21, pj: 25, w: 5,  d: 6, l: 14, gf: 21, gc: 47 },
  { pos: 12, teamId: 't12', teamName: 'AD Palomar',          pts: 18, pj: 25, w: 4,  d: 6, l: 15, gf: 19, gc: 52 },
  { pos: 13, teamId: 't13', teamName: 'CF Arrayán',          pts: 15, pj: 25, w: 4,  d: 3, l: 18, gf: 18, gc: 58 },
  { pos: 14, teamId: 't14', teamName: 'Deportiva Sur',       pts: 11, pj: 25, w: 2,  d: 5, l: 18, gf: 15, gc: 61 },
  { pos: 15, teamId: 't15', teamName: 'CD La Vega',          pts: 8,  pj: 25, w: 1,  d: 5, l: 19, gf: 12, gc: 68 },
];
