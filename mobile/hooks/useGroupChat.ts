import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface GroupMessage {
    id: string;
    group_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        id: string;
        display_name: string;
        avatar_url: string;
    };
}

export function useGroupChat(groupId: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['group_messages', groupId];

    // Fetch messages
    const { data: messages, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    user:user_profiles(id, display_name, avatar_url)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as GroupMessage[];
        },
        enabled: !!groupId,
    });

    // Send message
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    content
                });

            if (error) throw error;
        },
        onSuccess: () => {
            // Optimistic update or wait for realtime
            // We'll rely on realtime for the new message to appear
        },
    });

    // Real-time subscription
    useEffect(() => {
        if (!groupId) return;

        console.log('🔗 Subscribing to chat:', groupId);

        const channel = supabase
            .channel(`chat:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    console.log('💬 New Message:', payload.new);
                    // Invalidate or update cache
                    queryClient.invalidateQueries({ queryKey });
                }
            )
            .subscribe();

        return () => {
            console.log('🔌 Unsubscribing chat');
            supabase.removeChannel(channel);
        };
    }, [groupId, queryClient]);

    return {
        messages,
        isLoading,
        sendMessage,
    };
}
