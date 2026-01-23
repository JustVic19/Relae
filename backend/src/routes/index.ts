import { FastifyInstance } from 'fastify';
import { feedRoutes } from './feed';
import { candidateRoutes } from './candidates';
import { taskRoutes } from './tasks';
import { userRoutes } from './users';
import { integrationRoutes } from './integrations';
import { webhookRoutes } from './webhooks';
import { homescreenRoutes } from './homescreen';
import { preferencesRoutes } from './preferences';
import { notificationRoutes } from './notifications';
import { profileRoutes } from './profile';
import { groupRoutes } from './groups';
import { commentRoutes } from './comments';
import { emailRoutes } from './email';

export async function registerRoutes(fastify: FastifyInstance) {
    // Health check (no auth required)
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API routes
    await fastify.register(homescreenRoutes, { prefix: '/api/homescreen' });
    await fastify.register(preferencesRoutes, { prefix: '/api/preferences' });
    await fastify.register(notificationRoutes, { prefix: '/api/notifications' });
    await fastify.register(profileRoutes, { prefix: '/api/profile' });
    await fastify.register(feedRoutes, { prefix: '/api/feed' });
    await fastify.register(candidateRoutes, { prefix: '/api/candidates' });
    await fastify.register(taskRoutes, { prefix: '/api/tasks' });
    await fastify.register(userRoutes, { prefix: '/api/users' });
    await fastify.register(integrationRoutes, { prefix: '/api/integrations' });
    await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
    await fastify.register(groupRoutes, { prefix: '/api/groups' });
    await fastify.register(commentRoutes, { prefix: '/api' });
    await fastify.register(emailRoutes, { prefix: '/api/email' });
}

