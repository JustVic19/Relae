import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) {
    // Log error
    request.log.error({
        err: error,
        url: request.url,
        method: request.method,
    });

    // Zod validation errors
    if (error instanceof ZodError) {
        return reply.code(400).send({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: error.errors,
        });
    }

    // Custom application errors
    if (error.statusCode) {
        return reply.code(error.statusCode).send({
            error: error.name,
            message: error.message,
        });
    }

    // Default 500 error
    return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    });
}
