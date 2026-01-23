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
    Animated,
    Alert,
    Platform,
    Dimensions,
    FlatList,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useHomescreenData, useTaskMutations } from '../hooks/useHomescreen';
import { useAppleCalendar } from '../hooks/useAppleCalendar';
import QuickAddTaskModal from '../components/QuickAddTaskModal';
import DatePickerModal from '../components/DatePickerModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { TaskType, Task } from '../services/homescreenService';

interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    urgency?: 'urgent' | 'soon' | 'later' | 'none';
}

// Calculate urgency based on due date
function getDeadlineUrgency(dueDate: Date): 'urgent' | 'soon' | 'later' | 'none' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0) return 'urgent';  // Overdue or due today
    if (daysUntil <= 3) return 'soon';    // Due within 3 days
    if (daysUntil <= 7) return 'later';   // Due within a week
    return 'none';                         // Far future
}

export default function CalendarScreen() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Layout
    const screenWidth = Dimensions.get('window').width;

    // Fetch tasks
    const { data, refetch } = useHomescreenData();
    const { createTask, deleteTask, updateTask, completeTask, uncompleteTask } = useTaskMutations();
    const { events: appleEvents, fetchEvents: fetchAppleEvents, deleteAppleEvent } = useAppleCalendar();

    // Fetch Apple Calendar events when month changes
    useEffect(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Calculate start date (first day of grid)
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const startDate = new Date(year, month, 1 - startingDayOfWeek); // Adjust to start of week (Sun)

        // Calculate end date (last day of grid, 6 weeks later)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 42);

        fetchAppleEvents(startDate, endDate);
    }, [currentMonth, fetchAppleEvents]);


    // Combine all tasks from different sources
    const allTasks = useMemo(() => {
        const backendTasks = data ? [...(data.todaysTasks || []), ...(data.weekTasks || [])] : [];
        const combined = [...backendTasks, ...appleEvents];

        // Remove duplicates by id
        const uniqueMap = new Map();
        combined.forEach(task => uniqueMap.set(task.id, task));
        return Array.from(uniqueMap.values());
    }, [data, appleEvents]);

    // Handle refresh
    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();

        // Re-fetch apple events for current view
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const startDate = new Date(year, month, 1 - startingDayOfWeek);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 42);

        await fetchAppleEvents(startDate, endDate);

        setRefreshing(false);
    }, [refetch, currentMonth, fetchAppleEvents]);

    // Handle create task from edit button
    const handleCreateTask = React.useCallback((title: string, type: TaskType, dueDate?: string, module?: string) => {
        // If a date is selected, use it; otherwise use provided date
        const targetDate = selectedDates.length > 0
            ? selectedDates[0].toISOString()
            : dueDate;

        createTask.mutate({
            title,
            type,
            due_date: targetDate,
            module,
        });
        setShowQuickAddModal(false);
    }, [createTask, selectedDates]);

    // Get displayed tasks - either filtered by selected dates or top 3 urgent
    const displayedTasks = useMemo(() => {
        // Always filter out completed tasks
        const activeTasks = allTasks.filter(task => task.status !== 'completed');

        if (selectedDates.length > 0) {
            // Filter tasks for selected dates
            const selectedDateKeys = selectedDates.map(d =>
                d.toISOString().split('T')[0]
            );

            return activeTasks.filter(task => {
                if (!task.due_date) return false;
                const taskDateKey = new Date(task.due_date).toISOString().split('T')[0];
                return selectedDateKeys.includes(taskDateKey);
            });
        }

        // No dates selected - show top 3 most urgent
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureTasks = activeTasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() >= today.getTime();
        });

        const sorted = futureTasks.sort((a, b) => {
            const urgencyA = getDeadlineUrgency(new Date(a.due_date));
            const urgencyB = getDeadlineUrgency(new Date(b.due_date));

            const urgencyOrder = { urgent: 0, soon: 1, later: 2, none: 3 };
            const urgencyDiff = urgencyOrder[urgencyA] - urgencyOrder[urgencyB];

            if (urgencyDiff !== 0) return urgencyDiff;

            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        return sorted.slice(0, 3);
    }, [allTasks, selectedDates]);

    // Map tasks to dates with urgency
    const tasksByDate = useMemo(() => {
        const map = new Map<string, { urgency: 'urgent' | 'soon' | 'later' | 'none' }>();

        allTasks.forEach((task: any) => {
            if (!task.due_date) return;

            const dueDate = new Date(task.due_date);
            const dateKey = dueDate.toISOString().split('T')[0];
            const urgency = getDeadlineUrgency(dueDate);

            // If day already has a task, keep the most urgent
            const existing = map.get(dateKey);
            if (!existing ||
                (urgency === 'urgent') ||
                (urgency === 'soon' && existing.urgency !== 'urgent') ||
                (urgency === 'later' && existing.urgency === 'none')) {
                map.set(dateKey, { urgency });
            }
        });

        return map;
    }, [allTasks]);

    // Generate months for horizontal scroll (past 12 months to future 12 months)
    const months = useMemo(() => {
        const today = new Date();
        const result = [];
        for (let i = -12; i <= 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            result.push(d);
        }
        return result;
    }, []);

    // Get days for a specific month
    const getDaysForMonth = (monthDate: Date) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const prevMonthLastDay = new Date(year, month, 0);
        const daysFromPrevMonth = startingDayOfWeek;

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Previous month days
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
            days.push({
                date,
                dayNumber: prevMonthLastDay.getDate() - i,
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            date.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDates.some(d => d.getTime() === date.getTime());

            const dateKey = date.toISOString().split('T')[0];
            const taskInfo = tasksByDate.get(dateKey);

            days.push({
                date,
                dayNumber: i,
                isCurrentMonth: true,
                isToday,
                isSelected,
                urgency: taskInfo?.urgency || 'none',
            });
        }

        // Next month days (fill to 42)
        const totalDays = days.length;
        const daysToAdd = 42 - totalDays;
        for (let i = 1; i <= daysToAdd; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                dayNumber: i,
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
            });
        }
        return days;
    };

    const renderMonth = ({ item }: { item: Date }) => {
        const days = getDaysForMonth(item);
        const dayWidth = (screenWidth - 40) / 7; // 40 = paddingHorizontal 20*2

        return (
            <View style={{ width: screenWidth - 40, marginRight: 0 }}>
                <View style={styles.daysGrid}>
                    {days.map((day, index) => {
                        let urgencyStyle = {};
                        if (!day.isSelected && day.isCurrentMonth && day.urgency !== 'none') {
                            if (day.urgency === 'urgent') urgencyStyle = styles.dayCircleUrgent;
                            else if (day.urgency === 'soon') urgencyStyle = styles.dayCircleSoon;
                            else if (day.urgency === 'later') urgencyStyle = styles.dayCircleLater;
                        }

                        const dayStyle = [
                            styles.dayCircle,
                            { width: dayWidth, height: 48 }, // Fixed width for alignment
                            !day.isCurrentMonth && styles.dayCircleInactive,
                            day.isSelected && styles.dayCircleSelected,
                            day.isToday && !day.isSelected && styles.dayCircleToday,
                            urgencyStyle,
                        ];

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[dayStyle, { width: dayWidth, alignItems: 'center' }]} // Ensure width is applied
                                onPress={() => handleDayPress(day)}
                                disabled={!day.isCurrentMonth}
                            >
                                <Text style={[
                                    styles.dayNumber,
                                    !day.isCurrentMonth && styles.dayNumberInactive,
                                    day.isSelected && styles.dayNumberSelected
                                ]}>
                                    {day.dayNumber}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Update current month when scrolling
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0].item;
            if (item && item.getTime() !== currentMonth.getTime()) {
                // Only update if different to avoid loops, though strict equality handles it
                // We DON'T set currentMonth here because it triggers re-render of huge list.
                // But we need it for Title. 
                // Actually, if we update state, it re-renders. 
                // Let's use `setCurrentMonth` but be careful.
                const newDate = new Date(item);
                // Check if month/year changed
                if (newDate.getMonth() !== currentMonth.getMonth() || newDate.getFullYear() !== currentMonth.getFullYear()) {
                    setCurrentMonth(newDate);
                }
            }
        }
    }).current;

    // Handle day press
    const handleDayPress = (day: CalendarDay) => {
        if (!day.isCurrentMonth) return;

        const dateTime = day.date.getTime();
        const isAlreadySelected = selectedDates.some((d) => d.getTime() === dateTime);

        if (isAlreadySelected) {
            // Deselect
            setSelectedDates(selectedDates.filter((d) => d.getTime() !== dateTime));
        } else {
            // Select (multi-select)
            setSelectedDates([...selectedDates, day.date]);
        }
    };

    // Format current month display
    const currentMonthDisplay = currentMonth.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).replace(/\//g, '.');

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2D2D2D"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuButton}>
                        <View style={styles.gridIcon}>
                            <View style={styles.gridDot} />
                            <View style={styles.gridDot} />
                            <View style={styles.gridDot} />
                            <View style={styles.gridDot} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.title}>Calendar</Text>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Text style={styles.notificationIcon}>🔔</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Selector */}
                <View style={styles.dateSelectorRow}>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.calendarIcon}>📅</Text>
                        <Text style={styles.dateText}>{currentMonthDisplay}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setShowQuickAddModal(true)}
                    >
                        <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Container */}
                <View style={styles.calendarContainer}>
                    {/* Week Day Labels */}
                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, index) => (
                            <Text key={index} style={[styles.weekDayLabel, { width: (screenWidth - 40) / 7 }]}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Horizontal Scrollable Months */}
                    <FlatList
                        data={months}
                        renderItem={renderMonth}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={12} // Start at current month
                        getItemLayout={(data, index) => ({
                            length: screenWidth - 40,
                            offset: (screenWidth - 40) * index,
                            index,
                        })}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 50
                        }}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>

                {/* Upcoming Tasks */}
                <View style={styles.upcomingSection}>
                    <Text style={styles.upcomingSectionTitle}>
                        {selectedDates.length > 0 ? 'Tasks for Selected Date' : 'Upcoming'}
                    </Text>
                    {displayedTasks.length > 0 ? (
                        displayedTasks.map((task: any, index: number) => {
                            const urgency = getDeadlineUrgency(new Date(task.due_date));
                            let bgStyle = styles.taskCardLater;
                            if (urgency === 'urgent') bgStyle = styles.taskCardUrgent;
                            else if (urgency === 'soon') bgStyle = styles.taskCardSoon;

                            const dueDate = new Date(task.due_date);
                            const dateStr = dueDate.toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                            });

                            const timeStr = dueDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            });

                            // Swipe actions
                            const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
                                const translateX = progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                });

                                return (
                                    <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                                        <TouchableOpacity
                                            style={[styles.swipeButton, styles.editSwipeButton]}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                setSelectedTask(task);
                                            }}
                                        >
                                            <Text style={styles.swipeIcon}>✏️</Text>
                                            <Text style={styles.swipeText}>Edit</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            };

                            const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
                                const translateX = progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-80, 0],
                                });

                                return (
                                    <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                                        <TouchableOpacity
                                            style={[styles.swipeButton, styles.deleteSwipeButton]}
                                            onPress={() => {
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                                Alert.alert(
                                                    'Delete Task',
                                                    `Are you sure you want to delete "${task.title}"?`,
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Delete',
                                                            style: 'destructive',
                                                            onPress: () => {
                                                                if ((task as any).isAppleCalendar || task.id.startsWith('apple-')) {
                                                                    deleteAppleEvent(task.id).catch(err => {
                                                                        Alert.alert('Error', 'Failed to delete Apple Calendar event');
                                                                    });
                                                                } else {
                                                                    deleteTask.mutate(task.id);
                                                                }
                                                            },
                                                        },
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text style={styles.swipeIcon}>🗑️</Text>
                                            <Text style={styles.swipeText}>Delete</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            };

                            return (
                                <Swipeable
                                    key={task.id}
                                    renderRightActions={renderRightActions}
                                    renderLeftActions={renderLeftActions}
                                    overshootRight={false}
                                    overshootLeft={false}
                                    friction={2}
                                >
                                    <TouchableOpacity
                                        style={[styles.taskCard, bgStyle]}
                                        onPress={() => setSelectedTask(task)}
                                    >
                                        <View style={styles.taskCardHeader}>
                                            <Text style={styles.taskCardTitle} numberOfLines={1}>
                                                {task.title}
                                            </Text>
                                            <Text style={styles.taskCardType}>
                                                {task.type}
                                            </Text>
                                        </View>
                                        <View style={styles.taskCardFooter}>
                                            <Text style={styles.taskCardDate}>
                                                📅 {dateStr}
                                            </Text>
                                            {task.due_date && task.due_date.includes('T') && task.due_date.split('T')[1] !== '00:00:00.000Z' && (
                                                <Text style={styles.taskCardTime}>
                                                    🕐 {timeStr}
                                                </Text>
                                            )}
                                        </View>
                                        {task.module && (
                                            <Text style={styles.taskCardModule} numberOfLines={1}>
                                                {task.module}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </Swipeable>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyStateText}>
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            <DatePickerModal
                visible={showDatePicker}
                currentDate={currentMonth}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={(date) => {
                    setCurrentMonth(date);
                    setSelectedDates([]); // Clear selections when changing month
                }}
            />

            {/* Quick Add Modal */}
            <QuickAddTaskModal
                visible={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSubmit={handleCreateTask}
            />

            {/* Task Detail Modal */}
            {/* Task Detail Modal */}
            <TaskDetailModal
                visible={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                // Tasks from Apple Calendar have 'apple-' prefix or isAppleCalendar prop
                onComplete={(id) => {
                    if (id.startsWith('apple-')) return;
                    completeTask.mutate(id);
                    setSelectedTask(null);
                }}
                onUncomplete={(id) => {
                    if (id.startsWith('apple-')) return;
                    uncompleteTask.mutate(id);
                    setSelectedTask(null);
                }}
                onDelete={(id) => {
                    if (id.startsWith('apple-')) {
                        deleteAppleEvent(id)
                            .then(() => setSelectedTask(null))
                            .catch(() => Alert.alert('Error', 'Failed to delete event'));
                    } else {
                        deleteTask.mutate(id);
                        setSelectedTask(null);
                    }
                }}
                onUpdate={(id, updates) => {
                    if (id.startsWith('apple-')) {
                        Alert.alert('Notice', 'Editing Apple Calendar events is not supported yet.');
                        return;
                    }
                    updateTask.mutate({ taskId: id, updates });
                    // Modal updates optimistically or via query refetch
                }}
            />
            <DatePickerModal
                visible={showDatePicker}
                currentDate={currentMonth}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={(date) => {
                    setCurrentMonth(date);
                    // Also select this date so it's highlighted
                    setSelectedDates([date]);
                }}
            />

            <QuickAddTaskModal
                visible={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSubmit={(title, type, dueDate, module) => handleCreateTask(title, type, dueDate, module)}
                initialDate={selectedDates.length > 0 ? selectedDates[0] : undefined}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        paddingBottom: 100, // Space for floating bottom nav
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 20,
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridIcon: {
        width: 24,
        height: 24,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    gridDot: {
        width: 8,
        height: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    notificationButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
    },
    notificationIcon: {
        fontSize: 20,
    },
    dateSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    calendarIcon: {
        fontSize: 18,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    dropdownIcon: {
        fontSize: 12,
        color: '#6B6B6B',
    },
    editButton: {
        width: 56,
        height: 56,
        backgroundColor: '#1A1A1A',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        fontSize: 24,
    },
    calendarContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 0,
    },
    weekDayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 0,
        paddingHorizontal: 0,
    },
    dayCircle: {
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    dayCircleInactive: {
        opacity: 0.3,
    },
    dayCircleSelected: {
        backgroundColor: '#1A1A1A',
    },
    dayCircleToday: {
        borderWidth: 2,
        borderColor: '#4A4A4A',
    },
    dayCircleUrgent: {
        backgroundColor: '#FEE2E2', // Light red
    },
    dayCircleSoon: {
        backgroundColor: '#FED7AA', // Light orange
    },
    dayCircleLater: {
        backgroundColor: '#DBEAFE', // Light blue
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    dayNumberInactive: {
        color: '#9BA0A8',
    },
    dayNumberSelected: {
        color: '#FFFFFF',
    },
    upcomingSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    upcomingSectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    taskCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    taskCardUrgent: {
        backgroundColor: '#FEE2E2',
    },
    taskCardSoon: {
        backgroundColor: '#FED7AA',
    },
    taskCardLater: {
        backgroundColor: '#DBEAFE',
    },
    taskCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    taskCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 12,
    },
    taskCardType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    taskCardFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    taskCardDate: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A4A4A',
    },
    taskCardTime: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A4A4A',
    },
    taskCardModule: {
        fontSize: 13,
        color: '#6B6B6B',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9BA0A8',
        textAlign: 'center',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    taskDetailCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    taskDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    taskDetailTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 12,
    },
    closeButton: {
        fontSize: 24,
        color: '#6B6B6B',
        fontWeight: '300',
    },
    taskDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    taskDetailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    taskDetailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
        textAlign: 'right',
        flex: 1,
        marginLeft: 12,
    },
    taskDetailUrgency: {
        fontWeight: '700',
        color: '#EF4444',
    },
    swipeAction: {
        justifyContent: 'center',
        marginBottom: 12,
    },
    swipeButton: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    editSwipeButton: {
        backgroundColor: '#3B82F6',
    },
    deleteSwipeButton: {
        backgroundColor: '#EF4444',
    },
    swipeIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    swipeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});
