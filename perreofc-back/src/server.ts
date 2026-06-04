/**
 * Starts the backend HTTP server and registers the API plugin.
 * It is the runtime entry point used when launching the Perreo FC backend.
 */

import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './shared/env.js';
import { apiPlugin } from './api/index.js';

const isDev = env.NODE_ENV === 'development';

const app = Fastify({
  logger: {
    // Configuración del logger: nivel según entorno, coloreado en desarrollo
    level: isDev ? 'debug' : 'info',
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
    // Ocultar datos sensibles en logs (authorization headers, passwords)
    redact: ['req.headers.authorization', 'body.password'],
    // Serializadores personalizados: solo logamos método, URL y status code
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  },
});

// Cabeceras de seguridad HTTP (X-Frame-Options, CSP, HSTS, etc.)
await app.register(helmet, {
  // contentSecurityPolicy desactivado para no romper respuestas JSON
  contentSecurityPolicy: false,
});

// Rate limiting global — límite generoso para tráfico normal de la app.
// Las rutas de auth definen límites propios más estrictos (ver authRoutes.ts).
await app.register(rateLimit, {
  max: 200,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: (_req, context) => ({
    error: `Too many requests — limit: ${context.max} per ${context.after}. Try again later.`,
    code: 'RATE_LIMIT_EXCEEDED',
  }),
});

// CORS: en producción solo se acepta el origen del frontend configurado en FRONTEND_URL.
// En desarrollo se acepta cualquier origen para facilitar el trabajo local.
await app.register(cors, {
  origin: isDev ? true : (env.FRONTEND_URL ?? false),
  credentials: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 50,
  },
});

await app.register(apiPlugin, { prefix: '/api/v1' });

// Handler centralizado de errores: loggea y devuelve respuesta uniforme
app.setErrorHandler((err: FastifyError, req, reply) => {
  const statusCode = err.statusCode ?? 500;
  const context = {
    method: req.method,
    url: req.url,
    statusCode,
    code: err.code,
    userId: (req as any).user?.id,
  };

  // Loggear según gravedad: errores 5xx como error, demás como warn
  if (statusCode >= 500) {
    req.log.error({ err, ...context }, 'Unhandled server error');
  } else {
    req.log.warn({ ...context, message: err.message }, 'Request error');
  }

  // Respuesta: para errores <500 devolver mensaje del error, para 5xx devolver genérico
  if (statusCode < 500) {
    return reply.status(statusCode).send({
      error: err.message,
      code: err.code ?? 'BAD_REQUEST',
    });
  }

  return reply.status(500).send({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

const shutdown = async () => {
  app.log.info('Shutting down...');
  await app.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen({ port: env.API_PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
