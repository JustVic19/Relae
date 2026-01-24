import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { webhookService } from '../services/webhookService';

export async function webhookRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/webhooks/revenuecat
     * Handle RevenueCat events
     */
    fastify.post('/revenuecat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Optional: Check for a secret header if you configured one in RC
            // const authHeader = request.headers['authorization'];
            // if (authHeader !== process.env.REVENUECAT_WEBHOOK_SECRET) {
            //     return reply.code(401).send({ error: 'Unauthorized' });
            // }

            const body = request.body as any;
            await webhookService.handleEvent(body);

            return reply.send({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            // Return 200 anyway so RevenueCat doesn't keep retrying if it's our logic error
            return reply.send({ received: true, error: 'Internal processing error' });
        }
    });
}
