import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env-fastify' });

const fastify = Fastify({
  logger: true,
  requestIdLogLabel: 'request-id',
  disableRequestLogging: false,
  trustProxy: true
});

// Tipos
interface ChatRequest {
  message: string;
  userId?: string;
  table?: string;
  limit?: number;
}

interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  timestamp?: string;
}

// Middlewares
await fastify.register(fastifyCors, {
  origin: '*', // Restringir en producción
  credentials: true
});

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    n8nWebhook: process.env.N8N_WEBHOOK_URL ? 'configured' : 'not configured'
  };
});

// Chat endpoint - conecta con n8n
fastify.post<{ Body: ChatRequest; Reply: ChatResponse }>(
  '/chat',
  async (request: FastifyRequest<{ Body: ChatRequest }>, reply: FastifyReply) => {
    const { message, userId, table = 'teams', limit = 10 } = request.body;

    // Validaciones
    if (!message || message.trim().length === 0) {
      return reply.code(400).send({
        response: '',
        success: false,
        error: 'El mensaje no puede estar vacío'
      });
    }

    if (message.length > 1000) {
      return reply.code(400).send({
        response: '',
        success: false,
        error: 'El mensaje es demasiado largo (máximo 1000 caracteres)'
      });
    }

    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        fastify.log.error('N8N_WEBHOOK_URL no configurada');
        return reply.code(500).send({
          response: '',
          success: false,
          error: 'Webhook de IA no configurado'
        });
      }

      fastify.log.info({
        action: 'chat_request',
        message: message.substring(0, 100),
        userId,
        table,
        limit
      });

      // Llamar a n8n webhook
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fastify-ChatBot/1.0'
        },
        body: JSON.stringify({
          message,
          userId: userId || null,
          table,
          limit,
          timestamp: new Date().toISOString()
        }),
        // Timeout de 120 segundos (Ollama es lento)
        signal: AbortSignal.timeout(120000)
      });

      // Verificar respuesta HTTP
      if (!response.ok) {
        fastify.log.error({
          action: 'n8n_error',
          status: response.status,
          statusText: response.statusText
        });

        return reply.code(500).send({
          response: '',
          success: false,
          error: `Error en el servidor de IA (${response.statusText})`
        });
      }

      // Parsear respuesta
      const data = (await response.json()) as ChatResponse;

      if (!data.response) {
        fastify.log.warn({
          action: 'empty_response',
          data
        });

        return reply.code(500).send({
          response: '',
          success: false,
          error: 'La IA no generó una respuesta'
        });
      }

      fastify.log.info({
        action: 'chat_response',
        success: true,
        responseLength: data.response.length
      });

      return reply.code(200).send({
        response: data.response,
        success: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      // Timeout específico
      if (err.name === 'AbortError') {
        fastify.log.error('Chat timeout - Ollama tardó mucho');
        return reply.code(504).send({
          response: '',
          success: false,
          error: 'La IA está tardando mucho. Por favor, intenta de nuevo.'
        });
      }

      // Error de conexión
      if (err.code === 'ECONNREFUSED') {
        fastify.log.error('No se pudo conectar a n8n webhook');
        return reply.code(503).send({
          response: '',
          success: false,
          error: 'Servicio de IA no disponible'
        });
      }

      // Error genérico
      fastify.log.error({
        action: 'chat_error',
        error: err.message,
        code: err.code
      });

      return reply.code(500).send({
        response: '',
        success: false,
        error: 'Error procesando tu mensaje'
      });
    }
  }
);

// Chat con tabla específica (ej: /chat/teams, /chat/players)
fastify.post<{ Params: { table: string }; Body: ChatRequest; Reply: ChatResponse }>(
  '/chat/:table',
  async (request: FastifyRequest<{ Params: { table: string }; Body: ChatRequest }>, reply: FastifyReply) => {
    const { table } = request.params;
    const { message, userId, limit = 10 } = request.body;

    // Sanitizar nombre de tabla (prevenir SQL injection)
    if (!/^[a-z_]+$/i.test(table)) {
      return reply.code(400).send({
        response: '',
        success: false,
        error: 'Nombre de tabla inválido'
      });
    }

    // Delegat al endpoint general
    const response = await fastify.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        message,
        userId,
        table,
        limit
      }
    });

    return reply.code(response.statusCode).send(response.json());
  }
);

// Listar tablas disponibles
fastify.get('/chat/available-tables', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    tables: [
      'teams',
      'clubs',
      'players',
      'matches',
      'competitions',
      'classification_entries',
      'top_scorers'
    ],
    description: 'Usa POST /chat/:table para consultar datos específicos'
  };
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

fastify.setErrorHandler((error: Error, request, reply) => {
  fastify.log.error({
    action: 'unhandled_error',
    method: request.method,
    url: request.url,
    error: error.message
  });

  return reply.code(500).send({
    response: '',
    success: false,
    error: 'Error interno del servidor'
  });
});

// ═══════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════

const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3000', 10);

    // Validar configuración
    if (!process.env.N8N_WEBHOOK_URL) {
      fastify.log.warn('⚠️  N8N_WEBHOOK_URL no configurada');
      fastify.log.warn('Asegúrate que está en tu .env:');
      fastify.log.warn('N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat');
    }

    await fastify.listen({ port, host });

    fastify.log.info(`
╔════════════════════════════════════════════════════╗
║     🚀 CHATBOT IA - FASTIFY BACKEND INICIADO     ║
╠════════════════════════════════════════════════════╣
║ URL: http://${host}:${port}
║ Health: http://localhost:${port}/health
║ Chat: POST http://localhost:${port}/chat
║ Tablas: http://localhost:${port}/chat/available-tables
╚════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM señal recibida: cerrando gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  fastify.log.info('SIGINT señal recibida: cerrando gracefully');
  await fastify.close();
  process.exit(0);
});

start();

export default fastify;