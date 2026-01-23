import { SupabaseClient } from '@supabase/supabase-js';

export class CommentService {
    constructor(private supabase: SupabaseClient) { }

    async createComment(taskId: string, userId: string, content: string) {
        const { data, error } = await this.supabase
            .from('task_comments')
            .insert({
                task_id: taskId,
                user_id: userId,
                content
            })
            .select(`
                *,
                user:user_profiles(
                    id,
                    display_name,
                    avatar_url
                )
            `)
            .single();

        if (error) throw error;
        return data;
    }

    async getTaskComments(taskId: string) {
        const { data, error } = await this.supabase
            .from('task_comments')
            .select(`
                *,
                user:user_profiles(
                    id,
                    display_name,
                    avatar_url
                )
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}
