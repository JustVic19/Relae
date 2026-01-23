import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getTaskComments, createTaskComment, TaskComment } from '../services/commentService';
import { supabase } from '../lib/supabase';

export function useTaskComments(taskId: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => getTaskComments(taskId),
        enabled: !!taskId,
    });

    useEffect(() => {
        if (!taskId) return;

        const channel = supabase
            .channel(`comments:${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'task_comments',
                    filter: `task_id=eq.${taskId}`,
                },
                (payload) => {
                    // Invalidate comments query to fetch the new comment
                    queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId, queryClient]);

    return query;
}

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
            createTaskComment(taskId, content),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.taskId] });
        },
    });
}
