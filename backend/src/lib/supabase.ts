import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Admin client (service role) for backend operations
export const supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Regular client (anon key) for user-scoped operations
export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
);

// Helper to verify JWT token from mobile app
export async function verifyAuthToken(token: string) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
        throw new Error('Invalid or expired token');
    }

    return data.user;
}
