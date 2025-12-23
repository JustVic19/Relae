import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { userService, UpdateUserProfileInput } from '../services/userService';
import { z } from 'zod';

const updateUserSchema = z.object({
    email: z.string().email().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
    // All user routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/users/me - Get current user profile
    fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const profile = await userService.getUserProfile(user.id);

            if (!profile) {
                return reply.code(404).send({ error: 'User profile not found' });
            }

            return { profile };
        } catch (error) {
            request.log.error({ error, userId: user.id }, 'Failed to fetch user profile');
            return reply.code(500).send({ error: 'Failed to fetch user profile' });
        }
    });

    // PATCH /api/users/me - Update current user profile
    fastify.patch('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const updates = updateUserSchema.parse(request.body);

            const profile = await userService.updateUserProfile(user.id, updates as UpdateUserProfileInput);

            return { profile };
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'Invalid request data', details: error.errors });
            }

            if (error.message.includes('not found')) {
                return reply.code(404).send({ error: error.message });
            }

            request.log.error({ error, userId: user.id }, 'Failed to update user profile');
            return reply.code(500).send({ error: 'Failed to update user profile' });
        }
    });
}
