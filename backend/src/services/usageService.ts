import { supabaseAdmin } from '../lib/supabase';

export class UsageService {
    /**
     * Check and increment daily AI usage
     * Returns true if allowed, throws error if limit reached
     */
    async checkAndIncrementAiUsage(userId: string): Promise<void> {
        // 1. Fetch user profile
        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('is_pro, daily_ai_scans, last_ai_usage_date')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            console.error('Error fetching profile for limits:', error);
            // Fail open for UX, but log error
            return;
        }

        // 2. Check Pro Status
        if (profile.is_pro) {
            return; // Unlimited for Pro
        }

        // 3. Check Date Reset (Lazy logic fallback)
        const today = new Date().toISOString().split('T')[0];
        let currentCount = profile.daily_ai_scans || 0;

        if (profile.last_ai_usage_date !== today) {
            currentCount = 0;
            // Reset in DB
            await supabaseAdmin.from('user_profiles').update({
                daily_ai_scans: 0,
                last_ai_usage_date: today
            }).eq('id', userId);
        }

        // 4. Check Limit

        const LIMIT = 3;

        if (currentCount >= LIMIT) {
            throw new Error(`Daily AI limit reached (${LIMIT}). Upgrade to Pro for unlimited scans.`);
        }

        // 5. Increment Usage
        await supabaseAdmin.from('user_profiles').update({
            daily_ai_scans: currentCount + 1
        }).eq('id', userId);
    }
}

export const usageService = new UsageService();
