import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { CommentService } from '../services/commentService';
import { authMiddleware } from '../middleware/auth';

export async function commentRoutes(fastify: FastifyInstance) {
    const commentService = new CommentService(supabase);

    // Get comments for a task
    fastify.get<{ Params: { id: string } }>('/tasks/:id/comments', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const comments = await commentService.getTaskComments(id);
        return { comments };
    });

    // Add a comment to a task
    fastify.post<{ Params: { id: string }, Body: { content: string } }>('/tasks/:id/comments', {
        preHandler: authMiddleware
    }, async (request: FastifyRequest<{ Params: { id: string }, Body: { content: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { content } = request.body;
        const { user } = request;

        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const comment = await commentService.createComment(id, user.id, content);
        return { comment };
    });
}
