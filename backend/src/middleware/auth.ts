import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAuthToken } from '../lib/supabase';

export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const user = await verifyAuthToken(token);

        // Attach user to request object
        request.user = user;
    } catch (error) {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
}

// Extend Fastify types to include user
declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: string;
            email?: string;
            [key: string]: any;
        } | null;
    }
}
