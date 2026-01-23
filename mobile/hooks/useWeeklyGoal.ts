import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPreferences, updateWeeklyGoal, updateNotificationSettings, getWeeklyStats, getCurrentWeekStats, UserPreferences, WeeklyStat } from '../services/preferencesService';

/**
 * Hook to fetch and manage weekly goal
 */
export function useWeeklyGoal() {
    const queryClient = useQueryClient();

    const { data: preferences, isLoading, error } = useQuery<UserPreferences>({
        queryKey: ['preferences'],
        queryFn: getUserPreferences,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const updateGoalMutation = useMutation({
        mutationFn: (newGoal: number) => updateWeeklyGoal(newGoal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
            queryClient.invalidateQueries({ queryKey: ['weeklyStats'] });
        },
    });

    const updateNotificationSettingsMutation = useMutation({
        mutationFn: (settings: any) => updateNotificationSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
        },
    });

    return {
        weeklyGoal: preferences?.weekly_goal || 10,
        preferences,
        isLoading,
        error,
        updateGoal: updateGoalMutation.mutate,
        updateNotificationSettings: updateNotificationSettingsMutation.mutate,
        isUpdating: updateGoalMutation.isPending || updateNotificationSettingsMutation.isPending,
    };
}

/**
 * Hook to fetch weekly statistics
 */
export function useWeeklyStats(weeks: number = 4) {
    const { data: stats, isLoading, error } = useQuery<WeeklyStat[]>({
        queryKey: ['weeklyStats', weeks],
        queryFn: () => getWeeklyStats(weeks),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const { data: currentWeek } = useQuery<WeeklyStat | null>({
        queryKey: ['currentWeekStats'],
        queryFn: getCurrentWeekStats,
        staleTime: 30 * 1000, // 30 seconds
    });

    return {
        stats: stats || [],
        currentWeek,
        isLoading,
        error,
    };
}
