/**
 * Starts the scraper HTTP server.
 * This entry point exposes scraper endpoints and job orchestration at runtime.
 */

import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { env } from './shared/env.js';
import { closeBrowser } from './lib/browser.js';
import { registerRoutes } from './api/index.js';

// ── Server ───────────────────────────────────────────────────────────────────

const app = Fastify({ logger: true });

// CORS: en producción restringe el origen via la variable CORS_ORIGIN.
// En desarrollo (o si no está definida) se permite cualquier origen.
await app.register(cors, {
  origin: env.CORS_ORIGIN ?? true,
  credentials: true,
});

app.setErrorHandler((err: FastifyError, req, reply) => {
  req.log.error(err);
  if (err.statusCode && err.statusCode < 500) {
    return reply.status(err.statusCode).send({ error: err.message, code: err.code ?? 'BAD_REQUEST' });
  }
  return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// ── Register routes ──────────────────────────────────────────────────────────

await registerRoutes(app);

// ── Shutdown & listen ────────────────────────────────────────────────────────

const shutdown = async () => {
  app.log.info('Shutting down...');
  await closeBrowser();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen({ port: env.SCRAPER_PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
