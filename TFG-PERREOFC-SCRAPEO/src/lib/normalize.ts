/**
 * Shared scraper library code for normalize.
 * Helpers here handle browser setup, normalization or repeated scraping utilities.
 */

// ---------------------------------------------------------------------------
// Helpers de parseo/normalización compartidos por todos los scrapers.
// Centralizar aquí evita drift entre implementaciones duplicadas.
// ---------------------------------------------------------------------------

/**
 * Garantiza string limpio (trim). Devuelve '' si el valor no es string.
 * Uso: limpiar campos de la respuesta __NEXT_DATA__ donde el tipo puede ser
 * any (el JSON de rffm.es a veces trae números donde se esperan strings).
 */
export function trim(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

/**
 * Parsea entero. Lanza Error si el resultado es NaN.
 * Usar cuando el campo es obligatorio y su ausencia es un dato corrupto.
 */
export function toInt(s: unknown): number {
  const n = parseInt(String(s), 10);
  if (Number.isNaN(n)) throw new Error(`toInt: valor no entero → ${JSON.stringify(s)}`);
  return n;
}

/**
 * Parsea entero o devuelve null si el valor es vacío/undefined/null/NaN.
 * Usar para campos opcionales del acta (dorsal, venue_id, etc.).
 */
export function toIntOrNull(s: unknown): number | null {
  if (s === null || s === undefined || String(s).trim() === '') return null;
  const n = parseInt(String(s), 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Parsea entero o devuelve 0. Usar para contadores que nunca deben ser null
 * (goles, partidos jugados, puntos, etc.).
 */
export function toIntOrZero(s: unknown): number {
  return toIntOrNull(s) ?? 0;
}

/**
 * Parsea float o devuelve null. Usar para ratios (goles_por_partido).
 */
export function toFloatOrNull(s: unknown): number | null {
  if (s === null || s === undefined || String(s).trim() === '') return null;
  const n = parseFloat(String(s));
  return Number.isNaN(n) ? null : n;
}

/**
 * Prefija URLs relativas de rffm.es con el dominio base.
 * rffm.es devuelve escudos/fotos con rutas relativas ("/storage/escudos/123.png").
 * Devuelve null si el valor está vacío.
 */
export function prefixRffmUrl(s: unknown): string | null {
  const t = trim(s);
  if (!t) return null;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `https://www.rffm.es${t.startsWith('/') ? '' : '/'}${t}`;
}

// ---------------------------------------------------------------------------
// Utilidades de formato de datos
// ---------------------------------------------------------------------------

/**
 * Parsea un nombre completo en formato "APELLIDOS, NOMBRE".
 * Ejemplos:
 *   "OCAÑA GARCIA, DANIEL"         → { last_name: "OCAÑA GARCIA", first_name: "DANIEL" }
 *   "ALGUACIL DEL BARRIO, OSCAR"   → { last_name: "ALGUACIL DEL BARRIO", first_name: "OSCAR" }
 *   "MARTIN, JAVIER ANTONIO"       → { last_name: "MARTIN", first_name: "JAVIER ANTONIO" }
 *
 * Si no hay coma, devuelve ambos como null (no inventamos).
 */
export function splitFullName(fullName: string): {
  first_name: string | null;
  last_name: string | null;
} {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(',');
  if (idx < 0) return { first_name: null, last_name: null };

  const last = trimmed.slice(0, idx).trim();
  const first = trimmed.slice(idx + 1).trim();
  return {
    first_name: first || null,
    last_name: last || null,
  };
}

/**
 * Convierte fecha DD-MM-YYYY (o DD/MM/YYYY) a ISO YYYY-MM-DD.
 * Devuelve null si es inválida o vacía.
 */
export function parseDateDMY(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Valida hora HH:MM. Devuelve null si vacía o mal formada.
 */
export function parseTimeHM(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}
