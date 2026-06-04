/**
 * Shared scraper library code for browser.
 * Helpers here handle browser setup, normalization or repeated scraping utilities.
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';

// Singleton del proceso: un único proceso Chromium compartido por todas las operaciones.
// Ventaja: reduce overhead de inicio (~1–2s por lanzamiento).
// Riesgo: si el proceso Chromium crashea, todas las operaciones en vuelo fallan.
// El servidor maneja SIGINT/SIGTERM → closeBrowser(), por lo que el proceso se limpia correctamente.
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  // headless: true — requerido en entornos sin GUI (Docker, CI).
  _browser = await chromium.launch({ headless: true });
  return _browser;
}

/**
 * Crea un contexto aislado (cookies, localStorage, sessionStorage propios) por cada
 * operación de scraping. Esto evita contaminación de estado entre scrapes concurrentes
 * o consecutivos (p.ej. sesiones de login, flags de consentimiento de cookies).
 *
 * El contexto se cierra siempre (éxito o error), garantizando que no queden páginas zombi.
 *
 * Reintentos: en caso de error (típicamente TimeoutError por red lenta), reintenta hasta
 * `retries` veces con backoff exponencial (2s → 4s → …). Cada intento crea un contexto
 * nuevo limpio. Los scrapers son idempotentes, por lo que reintentar es siempre seguro.
 */
export async function withContext<T>(
  fn: (ctx: BrowserContext) => Promise<T>,
  retries = 2
): Promise<T> {
  const browser = await getBrowser();
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Backoff exponencial antes de reintentos (no en el primer intento)
    if (attempt > 0) {
      await new Promise((res) => setTimeout(res, 2000 * Math.pow(2, attempt - 1)));
    }

    const ctx = await browser.newContext({
      // User-agent de Chrome estable en Windows — evita respuestas 403/captcha
      // por user-agents vacíos o de Node.js.
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    // 60s es suficiente para rffm.es en condiciones normales.
    // Si se producen timeouts frecuentes, aumentar a 90-120s antes de escalar reintentos.
    ctx.setDefaultTimeout(60_000);
    ctx.setDefaultNavigationTimeout(60_000);

    try {
      const result = await fn(ctx);
      await ctx.close();
      return result;
    } catch (err) {
      await ctx.close().catch(() => {}); // ignorar errores de cierre en cleanup
      lastErr = err;
    }
  }

  throw lastErr;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
