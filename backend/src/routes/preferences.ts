import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { PreferencesService } from '../services/preferencesService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const preferencesService = new PreferencesService(supabase);

export async function preferencesRoutes(fastify: FastifyInstance) {
    // Apply auth middleware to all routes
    fastify.addHook('onRequest', authMiddleware);

    /**
     * GET /api/preferences
     * Get user preferences
     */
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const preferences = await preferencesService.getUserPreferences(userId);

            return reply.send({ preferences });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch preferences' });
        }
    });

    /**
     * PUT /api/preferences/weekly-goal
     * Update weekly goal
     */
    fastify.put('/weekly-goal', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const { weeklyGoal } = request.body as { weeklyGoal: number };

            if (!weeklyGoal || weeklyGoal < 1 || weeklyGoal > 100) {
                return reply.status(400).send({ error: 'Weekly goal must be between 1 and 100' });
            }

            const preferences = await preferencesService.updateWeeklyGoal(userId, weeklyGoal);

            return reply.send({ preferences });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update weekly goal' });
        }
    });

    /**
     * PUT /api/preferences/notification-settings
     * Update notification settings
     */
    fastify.put('/notification-settings', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const { settings } = request.body as { settings: any };

            const preferences = await preferencesService.updateNotificationSettings(userId, settings);

            return reply.send({ preferences });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update notification settings' });
        }
    });

    /**
     * GET /api/preferences/weekly-stats
     * Get weekly stats (last 4 weeks by default)
     */
    fastify.get('/weekly-stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const { weeks } = request.query as { weeks?: string };
            const weeksCount = weeks ? parseInt(weeks, 10) : 4;

            const stats = await preferencesService.getWeeklyStats(userId, weeksCount);

            return reply.send({ stats });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch weekly stats' });
        }
    });

    /**
     * GET /api/preferences/current-week
     * Get current week's stats
     */
    fastify.get('/current-week', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const currentWeek = await preferencesService.getCurrentWeekStats(userId);

            return reply.send({ currentWeek });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch current week stats' });
        }
    });
}
