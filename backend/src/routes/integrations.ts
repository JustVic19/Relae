import { FastifyInstance } from 'fastify';

export async function integrationRoutes(fastify: FastifyInstance) {
    // TODO: Implement Gmail OAuth routes
    // POST /api/integrations/gmail/connect
    // POST /api/integrations/gmail/callback
    // POST /api/integrations/forward/setup
    // POST /api/integrations/disconnect
    // GET /api/integrations/status

    fastify.get('/status', async () => {
        return {
            gmail: { connected: false },
            outlook: { connected: false },
            forwarding: { enabled: false },
        };
    });
}
