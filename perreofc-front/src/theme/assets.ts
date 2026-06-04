/**
 * Theme definition file for assets styling tokens.
 * It centralizes visual values so colors, spacing and typography remain consistent.
 */

// src/theme/assets.ts
// Punto centralizado de require() para todos los assets de marca.
// Cada TODO indica un archivo que Vera exportará desde Figma y colocará
// en /assets/brand/ con el nombre exacto indicado.

// TODO: reemplazar por archivo real exportado de Figma → assets/brand/logo-main.png
export const logoMain =
  require('../../assets/brand/logo-main.png') as number | undefined;

// TODO: reemplazar por archivo real exportado de Figma → assets/brand/logo-splash.png
export const logoSplash =
  require('../../assets/brand/logo-splash.png') as number | undefined;

// TODO: reemplazar por archivo real exportado de Figma → assets/brand/mascota-melocoton.png
export const mascota =
  require('../../assets/brand/mascota-melocoton.png') as number | undefined;

// TODO: reemplazar por archivo real exportado de Figma → assets/brand/player-placeholder.png
export const playerPlaceholder =
  require('../../assets/brand/player-placeholder.png') as number | undefined;

// TODO: reemplazar por archivo real exportado de Figma → assets/brand/user-placeholder.png
export const userPlaceholder =
  require('../../assets/brand/user-placeholder.png') as number | undefined;
