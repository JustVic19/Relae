import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import taskCompletionService from '../services/taskCompletionService';
import { useQueryClient } from '@tanstack/react-query';
import { homescreenKeys } from './useHomescreen';

/**
 * Hook to set up task completion monitoring and notifications
 */
export function useTaskCompletion() {
    const queryClient = useQueryClient();

    // Request notification permissions on mount
    useEffect(() => {
        taskCompletionService.requestPermissions();
    }, []);

    // Check for overdue tasks when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // App came to foreground - check for overdue tasks
                taskCompletionService.checkOverdueTasks().then(() => {
                    // Refresh homescreen data after checking
                    queryClient.invalidateQueries({ queryKey: homescreenKeys.data() });
                });
            }
        });

        // Check immediately on mount
        taskCompletionService.checkOverdueTasks().then(() => {
            queryClient.invalidateQueries({ queryKey: homescreenKeys.data() });
        });

        return () => {
            subscription.remove();
        };
    }, [queryClient]);

    // Set up notification listener
    useEffect(() => {
        const handleTaskComplete = (taskId: string) => {
            console.log('Task completion notification clicked:', taskId);
            // Refresh data when user interacts with completion notification
            queryClient.invalidateQueries({ queryKey: homescreenKeys.data() });
        };

        taskCompletionService.setupNotificationListener(handleTaskComplete);

        return () => {
            taskCompletionService.cleanup();
        };
    }, [queryClient]);

    // Manually trigger overdue check
    const checkOverdueTasks = useCallback(async () => {
        await taskCompletionService.checkOverdueTasks();
        queryClient.invalidateQueries({ queryKey: homescreenKeys.data() });
    }, [queryClient]);

    // Schedule reminder for a task
    const scheduleTaskReminder = useCallback(async (
        taskId: string,
        taskTitle: string,
        dueDate: Date
    ) => {
        await taskCompletionService.scheduleTaskReminder(taskId, taskTitle, dueDate);
    }, []);

    // Cancel reminder for a task
    const cancelTaskReminder = useCallback(async (taskId: string) => {
        await taskCompletionService.cancelTaskReminder(taskId);
    }, []);

    return {
        checkOverdueTasks,
        scheduleTaskReminder,
        cancelTaskReminder,
    };
}
