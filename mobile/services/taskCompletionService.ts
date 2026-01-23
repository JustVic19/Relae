import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

interface TaskCompletionService {
    requestPermissions: () => Promise<boolean>;
    scheduleTaskReminder: (taskId: string, taskTitle: string, dueDate: Date) => Promise<void>;
    cancelTaskReminder: (taskId: string) => Promise<void>;
    checkOverdueTasks: () => Promise<void>;
    setupNotificationListener: (onTaskComplete: (taskId: string) => void) => void;
}

class TaskCompletionServiceImpl implements TaskCompletionService {
    private notificationSubscription: any = null;
    private responseSubscription: any = null;

    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permissions not granted');
            return false;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('task-reminders', {
                name: 'Task Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    }

    /**
     * Schedule a notification reminder before task is due
     */
    async scheduleTaskReminder(taskId: string, taskTitle: string, dueDate: Date): Promise<void> {
        const now = new Date();
        const timeDiff = dueDate.getTime() - now.getTime();

        // Don't schedule if already overdue
        if (timeDiff < 0) return;

        // Schedule notification 5 minutes before due time (or immediately if less than 5 min away)
        const reminderTime = Math.max(0, timeDiff - (5 * 60 * 1000));

        try {
            await Notifications.scheduleNotificationAsync({
                identifier: `task-reminder-${taskId}`,
                content: {
                    title: '⏰ Task Due Soon',
                    body: `"${taskTitle}" is due in 5 minutes`,
                    data: { taskId, type: 'reminder' },
                    sound: true,
                },
                trigger: (reminderTime > 0 ? {
                    type: 'timeInterval',
                    seconds: Math.floor(reminderTime / 1000),
                    repeats: false,
                } : null) as any,
            });

            // Schedule completion check notification at due time
            await Notifications.scheduleNotificationAsync({
                identifier: `task-completion-${taskId}`,
                content: {
                    title: '✅ Task Completed?',
                    body: `Did you complete "${taskTitle}"?`,
                    data: { taskId, type: 'completion-check' },
                    sound: true,
                    // Add action buttons
                    categoryIdentifier: 'task-completion',
                },
                trigger: (timeDiff > 0 ? {
                    type: 'timeInterval',
                    seconds: Math.floor(timeDiff / 1000),
                    repeats: false,
                } : null) as any,
            });
        } catch (error) {
            console.error('Error scheduling task reminder:', error);
        }
    }

    /**
     * Cancel all notifications for a task
     */
    async cancelTaskReminder(taskId: string): Promise<void> {
        try {
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            const taskNotifications = notifications.filter(
                n => n.identifier === `task-reminder-${taskId}` ||
                    n.identifier === `task-completion-${taskId}`
            );

            for (const notification of taskNotifications) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        } catch (error) {
            console.error('Error canceling task reminder:', error);
        }
    }

    /**
     * Check for overdue tasks and auto-mark them
     */
    async checkOverdueTasks(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date().toISOString();

            // Get all pending/in-progress tasks that are overdue
            const { data: overdueTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['pending', 'in_progress'])
                .lt('due_date', now);

            if (error) {
                console.error('Error fetching overdue tasks:', error);
                return;
            }

            if (!overdueTasks || overdueTasks.length === 0) return;

            console.log(`Found ${overdueTasks.length} overdue tasks`);

            // Auto-mark each overdue task as completed
            for (const task of overdueTasks) {
                await this.autoCompleteTask(task.id, task.title);
            }
        } catch (error) {
            console.error('Error checking overdue tasks:', error);
        }
    }

    /**
     * Auto-complete an overdue task and send notification
     */
    private async autoCompleteTask(taskId: string, taskTitle: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Update task to completed
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', taskId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error auto-completing task:', error);
                return;
            }

            // Send notification about auto-completion
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '✅ Task Auto-Completed',
                    body: `"${taskTitle}" was marked as completed (overdue)`,
                    data: { taskId, type: 'auto-completed' },
                    sound: true,
                },
                trigger: null, // Immediate
            });

            console.log(`Task ${taskId} auto-completed`);
        } catch (error) {
            console.error('Error in autoCompleteTask:', error);
        }
    }

    /**
     * Set up listener for notification responses
     */
    setupNotificationListener(onTaskComplete: (taskId: string) => void): void {
        // Listen for notification interactions
        this.notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        this.responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const { data } = response.notification.request.content;

            if (data.type === 'completion-check' && data.taskId) {
                // User interacted with completion check notification
                onTaskComplete(data.taskId as string);
            }
        });
    }

    /**
     * Clean up listeners
     */
    cleanup(): void {
        if (this.notificationSubscription) {
            this.notificationSubscription.remove();
        }
        if (this.responseSubscription) {
            this.responseSubscription.remove();
        }
    }
}

export const taskCompletionService = new TaskCompletionServiceImpl();
export default taskCompletionService;
