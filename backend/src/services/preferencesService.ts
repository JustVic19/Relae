import { SupabaseClient } from '@supabase/supabase-js';

export interface UserPreferences {
    id: string;
    user_id: string;
    weekly_goal: number;
    notification_settings: any;
    created_at: string;
    updated_at: string;
}

export interface WeeklyStat {
    id: string;
    user_id: string;
    week_start: string;
    tasks_completed: number;
    goal_met: boolean;
    created_at: string;
    updated_at: string;
}

export class PreferencesService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Get user preferences, creating default if doesn't exist
     */
    async getUserPreferences(userId: string): Promise<UserPreferences> {
        const { data, error } = await this.supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no preferences exist, create default
            if (error.code === 'PGRST116') {
                return this.createDefaultPreferences(userId);
            }
            throw error;
        }

        return data;
    }

    /**
     * Create default preferences for a user
     */
    private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
        const { data, error } = await this.supabase
            .from('user_preferences')
            .insert({ user_id: userId, weekly_goal: 10 })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update weekly goal
     */
    async updateWeeklyGoal(userId: string, weeklyGoal: number): Promise<UserPreferences> {
        const { data, error } = await this.supabase
            .from('user_preferences')
            .update({ weekly_goal: weeklyGoal })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get weekly stats for the last N weeks
     */
    async getWeeklyStats(userId: string, weeks: number = 4): Promise<WeeklyStat[]> {
        const { data, error } = await this.supabase
            .from('weekly_stats')
            .select('*')
            .eq('user_id', userId)
            .order('week_start', { ascending: false })
            .limit(weeks);

        if (error) throw error;
        return data || [];
    }

    /**
     * Get or create current week's stats
     */
    async getCurrentWeekStats(userId: string): Promise<WeeklyStat> {
        const weekStart = this.getWeekStart(new Date());

        const { data, error } = await this.supabase
            .from('weekly_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('week_start', weekStart)
            .single();

        if (error) {
            // Create if doesn't exist
            if (error.code === 'PGRST116') {
                return this.createWeekStats(userId, weekStart);
            }
            throw error;
        }

        return data;
    }

    /**
     * Create weekly stats entry
     */
    private async createWeekStats(userId: string, weekStart: string): Promise<WeeklyStat> {
        const { data, error } = await this.supabase
            .from('weekly_stats')
            .insert({
                user_id: userId,
                week_start: weekStart,
                tasks_completed: 0,
                goal_met: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Increment task completion for current week
     */
    async incrementWeeklyCompletion(userId: string): Promise<void> {
        const weekStart = this.getWeekStart(new Date());
        const preferences = await this.getUserPreferences(userId);

        // Get or create current week stats
        const currentStats = await this.getCurrentWeekStats(userId);
        const newCount = currentStats.tasks_completed + 1;
        const goalMet = newCount >= preferences.weekly_goal;

        // Update stats
        const { error } = await this.supabase
            .from('weekly_stats')
            .update({
                tasks_completed: newCount,
                goal_met: goalMet,
            })
            .eq('user_id', userId)
            .eq('week_start', weekStart);

        if (error) throw error;
    }

    /**
     * Update notification settings
     */
    async updateNotificationSettings(userId: string, settings: any): Promise<UserPreferences> {
        const { data, error } = await this.supabase
            .from('user_preferences')
            .update({ notification_settings: settings })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get start of week (Monday) for a given date
     */
    private getWeekStart(date: Date): string {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    }
}

export const preferencesService = new PreferencesService(
    // Will be initialized with proper Supabase client in routes
    {} as SupabaseClient
);
