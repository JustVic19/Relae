import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationPreferences,
    updateNotificationPreferences,
    Notification,
    NotificationPreferences,
} from '../services/notificationService';

/**
 * Hook to fetch notifications
 */
export function useNotifications() {
    const { data: notifications, isLoading, error, refetch } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: () => getNotifications(50, 0),
        staleTime: 30 * 1000, // 30 seconds
    });

    return {
        notifications: notifications || [],
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook to get unread count
 */
export function useUnreadCount() {
    const { data: count } = useQuery<number>({
        queryKey: ['unreadCount'],
        queryFn: getUnreadCount,
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Poll every 30 seconds
    });

    return count || 0;
}

/**
 * Hook for notification mutations
 */
export function useNotificationMutations() {
    const queryClient = useQueryClient();

    const markReadMutation = useMutation({
        mutationFn: (notificationId: string) => markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (notificationId: string) => deleteNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        },
    });

    return {
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
        deleteNotification: deleteMutation.mutate,
        isLoading: markReadMutation.isPending || markAllReadMutation.isPending || deleteMutation.isPending,
    };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
    const queryClient = useQueryClient();

    const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
        queryKey: ['notificationPreferences'],
        queryFn: getNotificationPreferences,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const updateMutation = useMutation({
        mutationFn: (updates: Partial<NotificationPreferences>) => updateNotificationPreferences(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
        },
    });

    return {
        preferences,
        isLoading,
        updatePreferences: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
    };
}
