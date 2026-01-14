import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { homescreenService } from '../services/homescreenService';
import { authMiddleware } from '../middleware/auth';

interface ReorderTasksBody {
    taskIds: string[];
}

export async function homescreenRoutes(fastify: FastifyInstance) {
    // Apply authentication to all homescreen routes
    fastify.addHook('preHandler', authMiddleware);

    /**
     * GET /api/homescreen
     * Fetch all homescreen data in one call
     */
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user!.id;
            const data = await homescreenService.getHomescreenData(userId);
            return reply.send(data);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/homescreen/progress
     * Fetch only progress stats (for quick refresh)
     */
    fastify.get('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user!.id;
            const today = new Date();

            const [todaysTasks, weekTasks] = await Promise.all([
                homescreenService.getTasksForDate(userId, today),
                homescreenService.getWeekTasks(userId),
            ]);

            const progress = homescreenService.calculateProgress(todaysTasks, weekTasks);
            return reply.send(progress);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/homescreen/tasks/:date
     * Fetch tasks for a specific date
     */
    fastify.get('/tasks/:date', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user!.id;
            const { date } = request.params as { date: string };

            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return reply.status(400).send({ error: 'Invalid date format' });
            }

            const tasks = await homescreenService.getTasksForDate(userId, parsedDate);
            return reply.send({ tasks });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    /**
     * POST /api/homescreen/reorder
     * Reorder tasks (for drag-and-drop)
     */
    fastify.post('/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user!.id;
            const { taskIds } = request.body as ReorderTasksBody;

            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                return reply.status(400).send({ error: 'taskIds array is required' });
            }

            await homescreenService.reorderTasks(userId, taskIds);
            return reply.send({ success: true });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });
}
