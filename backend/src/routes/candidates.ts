import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
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
                // Fetch candidate
                const { data: candidate, error: fetchError } = await supabaseAdmin
                    .from('task_candidates')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single();

                if (fetchError || !candidate) {
                    return reply.code(404).send({ error: 'Candidate not found' });
                }

                if (candidate.status !== 'new') {
                    return reply.code(400).send({ error: 'Candidate already processed' });
                }

                // Create task
                const { data: task, error: taskError } = await supabaseAdmin
                    .from('tasks')
                    .insert({
                        candidate_id: candidate.id,
                        user_id: user.id,
                        thread_id: candidate.thread_id,
                        title: overrides.title || candidate.title,
                        type: overrides.type || candidate.type,
                        module: overrides.module || candidate.module,
                        due_date: overrides.due_date || candidate.due_date,
                        notes: overrides.notes,
                        links: candidate.links,
                        status: 'pending',
                    })
                    .select()
                    .single();

                if (taskError) {
                    throw taskError;
                }

                // Update candidate status
                await supabaseAdmin
                    .from('task_candidates')
                    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                    .eq('id', id);

                return { task };
            } catch (error) {
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
                const { data, error } = await supabaseAdmin
                    .from('task_candidates')
                    .update({
                        ...updates,
                        status: 'edited',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                if (!data) {
                    return reply.code(404).send({ error: 'Candidate not found' });
                }

                return { candidate: data };
            } catch (error) {
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
                const { data, error } = await supabaseAdmin
                    .from('task_candidates')
                    .update({
                        status: 'ignored',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                if (!data) {
                    return reply.code(404).send({ error: 'Candidate not found' });
                }

                // Log ignore reason for analytics (optional)
                if (reason) {
                    request.log.info({ candidateId: id, reason }, 'Candidate ignored');
                }

                return { success: true };
            } catch (error) {
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
                const { data: candidate, error: candidateError } = await supabaseAdmin
                    .from('task_candidates')
                    .select('source_message_id')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single();

                if (candidateError || !candidate) {
                    return reply.code(404).send({ error: 'Candidate not found' });
                }

                const { data: sourceMessage, error: sourceError } = await supabaseAdmin
                    .from('source_messages')
                    .select('subject, from_name, from_email, received_at, body_snippet, urls')
                    .eq('id', candidate.source_message_id)
                    .single();

                if (sourceError || !sourceMessage) {
                    return reply.code(404).send({ error: 'Source message not found' });
                }

                return { source: sourceMessage };
            } catch (error) {
                request.log.error({ error, candidateId: id }, 'Failed to fetch source');
                return reply.code(500).send({ error: 'Failed to fetch source' });
            }
        }
    );
}
