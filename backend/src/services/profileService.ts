import { SupabaseClient } from '@supabase/supabase-js';

export interface UserStats {
    user_id: string;
    total_completed: number;
    current_streak: number;
    best_streak: number;
    last_completion_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface Achievement {
    id: string;
    user_id: string;
    achievement_type: AchievementType;
    unlocked_at: string;
    created_at: string;
}

export type AchievementType =
    | 'first_task'       // Complete first task
    | 'early_bird'       // Complete 5 tasks before 9 AM
    | 'night_owl'        // Complete 5 tasks after 9 PM
    | 'consistent'       // 7-day streak
    | 'dedicated'        // 30-day streak
    | 'speed_demon'      // 10 tasks in one day
    | 'half_century'     // 50 total tasks
    | 'century'          // 100 total tasks
    | 'weekly_warrior';  // Hit weekly goal 4 weeks in a row

export interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
}

export class ProfileService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Get user profile
     */
    async getProfile(userId: string): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('id, display_name, email, avatar_url, created_at')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update display name
     */
    async updateDisplayName(userId: string, displayName: string): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .update({ display_name: displayName })
            .eq('id', userId)
            .select('id, display_name, email, avatar_url, created_at')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update avatar URL
     */
    async updateAvatarUrl(userId: string, avatarUrl: string): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', userId)
            .select('id, display_name, email, avatar_url, created_at')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete user account (soft delete - mark inactive)
     */
    async deleteAccount(userId: string): Promise<void> {
        // In a real app, you'd want to:
        // 1. Mark user as deleted/inactive
        // 2. Anonymize data
        // 3. Delete from auth system
        // For now, we'll just delete the profile
        const { error } = await this.supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }

    /**
     * Get user statistics
     */
    async getStats(userId: string): Promise<UserStats> {
        const { data, error } = await this.supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no stats exist, create them
            if (error.code === 'PGRST116') {
                return this.createDefaultStats(userId);
            }
            throw error;
        }

        return data;
    }

    /**
     * Create default stats for a user
     */
    private async createDefaultStats(userId: string): Promise<UserStats> {
        const { data, error } = await this.supabase
            .from('user_stats')
            .insert({
                user_id: userId,
                total_completed: 0,
                current_streak: 0,
                best_streak: 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update user statistics (called after task completion)
     */
    async updateStats(userId: string): Promise<UserStats> {
        // Get current stats
        const stats = await this.getStats(userId);

        // Calculate new values
        const today = new Date().toISOString().split('T')[0];
        const lastDate = stats.last_completion_date;

        let newStreak = stats.current_streak;

        if (!lastDate) {
            // First completion
            newStreak = 1;
        } else {
            const lastDateTime = new Date(lastDate).getTime();
            const todayTime = new Date(today).getTime();
            const daysDiff = Math.floor((todayTime - lastDateTime) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Same day, keep streak
                newStreak = stats.current_streak;
            } else if (daysDiff === 1) {
                // Consecutive day, increment streak
                newStreak = stats.current_streak + 1;
            } else {
                // Streak broken, reset to 1
                newStreak = 1;
            }
        }

        const newBestStreak = Math.max(newStreak, stats.best_streak);

        // Update stats
        const { data, error } = await this.supabase
            .from('user_stats')
            .update({
                total_completed: stats.total_completed + 1,
                current_streak: newStreak,
                best_streak: newBestStreak,
                last_completion_date: today,
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get user achievements
     */
    async getAchievements(userId: string): Promise<Achievement[]> {
        const { data, error } = await this.supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Unlock achievement for user
     */
    async unlockAchievement(userId: string, type: AchievementType): Promise<Achievement | null> {
        // Check if already unlocked
        const { data: existing } = await this.supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .eq('achievement_type', type)
            .single();

        if (existing) {
            return null; // Already unlocked
        }

        const { data, error } = await this.supabase
            .from('achievements')
            .insert({
                user_id: userId,
                achievement_type: type,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Check and unlock achievements based on stats
     */
    async checkAchievements(userId: string): Promise<Achievement[]> {
        const stats = await this.getStats(userId);
        const unlocked: Achievement[] = [];

        // First task
        if (stats.total_completed === 1) {
            const achievement = await this.unlockAchievement(userId, 'first_task');
            if (achievement) unlocked.push(achievement);
        }

        // Half century
        if (stats.total_completed === 50) {
            const achievement = await this.unlockAchievement(userId, 'half_century');
            if (achievement) unlocked.push(achievement);
        }

        // Century
        if (stats.total_completed === 100) {
            const achievement = await this.unlockAchievement(userId, 'century');
            if (achievement) unlocked.push(achievement);
        }

        // Consistent (7-day streak)
        if (stats.current_streak === 7) {
            const achievement = await this.unlockAchievement(userId, 'consistent');
            if (achievement) unlocked.push(achievement);
        }

        // Dedicated (30-day streak)
        if (stats.current_streak === 30) {
            const achievement = await this.unlockAchievement(userId, 'dedicated');
            if (achievement) unlocked.push(achievement);
        }

        return unlocked;
    }
}
