import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { taskService, UpdateTaskInput } from '../services/taskService';
import { z } from 'zod';

const updateTaskSchema = z.object({
    title: z.string().optional(),
    type: z.enum(['DEADLINE', 'READING', 'ADMIN', 'CHANGE', 'EVENT']).optional(),
    module: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    links: z.array(z.string()).optional(),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

export async function taskRoutes(fastify: FastifyInstance) {
    // All task routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/tasks/:id - Get single task
    fastify.get<{ Params: { id: string } }>(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;

            try {
                const task = await taskService.getTask(id, user.id);

                if (!task) {
                    return reply.code(404).send({ error: 'Task not found' });
                }

                return { task };
            } catch (error) {
                request.log.error({ error, taskId: id }, 'Failed to fetch task');
                return reply.code(500).send({ error: 'Failed to fetch task' });
            }
        }
    );

    // PATCH /api/tasks/:id - Update task
    fastify.patch<{ Params: { id: string } }>(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;

            try {
                const updates = updateTaskSchema.parse(request.body);

                const task = await taskService.updateTask(id, user.id, updates as UpdateTaskInput);

                return { task };
            } catch (error: any) {
                if (error.name === 'ZodError') {
                    return reply.code(400).send({ error: 'Invalid request data', details: error.errors });
                }

                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }

                request.log.error({ error, taskId: id }, 'Failed to update task');
                return reply.code(500).send({ error: 'Failed to update task' });
            }
        }
    );

    // DELETE /api/tasks/:id - Delete task
    fastify.delete<{ Params: { id: string } }>(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;

            try {
                await taskService.deleteTask(id, user.id);

                return { success: true };
            } catch (error) {
                request.log.error({ error, taskId: id }, 'Failed to delete task');
                return reply.code(500).send({ error: 'Failed to delete task' });
            }
        }
    );

    // POST /api/tasks/:id/complete - Mark task as complete
    fastify.post<{ Params: { id: string } }>(
        '/:id/complete',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;

            try {
                const task = await taskService.completeTask(id, user.id);

                return { task };
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }

                request.log.error({ error, taskId: id }, 'Failed to complete task');
                return reply.code(500).send({ error: 'Failed to complete task' });
            }
        }
    );

    // GET /api/tasks - Get all tasks for user (with filters)
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const { user } = request;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            const query = request.query as any;
            const filters = {
                status: query.status,
                type: query.type,
                limit: query.limit ? parseInt(query.limit) : undefined,
                offset: query.offset ? parseInt(query.offset) : undefined,
            };

            const tasks = await taskService.getTasks(user.id, filters);

            return { tasks };
        } catch (error) {
            request.log.error({ error, userId: user.id }, 'Failed to fetch tasks');
            return reply.code(500).send({ error: 'Failed to fetch tasks' });
        }
    });
}
