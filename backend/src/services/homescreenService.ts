import { supabaseAdmin } from '../lib/supabase';
import { Task } from './taskService';

export interface UserHomescreenProfile {
    displayName: string;
    avatarUrl: string | null;
    email: string;
}

export interface TasksByDate {
    [date: string]: Task[];
}

export interface ProgressStats {
    daily: {
        completed: number;
        total: number;
        percentage: number;
    };
    weekly: {
        completed: number;
        total: number;
        percentage: number;
    };
}

export interface HomescreenData {
    user: UserHomescreenProfile;
    todaysTasks: Task[];
    weekTasks: Task[];
    tasksByDate: TasksByDate;
    progress: ProgressStats;
}

export class HomescreenService {
    /**
     * Get user profile for homescreen display
     */
    async getUserHomescreenProfile(userId: string): Promise<UserHomescreenProfile> {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('email, display_name, avatar_url')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error(`Failed to fetch user profile: ${error.message}`);
        }

        return {
            displayName: data.display_name || data.email.split('@')[0],
            avatarUrl: data.avatar_url,
            email: data.email,
        };
    }

    /**
     * Get tasks for a specific date
     */
    async getTasksForDate(userId: string, date: Date): Promise<Task[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .gte('due_date', startOfDay.toISOString())
            .lte('due_date', endOfDay.toISOString())
            .order('sort_order', { ascending: true })
            .order('due_date', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch tasks for date: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get tasks for the upcoming 5 days (for calendar preview)
     */
    async getTasksForDateRange(userId: string, startDate: Date, days: number): Promise<TasksByDate> {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);
        endDate.setHours(23, 59, 59, 999);

        const startOfStart = new Date(startDate);
        startOfStart.setHours(0, 0, 0, 0);

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .gte('due_date', startOfStart.toISOString())
            .lte('due_date', endDate.toISOString())
            .order('sort_order', { ascending: true })
            .order('due_date', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch tasks for date range: ${error.message}`);
        }

        // Group tasks by date
        const tasksByDate: TasksByDate = {};
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateKey = currentDate.toISOString().split('T')[0];
            tasksByDate[dateKey] = [];
        }

        (data || []).forEach((task) => {
            if (task.due_date) {
                const dateKey = task.due_date.split('T')[0];
                if (tasksByDate[dateKey]) {
                    tasksByDate[dateKey].push(task);
                }
            }
        });

        return tasksByDate;
    }

    /**
     * Get tasks for the current week (Monday to Sunday)
     */
    async getWeekTasks(userId: string): Promise<Task[]> {
        const today = new Date();
        const dayOfWeek = today.getDay();
        // Adjust to get Monday (day 1) as start of week
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .gte('due_date', monday.toISOString())
            .lte('due_date', sunday.toISOString());

        if (error) {
            throw new Error(`Failed to fetch week tasks: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Calculate progress stats for daily and weekly
     */
    calculateProgress(todaysTasks: Task[], weekTasks: Task[]): ProgressStats {
        const dailyTotal = todaysTasks.length;
        const dailyCompleted = todaysTasks.filter(t => t.status === 'completed').length;

        const weeklyTotal = weekTasks.length;
        const weeklyCompleted = weekTasks.filter(t => t.status === 'completed').length;

        return {
            daily: {
                completed: dailyCompleted,
                total: dailyTotal,
                percentage: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
            },
            weekly: {
                completed: weeklyCompleted,
                total: weeklyTotal,
                percentage: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
            },
        };
    }

    /**
     * Get all homescreen data in one call
     */
    async getHomescreenData(userId: string): Promise<HomescreenData> {
        const today = new Date();

        const [user, todaysTasks, weekTasks, tasksByDate] = await Promise.all([
            this.getUserHomescreenProfile(userId),
            this.getTasksForDate(userId, today),
            this.getWeekTasks(userId),
            this.getTasksForDateRange(userId, today, 5),
        ]);

        const progress = this.calculateProgress(todaysTasks, weekTasks);

        return {
            user,
            todaysTasks,
            weekTasks,
            tasksByDate,
            progress,
        };
    }

    /**
     * Reorder tasks - update sort_order for a list of task IDs
     */
    async reorderTasks(userId: string, taskIds: string[]): Promise<void> {
        // Update each task with its new sort order
        const updates = taskIds.map((id, index) => ({
            id,
            sort_order: index,
        }));

        for (const update of updates) {
            const { error } = await supabaseAdmin
                .from('tasks')
                .update({ sort_order: update.sort_order })
                .eq('id', update.id)
                .eq('user_id', userId);

            if (error) {
                throw new Error(`Failed to reorder tasks: ${error.message}`);
            }
        }
    }
}

export const homescreenService = new HomescreenService();
