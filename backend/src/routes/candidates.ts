import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { taskCandidateService } from '../services/taskCandidateService';
import { z } from 'zod';

const confirmSchema = z.object({
    title: z.string().optional(),
    type: z.enum(['DEADLINE', 'READING', 'ADMIN', 'CHANGE', 'EVENT']).optional(),
    module: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
});

const editSchema = z.object({
    title: z.string(),
    type: z.enum(['DEADLINE', 'READING', 'ADMIN', 'CHANGE', 'EVENT']),
    module: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
});

const ignoreSchema = z.object({
    reason: z.enum(['not_a_task', 'duplicate', 'spam', 'other']).optional(),
});

export async function candidateRoutes(fastify: FastifyInstance) {
    // All candidate routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // POST /api/candidates/:id/confirm - Confirm candidate and create task
    fastify.post<{ Params: { id: string } }>(
        '/:id/confirm',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;
            const overrides = confirmSchema.parse(request.body || {});

            try {
                const result = await taskCandidateService.confirmCandidate(id, user.id, overrides);
                return { task: result.task };
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }
                if (error.message.includes('already processed')) {
                    return reply.code(400).send({ error: error.message });
                }

                request.log.error({ error, candidateId: id }, 'Failed to confirm candidate');
                return reply.code(500).send({ error: 'Failed to confirm candidate' });
            }
        }
    );

    // POST /api/candidates/:id/edit - Edit candidate before confirming
    fastify.post<{ Params: { id: string } }>(
        '/:id/edit',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;
            const updates = editSchema.parse(request.body);

            try {
                const candidate = await taskCandidateService.editCandidate(id, user.id, updates);
                return { candidate };
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }

                request.log.error({ error, candidateId: id }, 'Failed to edit candidate');
                return reply.code(500).send({ error: 'Failed to edit candidate' });
            }
        }
    );

    // POST /api/candidates/:id/ignore - Ignore candidate
    fastify.post<{ Params: { id: string } }>(
        '/:id/ignore',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;
            const { reason } = ignoreSchema.parse(request.body || {});

            try {
                await taskCandidateService.ignoreCandidate(id, user.id, reason);

                // Log ignore reason for analytics (optional)
                if (reason) {
                    request.log.info({ candidateId: id, reason }, 'Candidate ignored');
                }

                return { success: true };
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }

                request.log.error({ error, candidateId: id }, 'Failed to ignore candidate');
                return reply.code(500).send({ error: 'Failed to ignore candidate' });
            }
        }
    );

    // GET /api/candidates/:id/source - Get source email snippet
    fastify.get<{ Params: { id: string } }>(
        '/:id/source',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { user } = request;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const { id } = request.params;

            try {
                const source = await taskCandidateService.getCandidateSource(id, user.id);
                return { source };
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.code(404).send({ error: error.message });
                }

                request.log.error({ error, candidateId: id }, 'Failed to fetch source');
                return reply.code(500).send({ error: 'Failed to fetch source' });
            }
        }
    );
}
