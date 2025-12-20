import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    HOST: z.string().default('0.0.0.0'),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),

    // Redis
    REDIS_URL: z.string().url(),

    // Gmail API
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),
    GOOGLE_PUBSUB_TOPIC: z.string().optional(),

    // Encryption
    ENCRYPTION_KEY: z.string().min(32),

    // Email Forwarding
    FORWARDING_DOMAIN: z.string().optional(),
    FORWARDING_SECRET: z.string().optional(),

    // Logging
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
    env = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment variables:');
        console.error(error.errors);
        process.exit(1);
    }
    throw error;
}

export { env };
