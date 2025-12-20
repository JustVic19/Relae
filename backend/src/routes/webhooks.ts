import { FastifyInstance } from 'fastify';

export async function webhookRoutes(fastify: FastifyInstance) {
    // TODO: Implement webhook handlers
    // POST /webhooks/gmail/pubsub - Gmail push notifications
    // POST /webhooks/forward/:userId - Email forwarding

    fastify.post('/gmail/pubsub', async () => {
        return { received: true };
    });

    fastify.post('/forward/:userId', async () => {
        return { received: true };
    });
}
