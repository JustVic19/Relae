import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const notificationService = new NotificationService(supabase);

export async function notificationRoutes(fastify: FastifyInstance) {
    // Apply auth middleware to all routes
    fastify.addHook('onRequest', authMiddleware);

    /**
     * GET /api/notifications
     * Get all notifications for the user (paginated)
     */
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
            const { limit, offset } = request.query as { limit?: string; offset?: string };

            const notifications = await notificationService.getUserNotifications(
                userId,
                limit ? parseInt(limit, 10) : 50,
                offset ? parseInt(offset, 10) : 0
            );

            return reply.send({ notifications });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch notifications' });
        }
    });

    /**
     * GET /api/notifications/unread-count
     * Get unread notification count
     */
    fastify.get('/unread-count', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
            const count = await notificationService.getUnreadCount(userId);

            return reply.send({ count });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch unread count' });
        }
    });

    /**
     * POST /api/notifications/:id/mark-read
     * Mark a notification as read
     */
    fastify.post('/:id/mark-read', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const { id } = request.params as { id: string };

            await notificationService.markAsRead(id, userId);

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to mark notification as read' });
        }
    });

    /**
     * POST /api/notifications/mark-all-read
     * Mark all notifications as read
     */
    fastify.post('/mark-all-read', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;

            await notificationService.markAllAsRead(userId);

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to mark all as read' });
        }
    });

    /**
     * POST /api/notifications/push-token
     * Save push token
     */
    fastify.post('/push-token', async (request, reply) => {
        const { token, platform } = request.body as { token: string; platform?: string };
        const userId = request.user?.id;

        if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            await notificationService.savePushToken(userId, token, platform);
            return { success: true };
        } catch (error: any) {
            request.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * DELETE /api/notifications/:id
     * Delete a notification
     */
    fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const { id } = request.params as { id: string };

            await notificationService.deleteNotification(id, userId);

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete notification' });
        }
    });

    /**
     * GET /api/notifications/preferences
     * Get notification preferences
     */
    fastify.get('/preferences', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const preferences = await notificationService.getPreferences(userId);

            return reply.send({ preferences });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch preferences' });
        }
    });

    /**
     * PUT /api/notifications/preferences
     * Update notification preferences
     */
    fastify.put('/preferences', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const updates = request.body as any;

            const preferences = await notificationService.updatePreferences(userId, updates);

            return reply.send({ preferences });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update preferences' });
        }
    });

    /**
     * POST /api/notifications/send-marketing
     * Send a marketing notification to all users (or specified segment)
     * Note: This should be protected with admin auth in production
     */
    fastify.post('/send-marketing', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { title, message, userIds } = request.body as {
                title: string;
                message: string;
                userIds?: string[];
            };

            if (!title || !message) {
                return reply.status(400).send({ error: 'Title and message are required' });
            }

            let targetUserIds = userIds;

            // If no specific users provided, get all users
            if (!targetUserIds) {
                const { data: users, error } = await supabase
                    .from('user_profiles')
                    .select('id');

                if (error || !users) {
                    return reply.status(500).send({ error: 'Failed to fetch users' });
                }

                targetUserIds = users.map(u => u.id);
            }

            const result = await notificationService.sendMarketingNotification(
                targetUserIds,
                title,
                message
            );

            return reply.send({
                success: true,
                sent: result.sent,
                skipped: result.skipped,
                errors: result.errors,
            });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to send marketing notification' });
        }
    });

    /**
     * POST /api/notifications/check-deadlines
     * Manually trigger deadline check (also runs via cron)
     */
    fastify.post('/check-deadlines', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const result = await notificationService.checkUpcomingDeadlines();

            return reply.send({
                success: true,
                notified: result.notified,
                errors: result.errors,
            });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to check deadlines' });
        }
    });
}
