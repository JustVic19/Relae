import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    homescreenService,
    HomescreenData,
    Task,
    ProgressStats,
    CreateTaskInput,
    TasksByDate,
} from '../services/homescreenService';

// Query keys for cache management
export const homescreenKeys = {
    all: ['homescreen'] as const,
    data: () => [...homescreenKeys.all, 'data'] as const,
    progress: () => [...homescreenKeys.all, 'progress'] as const,
    tasksForDate: (date: string) => [...homescreenKeys.all, 'tasks', date] as const,
    calendar: () => [...homescreenKeys.all, 'calendar'] as const,
};

/**
 * Hook to fetch all homescreen data
 * Refetches on mount (staleTime: 0)
 */
export function useHomescreenData() {
    return useQuery<HomescreenData, Error>({
        queryKey: homescreenKeys.data(),
        queryFn: () => homescreenService.getHomescreenData(),
    });
}

/**
 * Hook to fetch tasks for a specific date (for calendar day tap)
 */
export function useTasksForDate(date: Date) {
    const dateKey = date.toISOString().split('T')[0];
    return useQuery<Task[], Error>({
        queryKey: homescreenKeys.tasksForDate(dateKey),
        queryFn: () => homescreenService.getTasksForDate(date),
    });
}

/**
 * Hook to fetch calendar data (5-day preview)
 */
export function useCalendarData(startDate: Date, days: number = 5) {
    return useQuery<TasksByDate, Error>({
        queryKey: homescreenKeys.calendar(),
        queryFn: () => homescreenService.getTasksForDateRange(startDate, days),
    });
}

/**
 * Hook for task mutations (complete, uncomplete, delete, reorder)
 */
export function useTaskMutations() {
    const queryClient = useQueryClient();

    // Invalidate all homescreen queries after mutations
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: homescreenKeys.all });
    };

    const completeTask = useMutation({
        mutationFn: (taskId: string) => homescreenService.completeTask(taskId),
        onSuccess: invalidateAll,
        // Optimistic update for instant UI feedback
        onMutate: async (taskId: string) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: homescreenKeys.data() });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData<HomescreenData>(homescreenKeys.data());

            // Optimistically update the cache
            if (previousData) {
                const updateTask = (task: Task): Task =>
                    task.id === taskId
                        ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString() }
                        : task;

                queryClient.setQueryData<HomescreenData>(homescreenKeys.data(), {
                    ...previousData,
                    todaysTasks: previousData.todaysTasks.map(updateTask),
                    weekTasks: previousData.weekTasks.map(updateTask),
                    progress: homescreenService.calculateProgress(
                        previousData.todaysTasks.map(updateTask),
                        previousData.weekTasks.map(updateTask)
                    ),
                });
            }

            return { previousData };
        },
        onError: (_err, _taskId, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(homescreenKeys.data(), context.previousData);
            }
        },
    });

    const uncompleteTask = useMutation({
        mutationFn: (taskId: string) => homescreenService.uncompleteTask(taskId),
        onSuccess: invalidateAll,
        onMutate: async (taskId: string) => {
            await queryClient.cancelQueries({ queryKey: homescreenKeys.data() });
            const previousData = queryClient.getQueryData<HomescreenData>(homescreenKeys.data());

            if (previousData) {
                const updateTask = (task: Task): Task =>
                    task.id === taskId
                        ? { ...task, status: 'pending' as const, completed_at: null }
                        : task;

                queryClient.setQueryData<HomescreenData>(homescreenKeys.data(), {
                    ...previousData,
                    todaysTasks: previousData.todaysTasks.map(updateTask),
                    weekTasks: previousData.weekTasks.map(updateTask),
                    progress: homescreenService.calculateProgress(
                        previousData.todaysTasks.map(updateTask),
                        previousData.weekTasks.map(updateTask)
                    ),
                });
            }

            return { previousData };
        },
        onError: (_err, _taskId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(homescreenKeys.data(), context.previousData);
            }
        },
    });

    const deleteTask = useMutation({
        mutationFn: (taskId: string) => homescreenService.deleteTask(taskId),
        onSuccess: invalidateAll,
        onMutate: async (taskId: string) => {
            await queryClient.cancelQueries({ queryKey: homescreenKeys.data() });
            const previousData = queryClient.getQueryData<HomescreenData>(homescreenKeys.data());

            if (previousData) {
                const filterTasks = (tasks: Task[]) => tasks.filter(t => t.id !== taskId);

                queryClient.setQueryData<HomescreenData>(homescreenKeys.data(), {
                    ...previousData,
                    todaysTasks: filterTasks(previousData.todaysTasks),
                    weekTasks: filterTasks(previousData.weekTasks),
                    progress: homescreenService.calculateProgress(
                        filterTasks(previousData.todaysTasks),
                        filterTasks(previousData.weekTasks)
                    ),
                });
            }

            return { previousData };
        },
        onError: (_err, _taskId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(homescreenKeys.data(), context.previousData);
            }
        },
    });

    const createTask = useMutation({
        mutationFn: (input: CreateTaskInput) => homescreenService.createQuickTask(input),
        onSuccess: invalidateAll,
    });

    const reorderTasks = useMutation({
        mutationFn: (taskIds: string[]) => homescreenService.reorderTasks(taskIds),
        onSuccess: invalidateAll,
    });

    return {
        completeTask,
        uncompleteTask,
        deleteTask,
        createTask,
        reorderTasks,
    };
}

/**
 * Hook to get computed progress from cached data
 */
export function useTaskProgress(): ProgressStats | undefined {
    const { data } = useHomescreenData();
    return data?.progress;
}

/**
 * Hook to refetch homescreen data (for pull-to-refresh)
 */
export function useRefreshHomescreen() {
    const queryClient = useQueryClient();

    return async () => {
        await queryClient.refetchQueries({ queryKey: homescreenKeys.data() });
    };
}
