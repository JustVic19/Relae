import { apiRequest } from './api';

export interface UserPreferences {
    id: string;
    user_id: string;
    weekly_goal: number;
    notification_settings: {
        daily_briefing: boolean;
        weekly_report: boolean;
        task_reminders: boolean;
        achievements: boolean;
        marketing: boolean;
    };
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

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
    const response = await apiRequest<{ preferences: UserPreferences }>('/api/preferences');
    return response.preferences;
}

/**
 * Update weekly goal
 */
export async function updateWeeklyGoal(weeklyGoal: number): Promise<UserPreferences> {
    const response = await apiRequest<{ preferences: UserPreferences }>('/api/preferences/weekly-goal', {
        method: 'PUT',
        body: JSON.stringify({ weeklyGoal }),
    });
    return response.preferences;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: any): Promise<UserPreferences> {
    const response = await apiRequest<{ preferences: UserPreferences }>('/api/preferences/notification-settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
    });
    return response.preferences;
}

/**
 * Get weekly stats for the last N weeks
 */
export async function getWeeklyStats(weeks: number = 4): Promise<WeeklyStat[]> {
    const response = await apiRequest<{ stats: WeeklyStat[] }>(`/api/preferences/weekly-stats?weeks=${weeks}`);
    return response.stats;
}

/**
 * Get current week's stats
 */
export async function getCurrentWeekStats(): Promise<WeeklyStat | null> {
    const response = await apiRequest<{ currentWeek: WeeklyStat }>('/api/preferences/current-week');
    return response.currentWeek;
}
