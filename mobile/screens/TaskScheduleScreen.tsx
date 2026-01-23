import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHomescreenData, useTaskMutations } from '../hooks/useHomescreen';
import { useAppleCalendar } from '../hooks/useAppleCalendar';
import DatePickerModal from '../components/DatePickerModal';
import QuickAddTaskModal from '../components/QuickAddTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { TaskType } from '../services/homescreenService';

// Constants for time slots
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

export default function TaskScheduleScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { data, refetch } = useHomescreenData();
    const { createTask, completeTask, uncompleteTask, deleteTask, updateTask } = useTaskMutations();
    const { events: appleEvents, fetchEvents: fetchAppleEvents } = useAppleCalendar();

    // Fetch Apple Calendar events when date changes
    useEffect(() => {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        fetchAppleEvents(start, end);
    }, [selectedDate, fetchAppleEvents]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            refetch(),
            fetchAppleEvents(
                new Date(selectedDate.setHours(0, 0, 0, 0)),
                new Date(selectedDate.setHours(23, 59, 59, 999))
            )
        ]);
        setRefreshing(false);
    };

    // Generate week days for the week strip
    // Generate 30 days of dates for scrolling
    const weekDays = useMemo(() => {
        // Start from today - 2 days (so you can see recent past)
        const start = new Date();
        start.setDate(start.getDate() - 2);

        const days = [];
        for (let i = 0; i < 35; i++) { // 35 days = 5 weeks
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, []);

    // Format selected date for display
    const formattedDate = useMemo(() => {
        const today = new Date();
        if (selectedDate.toDateString() === today.toDateString()) return 'Today';

        return selectedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }, [selectedDate]);

    // Filter tasks for the selected date
    const daysTasks = useMemo(() => {
        const backendTasks = data ? [...(data.todaysTasks || []), ...(data.weekTasks || [])] : [];

        // Merge with Apple Events
        // We can distinguish them later if needed by checking isAppleCalendar prop
        const allTasks = [...backendTasks, ...appleEvents];

        const dateKey = selectedDate.toISOString().split('T')[0];

        return allTasks.filter(task => {
            if (!task.due_date) return false;
            // Handle both ISO strings and local date strings if necessary (though apple returns dates)
            // Apple events return Date objects usually, but we mapped them.
            // Let's ensure robust comparison.
            const taskDate = new Date(task.due_date);
            const taskDateKey = taskDate.toISOString().split('T')[0];
            return taskDateKey === dateKey;
        });
    }, [data, appleEvents, selectedDate]);

    // Group tasks by hour
    const tasksByHour = useMemo(() => {
        const map = new Map<number, any[]>();

        daysTasks.forEach(task => {
            if (!task.due_date) return;

            if (!task.due_date.includes('T')) {
                // Skip, handled by allDayTasks
                return;
            }

            const date = new Date(task.due_date);
            const hour = date.getHours();
            const existing = map.get(hour) || [];
            map.set(hour, [...existing, task]);
        });

        return map;
    }, [daysTasks]);

    // Separate All Day tasks
    const allDayTasks = useMemo(() => {
        return daysTasks.filter(task => {
            if (!task.due_date) return false;
            // Considering tasks without 'T' time part as all day
            return !task.due_date.includes('T');
        });
    }, [daysTasks]);

    // Styling helpers
    const getTaskStyles = (type: TaskType | 'APPLE_EVENT') => {
        switch (type) {
            case 'DEADLINE': return { bg: '#FFF0F0', border: '#FFDBDB', text: '#FF4D4D', dot: '#FF4D4D' };
            case 'READING': return { bg: '#F0F7FF', border: '#DBEAFF', text: '#0066FF', dot: '#0066FF' };
            case 'ADMIN': return { bg: '#F5F0FF', border: '#EADBFF', text: '#8A2BE2', dot: '#8A2BE2' };
            case 'EVENT': return { bg: '#F0FFF4', border: '#DBFFE5', text: '#00CC44', dot: '#00CC44' };
            case 'CHANGE': return { bg: '#FFF8F0', border: '#FFEADB', text: '#FF9900', dot: '#FF9900' };
            case 'APPLE_EVENT': return { bg: '#F5F5F7', border: '#E5E5E5', text: '#000000', dot: '#000000' }; // Black for Apple
            default: return { bg: '#F5F5F7', border: '#E5E5E5', text: '#1A1A1A', dot: '#1A1A1A' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton}>
                    <View style={styles.gridIcon}>
                        <View style={styles.gridDot} />
                        <View style={styles.gridDot} />
                        <View style={styles.gridDot} />
                        <View style={styles.gridDot} />
                    </View>
                </TouchableOpacity>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowQuickAddModal(true)}
                    >
                        <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.bellIcon}>🔔</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.titleSection}>
                <Text style={styles.headerTitle}>Task Schedule</Text>
                <TouchableOpacity
                    style={styles.calendarPill}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.calendarPillIcon}>📅</Text>
                    <Text style={styles.calendarPillText}>Calendar</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Date Strip */}
            <View style={styles.weekStripContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weekStripContent}
                >
                    {weekDays.map((date, index) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                        const dayNum = date.getDate();
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.dayItem, isToday && !isSelected && styles.dayItemToday]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedDate(date);
                                }}
                            >
                                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                                    {dayName}
                                </Text>
                                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                                    <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                                        {dayNum}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Timeline */}
            <ScrollView
                style={styles.timeline}
                contentContainerStyle={styles.timelineContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* All Day Section */}
                {allDayTasks.length > 0 && (
                    <View style={styles.timeSlot}>
                        <View style={styles.timeLabelContainer}>
                            <Text style={styles.timeLabel}>All Day</Text>
                        </View>

                        <View style={styles.tasksContainer}>
                            {allDayTasks.map((task, idx) => {
                                // Casting to any to access custom property if TS complains, or checking type
                                const isApple = (task as any).isAppleCalendar;
                                const styles_ = getTaskStyles(isApple ? 'APPLE_EVENT' : task.type);
                                return (
                                    <TouchableOpacity key={task.id} style={[styles.taskCard, { backgroundColor: styles_.bg, borderColor: styles_.border }]}>
                                        <View style={[styles.taskDot, { backgroundColor: styles_.text }]}>
                                            <Text style={styles.taskDotText}>{'A'}</Text>
                                        </View>

                                        <Text style={styles.taskTitle} numberOfLines={1}>
                                            {task.title}
                                        </Text>

                                        <View style={styles.timePill}>
                                            <Text style={styles.timePillText}>All Day</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {HOURS.map(hour => {
                    const tasks = tasksByHour.get(hour) || [];
                    const displayTime = new Date().setHours(hour, 0, 0, 0);
                    const timeString = new Date(displayTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    return (
                        <View key={hour} style={styles.timeSlot}>
                            <View style={styles.timeLabelContainer}>
                                <Text style={styles.timeLabel}>{timeString}</Text>
                            </View>

                            <View style={styles.tasksContainer}>
                                {tasks.length > 0 ? (
                                    tasks.map((task, idx) => {
                                        const isApple = (task as any).isAppleCalendar;
                                        const styles_ = getTaskStyles(isApple ? 'APPLE_EVENT' : task.type);
                                        const taskTime = task.due_date?.includes('T') || task.due_date instanceof Date
                                            ? new Date(task.due_date)
                                            : null;

                                        // Calculate end time (placeholder + 1 hour)
                                        const endTime = taskTime
                                            ? new Date(taskTime.getTime() + 60 * 60 * 1000)
                                            : null;

                                        return (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={[
                                                    styles.taskCard,
                                                    { backgroundColor: styles_.bg, borderColor: styles_.border },
                                                    task.status === 'completed' && { opacity: 0.6 }
                                                ]}
                                                onPress={() => setSelectedTask(task)}
                                            >
                                                <View style={[styles.taskDot, { backgroundColor: styles_.text }]}>
                                                    <Text style={styles.taskDotText}>
                                                        {task.status === 'completed' ? '✓' : (idx + 1)}
                                                    </Text>
                                                </View>

                                                <Text style={[
                                                    styles.taskTitle,
                                                    task.status === 'completed' && { textDecorationLine: 'line-through' }
                                                ]} numberOfLines={1}>
                                                    {task.title}
                                                </Text>

                                                {taskTime && (
                                                    <View style={styles.timePill}>
                                                        <Text style={styles.timePillText}>
                                                            {taskTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                            {endTime ? ` - ${endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <View style={styles.emptySlotLine} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <DatePickerModal
                visible={showDatePicker}
                currentDate={selectedDate}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={setSelectedDate}
            />

            <QuickAddTaskModal
                visible={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSubmit={(title, type, dueDate, module) => createTask.mutate({ title, type, due_date: dueDate, module })}
                initialDate={selectedDate}
            />

            <TaskDetailModal
                visible={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onComplete={(id) => completeTask.mutate(id)}
                onUncomplete={(id) => uncompleteTask.mutate(id)}
                onDelete={(id) => deleteTask.mutate(id)}
                onUpdate={(id, updates) => updateTask.mutate({ taskId: id, updates })}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F7F7F8', // Lighter background for icons
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridIcon: {
        width: 18,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
        justifyContent: 'center',
    },
    gridDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1A1A1A',
    },
    headerTitleContainer: {
        // alignSelf: 'flex-start', // Removed
    },
    titleSection: {
        paddingHorizontal: 20,
        marginBottom: 10,
        gap: 12, // Space between Title and Calendar Pill
        alignItems: 'flex-start', // Left align
    },
    headerTitle: {
        fontSize: 24, // Larger title as per design
        fontWeight: '800',
        color: '#1A1A1A',
    },
    calendarPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        alignSelf: 'flex-start', // Left align pill
    },
    calendarPillIcon: {
        fontSize: 16, // Slightly larger
    },
    calendarPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIcon: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '400',
        marginTop: -2,
    },
    bellIcon: {
        fontSize: 20,
    },
    weekStripContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
        maxHeight: 90, // Limit height
    },
    weekStripContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 16, // Space between days
    },
    dayItem: {
        alignItems: 'center',
        gap: 8,
        minWidth: 40, // Ensure touch target
    },
    dayItemToday: {
        opacity: 0.8,
    },
    dayName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    dayNameSelected: {
        color: '#1A1A1A',
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F7F7F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircleSelected: {
        backgroundColor: '#D4E2D4', // Sage green like screenshot
    },
    dayNum: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    dayNumSelected: {
        color: '#1A1A1A',
    },
    timeline: {
        flex: 1,
    },
    timelineContent: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for nav
    },
    timeSlot: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timeLabelContainer: {
        width: 70,
        paddingTop: 12, // Align with top of task card
    },
    timeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    tasksContainer: {
        flex: 1,
        gap: 12,
        paddingBottom: 20,
        borderLeftWidth: 1,
        borderLeftColor: '#F5F5F7',
        paddingLeft: 20,
    },
    emptySlotLine: {
        height: 1,
        backgroundColor: '#F5F5F7',
        marginTop: 22,
        width: '100%',
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingRight: 16,
        borderRadius: 30, // Pill shape
        borderWidth: 1,
        gap: 12,
    },
    taskDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    taskDotText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    taskTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    timePill: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    timePillText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1A1A1A',
    },
});
