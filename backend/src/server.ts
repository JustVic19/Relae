import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

const fastify = Fastify({
    logger: {
        level: env.LOG_LEVEL,
        transport:
            env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                }
                : undefined,
    },
});

async function start() {
    try {
        // Register plugins
        await fastify.register(cors, {
            origin: env.NODE_ENV === 'development' ? '*' : ['exp://*', 'http://localhost:*'],
            credentials: true,
        });

        // Global error handler
        fastify.setErrorHandler(errorHandler);

        // Auth middleware (decorate request with user)
        fastify.decorateRequest('user', null);

        // Register routes
        await registerRoutes(fastify);

        // Start server
        await fastify.listen({
            port: parseInt(env.PORT),
            host: env.HOST,
        });

        console.log(`
    ╔═══════════════════════════════════════╗
    ║   StudentOS API Server Started 🚀    ║
    ╠═══════════════════════════════════════╣
    ║  Environment: ${env.NODE_ENV.padEnd(23)} ║
    ║  Port: ${env.PORT.padEnd(30)} ║
    ║  Supabase: Connected                  ║
    ╚═══════════════════════════════════════╝
    `);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

// Handle shutdown gracefully
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await fastify.close();
        process.exit(0);
    });
});

start();
