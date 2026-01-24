import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { emailIntegrationService } from '../services/emailIntegrationService';
import { emailParserService } from '../services/emailParserService';

export async function emailRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/email/connect/google
     * Get Google OAuth authorization URL
     */
    fastify.get('/connect/google', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const authUrl = emailIntegrationService.getGoogleAuthUrl(userId);
            reply.send({ authUrl, state: userId }); // Include userId in state for callback
        } catch (error) {
            reply.code(500).send({ error: 'Failed to generate Google auth URL' });
        }
    });

    /**
     * GET /api/email/connect/microsoft
     * Get Microsoft OAuth authorization URL
     */
    fastify.get('/connect/microsoft', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const authUrl = await emailIntegrationService.getMicrosoftAuthUrl(userId);
            reply.send({ authUrl, state: userId });
        } catch (error) {
            reply.code(500).send({ error: 'Failed to generate Microsoft auth URL' });
        }
    });

    /**
     * GET /api/email/callback/google
     * Handle Google OAuth callback
     */
    fastify.get('/callback/google', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { code, state } = request.query as { code?: string; state?: string };

            if (!code) {
                return reply.code(400).send({ error: 'Missing authorization code' });
            }

            if (!state) {
                return reply.code(400).send({ error: 'Missing state parameter' });
            }

            const result = await emailIntegrationService.handleGoogleCallback(code, state);

            if (result.success) {
                // Redirect to mobile app with success
                reply.redirect(`exp://localhost:8081/--/email-connected?provider=google&status=success`);
            } else {
                reply.redirect(`exp://localhost:8081/--/email-connected?provider=google&status=error`);
            }
        } catch (error) {
            console.error('Google callback error:', error);
            reply.redirect(`exp://localhost:8081/--/email-connected?provider=google&status=error`);
        }
    });

    /**
     * GET /api/email/callback/microsoft
     * Handle Microsoft OAuth callback
     */
    fastify.get('/callback/microsoft', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { code, state } = request.query as { code?: string; state?: string };

            if (!code) {
                return reply.code(400).send({ error: 'Missing authorization code' });
            }

            if (!state) {
                return reply.code(400).send({ error: 'Missing state parameter' });
            }

            const result = await emailIntegrationService.handleMicrosoftCallback(code, state);

            if (result.success) {
                reply.redirect(`exp://localhost:8081/--/email-connected?provider=microsoft&status=success`);
            } else {
                reply.redirect(`exp://localhost:8081/--/email-connected?provider=microsoft&status=error`);
            }
        } catch (error) {
            console.error('Microsoft callback error:', error);
            reply.redirect(`exp://localhost:8081/--/email-connected?provider=microsoft&status=error`);
        }
    });

    /**
     * GET /api/email/integrations
     * List user's connected email accounts
     */
    fastify.get('/integrations', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const integrations = await emailIntegrationService.getUserIntegrations(userId);

            // Sanitize tokens before sending
            const sanitized = integrations.map(int => ({
                id: int.id,
                provider: int.provider,
                email_address: int.email_address,
                sync_enabled: int.sync_enabled,
                last_synced_at: int.last_synced_at,
                created_at: int.created_at,
            }));

            reply.send({ integrations: sanitized });
        } catch (error) {
            console.error('Get integrations error:', error);
            reply.code(500).send({ error: 'Failed to fetch integrations' });
        }
    });

    /**
     * DELETE /api/email/integrations/:id
     * Disconnect an email account
     */
    fastify.delete('/integrations/:id', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params as { id: string };
            const integrationId = id;
            await emailIntegrationService.disconnectIntegration(integrationId, userId);

            reply.send({ success: true });
        } catch (error) {
            console.error('Disconnect error:', error);
            reply.code(500).send({ error: 'Failed to disconnect integration' });
        }
    });

    /**
     * PATCH /api/email/integrations/:id/toggle
     * Enable/disable sync for an integration
     */
    fastify.patch('/integrations/:id/toggle', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params as { id: string };
            const integrationId = id;
            const { enabled } = request.body as { enabled: boolean };

            if (typeof enabled !== 'boolean') {
                return reply.code(400).send({ error: 'enabled must be a boolean' });
            }

            await emailIntegrationService.toggleSync(integrationId, userId, enabled);
            reply.send({ success: true });
        } catch (error) {
            console.error('Toggle sync error:', error);
            reply.code(500).send({ error: 'Failed to toggle sync' });
        }
    });

    /**
     * POST /api/email/sync/:integrationId
     * Manually trigger email sync for an integration
     */
    fastify.post('/sync/:integrationId', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { integrationId } = request.params as { integrationId: string };

            // Fetch recent emails
            const emails = await emailParserService.fetchGmailEmails(integrationId, 20);

            const extractedTasks = [];

            // Process each email with AI
            for (const email of emails) {
                const extracted = await emailParserService.extractTaskFromEmail(email, userId);

                if (extracted && extracted.confidenceScore >= 0.7) {
                    // Create task
                    const result = await emailParserService.createTaskFromEmail(
                        extracted,
                        email,
                        integrationId,
                        userId
                    );

                    if (result.success) {
                        extractedTasks.push(result.task);
                    }
                }
            }

            reply.send({
                success: true,
                emailsProcessed: emails.length,
                tasksCreated: extractedTasks.length,
                tasks: extractedTasks,
            });
        } catch (error) {
            console.error('Manual sync error:', error);
            reply.code(500).send({ error: 'Email sync failed' });
        }
    });
}

