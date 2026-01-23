import { supabase } from '../lib/supabase';

// Types matching backend
export type TaskType = 'DEADLINE' | 'READING' | 'ADMIN' | 'CHANGE' | 'EVENT';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
    id: string;
    candidate_id: string;
    user_id: string;
    thread_id: string | null;
    title: string;
    type: TaskType;
    module: string | null;
    due_date: string | null;
    notes: string | null;
    links: string[] | null;
    status: TaskStatus;
    sort_order: number;
    created_at: string;
    completed_at: string | null;
}

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
    completedTasks: Task[];
    tasksByDate: TasksByDate;
    progress: ProgressStats;
}

export interface CreateTaskInput {
    title: string;
    type: TaskType;
    due_date?: string;
    module?: string;
    notes?: string;
}

class HomescreenService {
    /**
     * Fetch user profile for homescreen
     */
    async getUserProfile(): Promise<UserHomescreenProfile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('user_profiles')
            .select('email, display_name, avatar_url')
            .eq('id', user.id)
            .single();

        if (error) throw new Error(error.message);

        return {
            displayName: data.display_name || data.email.split('@')[0],
            avatarUrl: data.avatar_url,
            email: data.email,
        };
    }

    /**
     * Fetch tasks for a specific date
     * For the homescreen, we show all upcoming tasks (today and future)
     */
    async getTasksForDate(date: Date): Promise<Task[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['pending', 'in_progress']) // Show pending and in_progress tasks
            .gte('due_date', startOfDay.toISOString()) // Tasks from today onwards
            .order('due_date', { ascending: true })
            .order('sort_order', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    }

    /**
     * Fetch tasks for the week (Monday to Sunday)
     */
    async getWeekTasks(): Promise<Task[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .gte('due_date', monday.toISOString())
            .lte('due_date', sunday.toISOString());

        if (error) throw new Error(error.message);
        return data || [];
    }

    /**
     * Fetch recently completed tasks (last 7 days)
     */
    async getCompletedTasks(): Promise<Task[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', sevenDaysAgo.toISOString())
            .order('completed_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    }

    /**
     * Fetch tasks for the next 5 days (for calendar preview)
     */
    async getTasksForDateRange(startDate: Date, days: number): Promise<TasksByDate> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);
        endDate.setHours(23, 59, 59, 999);

        const startOfStart = new Date(startDate);
        startOfStart.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .gte('due_date', startOfStart.toISOString())
            .lte('due_date', endDate.toISOString())
            .order('sort_order', { ascending: true })
            .order('due_date', { ascending: true });

        if (error) throw new Error(error.message);

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
     * Calculate progress stats
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
     * Fetch all homescreen data in one call
     */
    async getHomescreenData(): Promise<HomescreenData> {
        const today = new Date();

        const [user, todaysTasks, weekTasks, completedTasks, tasksByDate] = await Promise.all([
            this.getUserProfile(),
            this.getTasksForDate(today),
            this.getWeekTasks(),
            this.getCompletedTasks(),
            this.getTasksForDateRange(today, 5),
        ]);

        const progress = this.calculateProgress(todaysTasks, weekTasks);

        return {
            user,
            todaysTasks,
            weekTasks,
            completedTasks,
            tasksByDate,
            progress,
        };
    }

    /**
     * Complete a task
     */
    async completeTask(taskId: string): Promise<Task> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Uncomplete a task (set back to pending)
     */
    async uncompleteTask(taskId: string): Promise<Task> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tasks')
            .update({
                status: 'pending',
                completed_at: null,
            })
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Delete a task
     */
    async deleteTask(taskId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', user.id);

        if (error) throw new Error(error.message);
    }

    /**
     * Update a task
     */
    async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Create a quick task (for quick-add button)
     * Quick tasks are created directly without email parsing candidates
     */
    async createQuickTask(input: CreateTaskInput): Promise<Task> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // For quick-add, we create the task directly without a candidate
        // The candidate flow is for email-parsed tasks
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                candidate_id: null, // No candidate for quick-add tasks
                title: input.title,
                type: input.type,
                module: input.module || null,
                due_date: input.due_date || null,
                notes: input.notes || null,
                status: 'pending',
                sort_order: 0,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Reorder tasks
     */
    async reorderTasks(taskIds: string[]): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Update each task with its new sort order
        for (let i = 0; i < taskIds.length; i++) {
            const { error } = await supabase
                .from('tasks')
                .update({ sort_order: i })
                .eq('id', taskIds[i])
                .eq('user_id', user.id);

            if (error) throw new Error(error.message);
        }
    }

    /**
     * Update user display name
     */
    async updateDisplayName(displayName: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('user_profiles')
            .update({ display_name: displayName })
            .eq('id', user.id);

        if (error) throw new Error(error.message);
    }
}

export const homescreenService = new HomescreenService();
