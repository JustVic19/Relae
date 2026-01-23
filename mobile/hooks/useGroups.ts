import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUserGroups,
    getGroupDetails,
    createGroup,
    joinGroup,
    createGroupTask,
    updateTask,
    Group,
    GroupDetail
} from '../services/api';

export { Group, GroupDetail };

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: getUserGroups,
    });
}

export function useGroupDetails(groupId: string) {
    return useQuery({
        queryKey: ['group', groupId],
        queryFn: () => getGroupDetails(groupId),
        enabled: !!groupId,
    });
}

export function useGroupMutations() {
    const queryClient = useQueryClient();

    const createGroupMutation = useMutation({
        mutationFn: createGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const joinGroupMutation = useMutation({
        mutationFn: joinGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const createGroupTaskMutation = useMutation({
        mutationFn: ({ groupId, task }: { groupId: string; task: { title: string; due_date?: string; assigned_to?: string } }) =>
            createGroupTask(groupId, task),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
            // Invalidate homescreen to show assigned tasks
            queryClient.invalidateQueries({ queryKey: ['homescreen'] });
        },
    });

    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: 'pending' | 'completed' }) =>
            updateTask(taskId, { status }),
        onSuccess: (_, variables) => {
            // Invalidate all groups to be safe, or we could be more specific
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            // Also invalidate homescreen
            queryClient.invalidateQueries({ queryKey: ['homescreen'] });
        },
    });

    return {
        createGroup: createGroupMutation,
        joinGroup: joinGroupMutation,
        createGroupTask: createGroupTaskMutation,
        updateTaskStatus: updateTaskStatusMutation,
    };
}
