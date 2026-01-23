import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { ProfileService } from '../services/profileService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const profileService = new ProfileService(supabase);

export async function profileRoutes(fastify: FastifyInstance) {
    // Apply auth middleware to all routes
    fastify.addHook('onRequest', authMiddleware);

    /**
     * GET /api/profile
     * Get user profile
     */
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const profile = await profileService.getProfile(userId);

            return reply.send({ profile });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch profile' });
        }
    });

    /**
     * PUT /api/profile/display-name
     * Update display name
     */
    fastify.put('/display-name', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const { displayName } = request.body as { displayName: string };

            if (!displayName || displayName.trim().length === 0) {
                return reply.status(400).send({ error: 'Display name is required' });
            }

            const profile = await profileService.updateDisplayName(userId, displayName.trim());

            return reply.send({ profile });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update display name' });
        }
    });

    /**
     * PUT /api/profile/avatar
     * Update avatar URL
     */
    fastify.put('/avatar', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const { avatarUrl } = request.body as { avatarUrl: string };

            const profile = await profileService.updateAvatarUrl(userId, avatarUrl);

            return reply.send({ profile });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to update avatar' });
        }
    });

    /**
     * GET /api/profile/stats
     * Get user statistics
     */
    fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const stats = await profileService.getStats(userId);

            return reply.send({ stats });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch stats' });
        }
    });

    /**
     * GET /api/profile/achievements
     * Get user achievements
     */
    fastify.get('/achievements', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;
            const achievements = await profileService.getAchievements(userId);

            return reply.send({ achievements });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch achievements' });
        }
    });

    /**
     * DELETE /api/profile/account
     * Delete user account
     */
    fastify.delete('/account', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;

            await profileService.deleteAccount(userId);

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete account' });
        }
    });
}
