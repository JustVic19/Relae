import { SupabaseClient } from '@supabase/supabase-js';

export interface Notification {
    id: string;
    user_id: string;
    type: 'deadline_approaching' | 'task_completed' | 'goal_achieved' | 'reminder' | 'daily_summary' | 'marketing';
    title: string;
    message: string;
    task_id: string | null;
    read: boolean;
    created_at: string;
}

export interface NotificationPreferences {
    id: string;
    user_id: string;
    push_enabled: boolean;
    deadline_alerts: boolean;
    goal_alerts: boolean;
    daily_summary: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateNotificationInput {
    user_id: string;
    type: Notification['type'];
    title: string;
    message: string;
    task_id?: string;
}

export class NotificationService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Create a new notification
     */
    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        const { data, error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: input.user_id,
                type: input.type,
                title: input.title,
                message: input.message,
                task_id: input.task_id || null,
            })
            .select()
            .single();

        if (error) throw error;

        // Send push notification asynchronously (don't await to avoid blocking)
        this.sendPushNotification([input.user_id], input.title, input.message, {
            type: input.type,
            task_id: input.task_id,
            notification_id: data.id,
        }).catch(err => {
            console.error('Error sending push notification:', err);
        });

        return data;
    }

    /**
     * Get all notifications for a user (paginated)
     */
    async getUserNotifications(
        userId: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<Notification[]> {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return count || 0;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    /**
     * Get user notification settings from user_preferences
     */
    async getNotificationSettings(userId: string): Promise<{
        task_reminders: boolean;
        achievements: boolean;
        daily_briefing: boolean;
        weekly_report: boolean;
        marketing: boolean;
    }> {
        const { data, error } = await this.supabase
            .from('user_preferences')
            .select('notification_settings')
            .eq('user_id', userId)
            .single();

        if (error || !data?.notification_settings) {
            // Return defaults if no settings exist
            return {
                task_reminders: true,
                achievements: true,
                daily_briefing: true,
                weekly_report: true,
                marketing: false,
            };
        }

        return data.notification_settings;
    }

    /**
     * Get user preferences (legacy - keeping for backwards compatibility)
     */
    async getPreferences(userId: string): Promise<NotificationPreferences> {
        const { data, error } = await this.supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return this.createDefaultPreferences(userId);
            }
            throw error;
        }

        return data;
    }

    /**
     * Create default preferences
     */
    private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
        const { data, error } = await this.supabase
            .from('notification_preferences')
            .insert({
                user_id: userId,
                push_enabled: true,
                deadline_alerts: true,
                goal_alerts: true,
                daily_summary: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update user preferences
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    ): Promise<NotificationPreferences> {
        const { data, error } = await this.supabase
            .from('notification_preferences')
            .update(preferences)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Check if user is in quiet hours
     */
    async isInQuietHours(userId: string): Promise<boolean> {
        const preferences = await this.getPreferences(userId);

        if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
            return false;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
        const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);

        const quietStart = startHour * 60 + startMin;
        const quietEnd = endHour * 60 + endMin;

        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (quietStart > quietEnd) {
            return currentTime >= quietStart || currentTime < quietEnd;
        }

        return currentTime >= quietStart && currentTime < quietEnd;
    }

    /**
     * Generate deadline approaching notification
     */
    async notifyDeadlineApproaching(
        userId: string,
        taskId: string,
        taskTitle: string,
        hoursUntilDue: number
    ): Promise<Notification | null> {
        // Check new notification settings
        const settings = await this.getNotificationSettings(userId);

        if (!settings.task_reminders) {
            return null;
        }

        // Check legacy quiet hours (if they exist)
        if (await this.isInQuietHours(userId)) {
            return null;
        }

        // Format time appropriately based on hours until due
        let timeText: string;
        let emoji: string;

        if (hoursUntilDue >= 144) {
            // 6+ days
            const days = Math.round(hoursUntilDue / 24);
            timeText = `${days} day${days !== 1 ? 's' : ''}`;
            emoji = '📅';
        } else if (hoursUntilDue >= 48) {
            // 2-6 days
            const days = Math.round(hoursUntilDue / 24);
            timeText = `${days} days`;
            emoji = '⏰';
        } else if (hoursUntilDue >= 24) {
            // 1-2 days
            timeText = '1 day';
            emoji = '⏰';
        } else if (hoursUntilDue >= 2) {
            // 2-24 hours
            const hours = Math.round(hoursUntilDue);
            timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
            emoji = '⚠️';
        } else if (hoursUntilDue >= 1) {
            // 1-2 hours
            const hours = Math.round(hoursUntilDue);
            timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
            emoji = '🚨';
        } else {
            // Less than 1 hour
            const minutes = Math.round(hoursUntilDue * 60);
            timeText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            emoji = '🚨';
        }

        return this.createNotification({
            user_id: userId,
            type: 'deadline_approaching',
            title: `${emoji} Deadline Approaching`,
            message: `"${taskTitle}" is due in ${timeText}`,
            task_id: taskId,
        });
    }

    /**
     * Generate goal achieved notification
     */
    async notifyGoalAchieved(userId: string, weeklyGoal: number): Promise<Notification | null> {
        // Check new notification settings
        const settings = await this.getNotificationSettings(userId);

        if (!settings.achievements) {
            return null;
        }

        // Check legacy quiet hours (if they exist)
        if (await this.isInQuietHours(userId)) {
            return null;
        }

        return this.createNotification({
            user_id: userId,
            type: 'goal_achieved',
            title: '🎉 Goal Achieved!',
            message: `Congratulations! You've completed your weekly goal of ${weeklyGoal} tasks!`,
        });
    }

    /**
     * Generate task completion milestone notification
     */
    async notifyTaskMilestone(userId: string, totalCompleted: number): Promise<Notification | null> {
        const milestones = [5, 10, 20, 50, 100];

        if (!milestones.includes(totalCompleted)) {
            return null;
        }

        // Check new notification settings
        const settings = await this.getNotificationSettings(userId);

        if (!settings.achievements) {
            return null;
        }

        return this.createNotification({
            user_id: userId,
            type: 'task_completed',
            title: '🏆 Milestone Reached!',
            message: `Amazing! You've completed ${totalCompleted} tasks total!`,
        });
    }

    /**
     * Send a marketing/product update notification to users
     * Only sends to users who have opted in via marketing setting
     */
    async sendMarketingNotification(
        userIds: string[],
        title: string,
        message: string
    ): Promise<{ sent: number; skipped: number; errors: number }> {
        let sent = 0;
        let skipped = 0;
        let errors = 0;

        for (const userId of userIds) {
            try {
                // Check if user has opted in to marketing notifications
                const settings = await this.getNotificationSettings(userId);

                if (!settings.marketing) {
                    skipped++;
                    continue;
                }

                // Check quiet hours
                if (await this.isInQuietHours(userId)) {
                    skipped++;
                    continue;
                }

                // Create the notification
                await this.createNotification({
                    user_id: userId,
                    type: 'marketing',
                    title,
                    message,
                });

                sent++;
            } catch (error) {
                console.error(`Error sending marketing notification to user ${userId}:`, error);
                errors++;
            }
        }

        return { sent, skipped, errors };
    }

    /**
     * Check for upcoming deadlines and generate notifications
     * This should be called periodically (e.g., every 30 minutes via cron)
     * 
     * Notification schedule:
     * - 1 week before (7 days)
     * - 3 days before
     * - 1 day before (24 hours)
     * - 2 hours before
     * - 1 hour before
     */
    async checkUpcomingDeadlines(): Promise<{ notified: number; errors: number }> {
        let notified = 0;
        let errors = 0;

        try {
            const now = new Date();

            // Define time windows for different notifications (in hours)
            const timeWindows = [
                { hours: 168, label: '1 week', minHours: 167, maxHours: 169 },      // 7 days ± 1 hour
                { hours: 72, label: '3 days', minHours: 71, maxHours: 73 },         // 3 days ± 1 hour
                { hours: 24, label: '1 day', minHours: 23, maxHours: 25 },          // 24 hours ± 1 hour
                { hours: 2, label: '2 hours', minHours: 1.5, maxHours: 2.5 },       // 2 hours ± 30 min
                { hours: 1, label: '1 hour', minHours: 0.5, maxHours: 1.5 },        // 1 hour ± 30 min
            ];

            // Get furthest time window (1 week + buffer)
            const maxHours = Math.max(...timeWindows.map(w => w.maxHours));
            const furthestDeadline = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

            // Fetch all tasks with upcoming deadlines
            const { data: tasks, error } = await this.supabase
                .from('tasks')
                .select('id, user_id, title, due_date, type')
                .in('status', ['pending', 'in_progress'])
                .not('due_date', 'is', null)
                .gte('due_date', now.toISOString())
                .lte('due_date', furthestDeadline.toISOString());

            if (error) {
                console.error('Error fetching tasks for deadline check:', error);
                return { notified, errors: 1 };
            }

            if (!tasks || tasks.length === 0) {
                return { notified, errors };
            }

            // Process each task
            for (const task of tasks) {
                try {
                    const dueDate = new Date(task.due_date!);
                    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                    // Check which notification window this falls into
                    for (const window of timeWindows) {
                        if (hoursUntilDue >= window.minHours && hoursUntilDue <= window.maxHours) {
                            // Check if we already sent a notification for this window
                            const recentNotification = await this.hasRecentDeadlineNotification(
                                task.user_id,
                                task.id,
                                window.hours
                            );

                            if (!recentNotification) {
                                await this.notifyDeadlineApproaching(
                                    task.user_id,
                                    task.id,
                                    task.title,
                                    hoursUntilDue
                                );
                                notified++;
                            }
                            break; // Only send one notification per check
                        }
                    }
                } catch (taskError) {
                    console.error(`Error processing task ${task.id}:`, taskError);
                    errors++;
                }
            }
        } catch (error) {
            console.error('Error in checkUpcomingDeadlines:', error);
            errors++;
        }

        return { notified, errors };
    }

    /**
     * Check if we've sent a deadline notification for this task recently
     * Updated to handle different notification windows
     */
    private async hasRecentDeadlineNotification(
        userId: string,
        taskId: string,
        windowHours: number
    ): Promise<boolean> {
        // Check for notifications sent in the last period
        // Use longer check window for longer deadlines (e.g., don't spam weekly reminders)
        let checkWindowHours: number;
        if (windowHours >= 168) {
            checkWindowHours = 12; // 12 hours for weekly reminders
        } else if (windowHours >= 72) {
            checkWindowHours = 6; // 6 hours for 3-day reminders
        } else if (windowHours >= 24) {
            checkWindowHours = 4; // 4 hours for daily reminders
        } else {
            checkWindowHours = 1.5; // 1.5 hours for hourly reminders
        }

        const checkFrom = new Date(Date.now() - checkWindowHours * 60 * 60 * 1000);

        const { count } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('task_id', taskId)
            .eq('type', 'deadline_approaching')
            .gte('created_at', checkFrom.toISOString());

        return (count || 0) > 0;
    }

    /**
     * Save a push token for a user
     */
    async savePushToken(userId: string, token: string, platform: string = 'expo') {
        const { error } = await this.supabase
            .from('user_devices')
            .upsert({
                user_id: userId,
                device_token: token,
                platform,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, device_token' });

        if (error) throw error;
    }

    /**
     * Send a push notification to specific users
     */
    async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}) {
        // 1. Get tokens for users
        const { data: devices, error } = await this.supabase
            .from('user_devices')
            .select('device_token')
            .in('user_id', userIds);

        if (error || !devices || devices.length === 0) return;

        // 2. Format messages for Expo
        const messages = devices.map(device => ({
            to: device.device_token,
            sound: 'default',
            title,
            body,
            data,
        }));

        // 3. Send using Expo SDK
        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });
        } catch (err) {
            console.error('Error sending push notification:', err);
        }
    }

    /**
     * Send daily briefing notification
     * Should be called once per day (e.g., 8am via cron)
     */
    async sendDailyBriefing(userId: string): Promise<Notification | null> {
        // Check if daily briefing is enabled
        const settings = await this.getNotificationSettings(userId);

        if (!settings.daily_briefing) {
            return null;
        }

        // Check quiet hours
        if (await this.isInQuietHours(userId)) {
            return null;
        }

        // Get today's tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: tasks, error } = await this.supabase
            .from('tasks')
            .select('id, title, due_date')
            .eq('user_id', userId)
            .eq('status', 'in_progress')
            .gte('due_date', today.toISOString())
            .lt('due_date', tomorrow.toISOString());

        if (error || !tasks || tasks.length === 0) {
            // Send briefing even if no tasks
            return this.createNotification({
                user_id: userId,
                type: 'daily_summary',
                title: '☀️ Good Morning!',
                message: 'You have no tasks due today. Great time to plan ahead!',
            });
        }

        const taskCount = tasks.length;
        const taskText = taskCount === 1 ? '1 task' : `${taskCount} tasks`;

        return this.createNotification({
            user_id: userId,
            type: 'daily_summary',
            title: '☀️ Good Morning!',
            message: `You have ${taskText} due today. Let's make it a productive day!`,
        });
    }

    /**
     * Send weekly report notification
     * Should be called once per week (e.g., Sunday evening via cron)
     */
    async sendWeeklyReport(userId: string): Promise<Notification | null> {
        // Check if weekly report is enabled
        const settings = await this.getNotificationSettings(userId);

        if (!settings.weekly_report) {
            return null;
        }

        // Check quiet hours
        if (await this.isInQuietHours(userId)) {
            return null;
        }

        // Get this week's stats
        const { data: preferences } = await this.supabase
            .from('user_preferences')
            .select('weekly_goal')
            .eq('user_id', userId)
            .single();

        const weeklyGoal = preferences?.weekly_goal || 10;

        // Get current week stats
        const weekStart = this.getWeekStart(new Date());

        const { data: weekStats } = await this.supabase
            .from('weekly_stats')
            .select('tasks_completed, goal_met')
            .eq('user_id', userId)
            .eq('week_start', weekStart)
            .single();

        const completed = weekStats?.tasks_completed || 0;
        const goalMet = weekStats?.goal_met || false;

        let message: string;
        if (goalMet) {
            message = `🎉 You crushed it this week! ${completed}/${weeklyGoal} tasks completed. Keep up the amazing work!`;
        } else if (completed > 0) {
            message = `You completed ${completed}/${weeklyGoal} tasks this week. You're making progress!`;
        } else {
            message = `This week's goal: ${weeklyGoal} tasks. Let's make next week count!`;
        }

        return this.createNotification({
            user_id: userId,
            type: 'daily_summary',
            title: '📊 Weekly Report',
            message,
        });
    }

    /**
     * Get start of week (Monday) for a given date
     */
    private getWeekStart(date: Date): string {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    }
}
