import { FastifyInstance } from 'fastify';
import { supabaseAdmin, supabase } from '../lib/supabase';
import { GroupService } from '../services/groupService';
import { authMiddleware } from '../middleware/auth';

export async function groupRoutes(fastify: FastifyInstance) {
    const groupService = new GroupService(supabaseAdmin);

    // Middleware to check auth
    fastify.addHook('preHandler', authMiddleware);

    // Create a new group
    fastify.post('/', async (request, reply) => {
        const { name, description } = request.body as { name: string; description?: string };
        const user = request.user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            const group = await groupService.createGroup(user.id, name, description);
            return group;
        } catch (error: any) {
            request.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get my groups
    fastify.get('/', async (request, reply) => {
        const user = request.user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            const groups = await groupService.getUserGroups(user.id);
            return groups;
        } catch (error: any) {
            request.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // Join group by code
    fastify.post('/join', async (request, reply) => {
        const { code } = request.body as { code: string };
        const user = request.user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            const result = await groupService.joinGroupByCode(user.id, code);
            return result;
        } catch (error: any) {
            request.log.error(error);
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get group details (members + tasks)
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const details = await groupService.getGroupDetails(id);
            return details;
        } catch (error: any) {
            request.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // Create a shared task within a group
    fastify.post('/:id/tasks', async (request, reply) => {
        const { id: groupId } = request.params as { id: string };
        const { title, due_date, assigned_to } = request.body as {
            title: string;
            due_date?: string;
            assigned_to?: string;
        };

        const user = request.user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            // Using direct supabase call for MVP instead of TaskService rewiring
            const { data: task, error } = await supabase
                .from('tasks')
                .insert({
                    user_id: user.id, // Creator
                    group_id: groupId,
                    title,
                    due_date,
                    assigned_to,
                    status: 'pending',
                    type: 'project' // New type or reuse existing?
                })
                .select()
                .single();

            if (error) throw error;
            return task;

        } catch (error: any) {
            request.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });
}
