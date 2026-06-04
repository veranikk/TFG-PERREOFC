/**
 * Provides shared backend infrastructure for logger.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */

import { env } from './env.js';

const isDev = env.NODE_ENV === 'development';

/**
 * Logger ligero para usar en servicios y capas sin acceso a req.log.
 * Emite JSON estructurado (igual que Pino) o líneas coloreadas en desarrollo.
 * Para logging en contexto de request, usar siempre req.log (Fastify/Pino).
 */
function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  bindings: Record<string, unknown>,
  msg: string,
) {
  if (isDev) {
    const time = new Date().toTimeString().slice(0, 8);
    const bindingsStr = Object.keys(bindings).length
      ? ' ' + JSON.stringify(bindings)
      : '';
    const line = `${time} [${level.toUpperCase()}] ${msg}${bindingsStr}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  } else {
    const entry = { level, time: new Date().toISOString(), msg, ...bindings };
    if (level === 'error') console.error(JSON.stringify(entry));
    else if (level === 'warn') console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (bindings: Record<string, unknown>, msg: string) => log('debug', bindings, msg),
  info:  (bindings: Record<string, unknown>, msg: string) => log('info',  bindings, msg),
  warn:  (bindings: Record<string, unknown>, msg: string) => log('warn',  bindings, msg),
  error: (bindings: Record<string, unknown>, msg: string) => log('error', bindings, msg),
};
