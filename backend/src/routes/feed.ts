import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const feedQuerySchema = z.object({
    status: z.enum(['new', 'confirmed', 'all']).optional().default('all'),
});

export async function feedRoutes(fastify: FastifyInstance) {
    // All feed routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/feed - Get all candidates and tasks
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const query = feedQuerySchema.parse(request.query);

        try {
            // Fetch task candidates
            const candidatesQuery = supabaseAdmin
                .from('task_candidates')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (query.status !== 'all') {
                candidatesQuery.eq('status', query.status);
            }

            const { data: candidates, error: candidatesError } = await candidatesQuery;

            if (candidatesError) {
                throw candidatesError;
            }

            // Fetch confirmed tasks
            const { data: tasks, error: tasksError } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('due_date', { ascending: true, nullsFirst: false });

            if (tasksError) {
                throw tasksError;
            }

            return {
                candidates: candidates || [],
                tasks: tasks || [],
            };
        } catch (error) {
            request.log.error({ error, userId: user.id }, 'Failed to fetch feed');
            return reply.code(500).send({ error: 'Failed to fetch feed' });
        }
    });

    // GET /api/feed/new - Get only new candidates to confirm
    fastify.get('/new', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { data, error } = await supabaseAdmin
                .from('task_candidates')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'new')
                .order('confidence_score', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return { candidates: data || [] };
        } catch (error) {
            request.log.error({ error, userId: user.id }, 'Failed to fetch new candidates');
            return reply.code(500).send({ error: 'Failed to fetch new candidates' });
        }
    });

    // GET /api/feed/upcoming - Get upcoming confirmed tasks
    fastify.get('/upcoming', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const { data, error } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('due_date', { ascending: true, nullsFirst: false });

            if (error) {
                throw error;
            }

            return { tasks: data || [] };
        } catch (error) {
            request.log.error({ error, userId: user.id }, 'Failed to fetch upcoming tasks');
            return reply.code(500).send({ error: 'Failed to fetch upcoming tasks' });
        }
    });
}
