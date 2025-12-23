import { supabaseAdmin } from '../lib/supabase';

export type TaskType = 'DEADLINE' | 'READING' | 'ADMIN' | 'CHANGE' | 'EVENT';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

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
    created_at: string;
    completed_at: string | null;
}

export interface CreateTaskInput {
    candidate_id: string;
    user_id: string;
    thread_id?: string | null;
    title: string;
    type: TaskType;
    module?: string | null;
    due_date?: string | null;
    notes?: string | null;
    links?: string[];
}

export interface UpdateTaskInput {
    title?: string;
    type?: TaskType;
    module?: string | null;
    due_date?: string | null;
    notes?: string | null;
    links?: string[];
    status?: TaskStatus;
}

export interface TaskFilters {
    status?: TaskStatus;
    type?: TaskType;
    limit?: number;
    offset?: number;
}

export class TaskService {
    /**
     * Create a new task
     */
    async createTask(input: CreateTaskInput): Promise<Task> {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                candidate_id: input.candidate_id,
                user_id: input.user_id,
                thread_id: input.thread_id || null,
                title: input.title,
                type: input.type,
                module: input.module || null,
                due_date: input.due_date || null,
                notes: input.notes || null,
                links: input.links || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }

        return data;
    }

    /**
     * Get a single task by ID
     */
    async getTask(taskId: string, userId: string): Promise<Task | null> {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch task: ${error.message}`);
        }

        return data;
    }

    /**
     * Get tasks for a user with optional filters
     */
    async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true, nullsFirst: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Update a task
     */
    async updateTask(taskId: string, userId: string, updates: UpdateTaskInput): Promise<Task> {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Task not found or access denied');
            }
            throw new Error(`Failed to update task: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete a task
     */
    async deleteTask(taskId: string, userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }

    /**
     * Mark a task as complete
     */
    async completeTask(taskId: string, userId: string): Promise<Task> {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Task not found or access denied');
            }
            throw new Error(`Failed to complete task: ${error.message}`);
        }

        return data;
    }

    /**
     * Get upcoming tasks (pending, sorted by due date)
     */
    async getUpcomingTasks(userId: string, limit: number = 10): Promise<Task[]> {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .not('due_date', 'is', null)
            .order('due_date', { ascending: true })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch upcoming tasks: ${error.message}`);
        }

        return data || [];
    }
}

export const taskService = new TaskService();
