/**
 * Theme definition file for responsive styling tokens.
 * It centralizes visual values so colors, spacing and typography remain consistent.
 */

// src/theme/responsive.ts
// Escala lineal basada en el ancho de pantalla.
// Baseline 390px (iPhone 14 / Android moderno típico).
// En pantallas más pequeñas todo se reduce proporcionalmente.

import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const BASE_WIDTH = 390;

/**
 * Factor de escala entre 0.75 y 1.0.
 * - 390px → 1.00 (sin cambio)
 * - 360px → 0.92
 * - 320px → 0.82
 */
export const scale = Math.min(1.0, Math.max(0.75, SCREEN_W / BASE_WIDTH));

/** Tamaño de fuente responsive — redondea al entero más cercano */
export const rf = (size: number): number => Math.round(size * scale);

/** Espaciado / dimensión responsive — redondea al entero más cercano */
export const rs = (size: number): number => Math.round(size * scale);
