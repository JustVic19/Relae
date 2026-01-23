import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook to subscribe to real-time changes for a specific group.
 * Listens for:
 * 1. New/Updated/Deleted tasks in the group.
 * 2. New/Removed members in the group.
 */
export function useGroupRealtime(groupId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!groupId) return;

        console.log(`Subscribing to real-time updates for group: ${groupId}`);

        const channel = supabase
            .channel(`group-realtime:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    console.log('Real-time task update received:', payload.eventType);
                    // Refresh group details (tasks list)
                    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
                    // Refresh homescreen (in case task was assigned to user)
                    queryClient.invalidateQueries({ queryKey: ['homescreen'] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'group_members',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    console.log('Real-time member update received:', payload.eventType);
                    // Refresh group details (member list)
                    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to group ${groupId}`);
                }
            });

        return () => {
            console.log(`Unsubscribing from group ${groupId}`);
            supabase.removeChannel(channel);
        };
    }, [groupId, queryClient]);
}
