import { FastifyInstance } from 'fastify';
import { feedRoutes } from './feed';
import { candidateRoutes } from './candidates';
import { taskRoutes } from './tasks';
import { userRoutes } from './users';
import { integrationRoutes } from './integrations';
import { webhookRoutes } from './webhooks';

export async function registerRoutes(fastify: FastifyInstance) {
    // Health check (no auth required)
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API routes
    await fastify.register(feedRoutes, { prefix: '/api/feed' });
    await fastify.register(candidateRoutes, { prefix: '/api/candidates' });
    await fastify.register(taskRoutes, { prefix: '/api/tasks' });
    await fastify.register(userRoutes, { prefix: '/api/users' });
    await fastify.register(integrationRoutes, { prefix: '/api/integrations' });
    await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
}
