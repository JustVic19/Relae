import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    type: 'deadline_approaching' | 'task_completed' | 'goal_achieved' | 'reminder' | 'daily_summary';
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

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) throw error;
    return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

    if (error) throw error;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

    if (error) throw error;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        // If no preferences exist, return defaults
        if (error.code === 'PGRST116') {
            return {
                id: '',
                user_id: user.id,
                push_enabled: true,
                deadline_alerts: true,
                goal_alerts: true,
                daily_summary: false,
                quiet_hours_start: null,
                quiet_hours_end: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }
        throw error;
    }

    return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
