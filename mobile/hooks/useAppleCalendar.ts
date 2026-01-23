import { useState, useEffect, useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../services/homescreenService';

export function useAppleCalendar() {
    const [events, setEvents] = useState<Task[]>([]);
    const [connected, setConnected] = useState(false);

    const checkConnection = useCallback(async () => {
        try {
            const status = await AsyncStorage.getItem('apple_calendar_connected');
            setConnected(status === 'true');
            return status === 'true';
        } catch (e) {
            console.error('Failed to check calendar connection', e);
            return false;
        }
    }, []);

    const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
        const isConnected = await checkConnection();
        if (!isConnected) {
            setEvents([]);
            return;
        }

        try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
            const calendarIds = calendars.map(c => c.id);

            const appleEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate);

            // Map to Task format
            const mappedTasks: Task[] = appleEvents.map(event => ({
                id: `apple-${event.id}`,
                candidate_id: 'apple-calendar',
                user_id: 'local',
                thread_id: null,
                title: event.title,
                type: 'EVENT',
                module: event.location || 'Apple Calendar', // Show location or source as module
                due_date: event.startDate,
                notes: event.notes || null,
                links: [],
                status: 'pending',
                sort_order: 0,
                created_at: event.creationDate || new Date().toISOString(),
                completed_at: null,
                // Add custom property to identify source if needed in UI
                isAppleCalendar: true
            } as unknown as Task)); // Cast to Task, adding unknown props is fine for runtime usually

            setEvents(mappedTasks);
        } catch (error) {
            console.error('Error fetching Apple Calendar events:', error);
        }
    }, [checkConnection]);

    const deleteAppleEvent = useCallback(async (taskId: string) => {
        const isConnected = await checkConnection();
        if (!isConnected) return;

        try {
            // Task ID format: 'apple-[id]'
            const eventId = taskId.replace('apple-', '');
            await Calendar.deleteEventAsync(eventId);

            // Update local state
            setEvents(prev => prev.filter(e => e.id !== taskId));
        } catch (error) {
            console.error('Error deleting Apple Calendar event:', error);
            throw error;
        }
    }, [checkConnection]);

    return {
        events,
        fetchEvents,
        deleteAppleEvent,
        connected
    };
}
