import { FastifyInstance } from 'fastify';
import { feedRoutes } from './feed';
import { candidateRoutes } from './candidates';
import { integrationRoutes } from './integrations';
import { webhookRoutes } from './webhooks';

export function setupRoutes(fastify: FastifyInstance) {
    // API routes (all require auth except webhooks)
    fastify.register(feedRoutes, { prefix: '/api/feed' });
    fastify.register(candidateRoutes, { prefix: '/api/candidates' });
    fastify.register(integrationRoutes, { prefix: '/api/integrations' });

    // Webhook routes (external, use secret verification)
    fastify.register(webhookRoutes, { prefix: '/webhooks' });
}
