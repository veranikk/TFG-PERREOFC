/**
 * Central frontend configuration for environment-dependent app values.
 * It keeps API URLs and runtime constants in one place for services and screens.
 */

// src/config.ts
// Constantes de configuración de la app Perreo FC.
// Si algún valor puede variar según entorno, añadirlo como EXPO_PUBLIC_* en .env.

/** ID del equipo Perreo FC en el sistema de la RFFM (federación) — string para llamadas a la API. */
export const PERREOFC_TEAM_ID = '24141910';

/** Mismo ID como número — para comparar con Match.homeTeamId / awayTeamId (tipados como number). */
export const PERREOFC_TEAM_ID_NUM = 24141910;
