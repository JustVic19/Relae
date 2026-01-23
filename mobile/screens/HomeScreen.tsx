import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Animated,
    Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHomescreenData, useRefreshHomescreen, useTaskMutations } from '../hooks/useHomescreen';
import { useWeeklyGoal, useWeeklyStats } from '../hooks/useWeeklyGoal';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { useProfile } from '../hooks/useProfile';
import { useTaskCompletion } from '../hooks/useTaskCompletion';
import { useEmailIntegrations } from '../hooks/useEmailIntegrations';
import QuickAddTaskModal from '../components/QuickAddTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import EditGoalModal from '../components/EditGoalModal';
import NotificationModal from '../components/NotificationModal';
import ProfileModal from '../components/ProfileModal';
import EmailOnboardingWalkthrough from '../components/EmailOnboardingWalkthrough';
import EmailConnectionScreen from '../screens/EmailConnectionScreen';
import { TaskType, Task } from '../services/homescreenService';

// Utility function to get countdown text
function getCountdownText(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Overdue';
    if (hours < 1) return 'Due now';
    if (hours < 24) return `${hours}h left`;
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
}

// Utility function to calculate urgency
function calculateUrgency(dueDate: Date): 'urgent' | 'soon' | 'later' {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours <= 24) return 'urgent';
    if (hours <= 72) return 'soon';
    return 'later';
}

// Utility functions for weekly goal
function getAchievementBadge(): string {
    const badges = ['🏆', '🎉', '⭐', '🔥', '💪', '🎯', '✨'];
    return badges[Math.floor(Math.random() * badges.length)];
}

function getMotivationalQuote(): string {
    const quotes = [
        "You're on fire!",
        "Beast mode activated!",
        "Unstoppable!",
        "Crushing it!",
        "On a roll!",
        "Phenomenal work!",
        "You're amazing!",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Placeholder for skeleton loader
function HomescreenSkeleton() {
    return (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonHeader}>
                <View style={{ flex: 1 }}>
                    <View style={[styles.skeletonBox, { width: '60%', height: 24, marginBottom: 8 }]} />
                    <View style={[styles.skeletonBox, { width: '40%', height: 16 }]} />
                </View>
                <View style={[styles.skeletonBox, { width: 50, height: 50, borderRadius: 25 }]} />
            </View>
            <View style={[styles.skeletonBox, { height: 60, marginVertical: 20, borderRadius: 30 }]} />
            <View style={[styles.skeletonBox, { height: 200, marginBottom: 20, borderRadius: 20 }]} />
            {[1, 2].map((i) => (
                <View key={i} style={[styles.skeletonBox, { height: 100, marginBottom: 16, borderRadius: 20 }]} />
            ))}
        </View>
    );
}

export default function HomeScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { data, isLoading, isError, error } = useHomescreenData();
    const refreshHomescreen = useRefreshHomescreen();
    const { createTask, completeTask, uncompleteTask, deleteTask, updateTask } = useTaskMutations();
    const { weeklyGoal, updateGoal, isUpdating } = useWeeklyGoal();
    const { stats: weeklyStats, currentWeek } = useWeeklyStats(4);
    const unreadCount = useUnreadCount();
    const { profile } = useProfile();
    const { checkOverdueTasks, scheduleTaskReminder } = useTaskCompletion();
    const { hasConnectedEmail } = useEmailIntegrations();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'review' | 'progress' | 'completed'>('review');
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);
    const [showAllDeadlines, setShowAllDeadlines] = useState(false);
    const [showEditGoalModal, setShowEditGoalModal] = useState(false);
    const [showWeeklyBreakdown, setShowWeeklyBreakdown] = useState(false);
    const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'soon' | 'later'>('all');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEmailOnboarding, setShowEmailOnboarding] = useState(false);
    const [showEmailConnection, setShowEmailConnection] = useState(false);

    // Check if user should see email onboarding (only for first-time users with no emails)
    useEffect(() => {
        async function checkOnboardingStatus() {
            const hasSeenOnboarding = await AsyncStorage.getItem('email_onboarding_shown');
            // Only show walkthrough if user hasn't seen it AND has no connected emails
            if (!hasSeenOnboarding && !isLoading && !hasConnectedEmail) {
                // Show after a short delay to let home screen load
                setTimeout(() => {
                    setShowEmailOnboarding(true);
                }, 1000);
            }
        }
        checkOnboardingStatus();
    }, [isLoading, hasConnectedEmail]);

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await checkOverdueTasks(); // Check for overdue tasks on refresh
        await refreshHomescreen();
        setRefreshing(false);
    }, [refreshHomescreen, checkOverdueTasks]);

    const handleCreateTask = React.useCallback((title: string, type: TaskType, dueDate?: string, module?: string) => {
        const today = new Date();
        const taskDate = dueDate || today.toISOString();

        console.log('Creating task:', { title, type, dueDate: taskDate, module });

        createTask.mutate({
            title,
            type,
            due_date: taskDate,
            module,
        }, {
            onSuccess: (newTask) => {
                // Schedule reminder if task has a due date
                if (dueDate) {
                    const dueDateObj = new Date(dueDate);
                    scheduleTaskReminder(newTask.id, title, dueDateObj);
                }
            }
        });
    }, [createTask, scheduleTaskReminder]);

    // Show skeleton while loading
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <HomescreenSkeleton />
            </SafeAreaView>
        );
    }

    // Show error state
    if (isError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Something went wrong</Text>
                    <Text style={styles.errorSubtext}>{error?.message}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const displayName = data?.user?.displayName || 'there';
    const todaysTasks = data?.todaysTasks || [];
    const progress = data?.progress;

    // Filter tasks based on status
    const pendingTasks = todaysTasks.filter(t => t.status === 'pending');
    const inProgressTasks = todaysTasks.filter(t => t.status === 'in_progress');
    const completedTasks = data?.completedTasks || [];

    // DEBUG: Log completed tasks
    console.log('\ud83d\udc1b [HomeScreen] Completed tasks count:', completedTasks.length);
    console.log('\ud83d\udc1b [HomeScreen] Completed tasks:', completedTasks.map(t => ({ id: t.id, title: t.title, completed_at: t.completed_at })));

    // Tab counts
    const inReviewCount = pendingTasks.length;
    const inProgressCount = inProgressTasks.length;
    const completedCount = completedTasks.length;

    // Show filtered tasks based on active tab
    const displayedTasks =
        activeTab === 'review' ? pendingTasks :
            activeTab === 'progress' ? inProgressTasks :
                completedTasks;


    // Get today's date for display
    const today = new Date();
    const dayNum = today.getDate();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });

    // Extract unique hashtags from modules/types (for demo)
    const hashtags = Array.from(new Set(
        displayedTasks
            .map(t => t.module || t.type.toLowerCase())
            .filter(Boolean)
            .slice(0, 3)
    ));

    // Count high priority tasks
    const highPriorityCount = displayedTasks.filter(t =>
        t.type === 'DEADLINE' || t.type === 'ADMIN'
    ).length;

    // Task Insights calculations
    const completionRate = todaysTasks.length > 0
        ? Math.round((completedTasks.length / todaysTasks.length) * 100)
        : 0;

    // Most common task type
    const taskTypeCounts = todaysTasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonType = Object.entries(taskTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Calculate streak (simple version: 1 if completed today, 0 otherwise)
    const currentStreak = completedTasks.length > 0 ? 1 : 0;

    // Upcoming deadlines (next 5 tasks sorted by due date)
    const upcomingDeadlines = [...todaysTasks]
        .filter(t => t.due_date && t.status !== 'completed')
        .sort((a, b) => {
            const dateA = new Date(a.due_date!).getTime();
            const dateB = new Date(b.due_date!).getTime();
            return dateA - dateB;
        })
        .slice(0, 5);

    // Apply urgency filter
    const filteredDeadlines = upcomingDeadlines.filter(task => {
        if (urgencyFilter === 'all') return true;

        const dueDate = new Date(task.due_date!);
        const now = new Date();
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (urgencyFilter === 'urgent') return hoursUntilDue < 24;
        if (urgencyFilter === 'soon') return hoursUntilDue >= 24 && hoursUntilDue < 72;
        if (urgencyFilter === 'later') return hoursUntilDue >= 72;

        return true;
    });


    // Weekly progress from current week stats
    const weeklyProgress = currentWeek?.tasks_completed || completedTasks.length;
    const weeklyPercentage = Math.min((weeklyProgress / weeklyGoal) * 100, 100);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#6C63FF"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Hello 👋, {displayName}!</Text>
                        <Text style={styles.subtitle}>Welcome back</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => setShowNotificationModal(true)}
                        >
                            <Text style={styles.notificationIcon}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.avatar}
                            onPress={() => setShowProfileModal(true)}
                        >
                            {!profile?.avatar_url ? (
                                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                            ) : profile.avatar_url.startsWith('emoji:') ? (
                                <Text style={styles.avatarEmoji}>{profile.avatar_url.replace('emoji:', '')}</Text>
                            ) : profile.avatar_url.startsWith('initials:') ? (
                                (() => {
                                    const [, initials, color] = profile.avatar_url.split(':');
                                    return (
                                        <View style={[styles.avatarInitials, { backgroundColor: color }]}>
                                            <Text style={styles.avatarInitialsText}>{initials}</Text>
                                        </View>
                                    );
                                })()
                            ) : (
                                <>
                                    {console.log('HomeScreen rendering image:', profile.avatar_url)}
                                    <Image
                                        source={{ uri: profile.avatar_url }}
                                        style={styles.avatarImage}
                                        onError={(error) => console.error('HomeScreen image error:', error.nativeEvent)}
                                        onLoad={() => console.log('HomeScreen image loaded')}
                                    />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Email Connection Prompt Pill (if not connected) */}
                {!hasConnectedEmail && (
                    <TouchableOpacity
                        style={styles.connectionPromptPill}
                        onPress={() => setShowEmailOnboarding(true)}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.connectionPromptIcon}>📧</Text>
                        <Text style={styles.connectionPromptText}>Connect your school email</Text>
                        <Text style={styles.connectionPromptArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Manage your task section */}
                <Text style={styles.sectionTitle}>Manage your task</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'review' && styles.tabActive]}
                        onPress={() => setActiveTab('review')}
                    >
                        <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>
                            In Review
                        </Text>
                        <View style={[styles.tabBadge, activeTab === 'review' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'review' && styles.tabBadgeTextActive]}>
                                {inReviewCount}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
                        onPress={() => setActiveTab('progress')}
                    >
                        <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
                            In Progress
                        </Text>
                        <View style={[styles.tabBadge, activeTab === 'progress' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'progress' && styles.tabBadgeTextActive]}>
                                {inProgressCount}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                            Completed
                        </Text>
                        <View style={[styles.tabBadge, activeTab === 'completed' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'completed' && styles.tabBadgeTextActive]}>
                                {completedCount}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Current tasks summary card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.dateIndicator}>
                            <Text style={styles.dateIcon}>📅</Text>
                            <Text style={styles.dateText}>{dayNum} {dayName}</Text>
                        </View>
                        <View style={styles.summaryActions}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Text style={styles.iconButtonText}>🔗</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowQuickAddModal(true)}
                            >
                                <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.currentTasksLabel}>Current tasks</Text>

                    <View style={styles.taskCountRow}>
                        <Text style={styles.taskCountText}>You have </Text>
                        <Text style={styles.taskCountNumber}>{displayedTasks.length}</Text>
                        <Text style={styles.taskCountText}> tasks </Text>
                        {highPriorityCount > 0 && (
                            <View style={styles.priorityBadge}>
                                <Text style={styles.priorityBadgeText}>High ⚠️</Text>
                            </View>
                        )}
                        <Text style={styles.taskCountText}> for today</Text>
                    </View>

                    {hashtags.length > 0 && (
                        <View style={styles.hashtagContainer}>
                            {hashtags.map((tag, index) => (
                                <Text key={index} style={styles.hashtag}>#{tag}</Text>
                            ))}
                        </View>
                    )}
                </View>

                {/* Task cards */}
                {displayedTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>🎉</Text>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'review' ? 'No tasks to review!' :
                                activeTab === 'progress' ? 'No tasks in progress!' :
                                    'No completed tasks yet!'}
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            {activeTab === 'completed' ? 'Complete some tasks to see them here' : 'Tap + to add a new task'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Overlay to close menu when clicking outside */}
                        {openMenuTaskId && (
                            <TouchableOpacity
                                style={styles.menuOverlay}
                                activeOpacity={1}
                                onPress={() => setOpenMenuTaskId(null)}
                            />
                        )}

                        {displayedTasks.slice(0, 3).map((task) => {
                            const taskDate = task.due_date ? new Date(task.due_date) : new Date();
                            const taskDayNum = taskDate.getDate();
                            const taskDayName = taskDate.toLocaleDateString('en-US', { weekday: 'short' });

                            // Swipe actions - matching Calendar implementation
                            const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
                                const translateX = progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                });

                                return (
                                    <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                                        <TouchableOpacity
                                            style={[styles.swipeButton, styles.completeSwipeButton]}
                                            onPress={() => {
                                                console.log('🟢 [Swipe] Complete button pressed for task:', task.id);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                completeTask.mutate(task.id);
                                            }}
                                        >
                                            <Text style={styles.swipeIcon}>✅</Text>
                                            <Text style={styles.swipeText}>Complete</Text>
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
                                                            onPress: () => deleteTask.mutate(task.id),
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
                                >
                                    <TouchableOpacity
                                        style={styles.taskCard}
                                        onPress={() => {
                                            if (!openMenuTaskId) {
                                                setSelectedTask(task);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.taskDateBadge}>
                                            <Text style={styles.taskDateNum}>{taskDayNum}</Text>
                                            <Text style={styles.taskDateDay}>{taskDayName}</Text>
                                        </View>

                                        <View style={styles.taskContent}>
                                            <View style={styles.taskHeader}>
                                                <Text style={styles.taskTitle}>{task.title}</Text>
                                                {task.type === 'EVENT' && (
                                                    <Text style={styles.taskLiveIndicator}>🟢</Text>
                                                )}
                                            </View>
                                            {task.module && (
                                                <Text style={styles.taskSubtitle}>{task.module}</Text>
                                            )}
                                        </View>

                                        <View style={styles.taskActions}>
                                            <TouchableOpacity
                                                style={styles.taskActionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuTaskId(openMenuTaskId === task.id ? null : task.id);
                                                }}
                                            >
                                                <Text style={styles.taskActionIcon}>⋯</Text>
                                            </TouchableOpacity>

                                            {/* Context Menu */}
                                            {openMenuTaskId === task.id && (
                                                <View style={styles.contextMenu}>
                                                    <TouchableOpacity
                                                        style={styles.menuItem}
                                                        onPress={() => {
                                                            setOpenMenuTaskId(null);
                                                            setSelectedTask(task);
                                                        }}
                                                    >
                                                        <Text style={styles.menuItemText}>✏️ Edit</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.menuItem}
                                                        onPress={() => {
                                                            const newStatus = task.status === 'pending' ? 'in_progress' : 'pending';
                                                            updateTask.mutate({
                                                                taskId: task.id,
                                                                updates: { status: newStatus }
                                                            });
                                                            setOpenMenuTaskId(null);
                                                        }}
                                                    >
                                                        <Text style={styles.menuItemText}>
                                                            {task.status === 'pending' ? '🔄 Move to In Review' : '⬅️ Move to In Progress'}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.menuItem}
                                                        onPress={() => {
                                                            completeTask.mutate(task.id);
                                                            setOpenMenuTaskId(null);
                                                        }}
                                                    >
                                                        <Text style={styles.menuItemText}>✅ Complete</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.menuItem, styles.menuItemDanger]}
                                                        onPress={() => {
                                                            deleteTask.mutate(task.id);
                                                            setOpenMenuTaskId(null);
                                                        }}
                                                    >
                                                        <Text style={styles.menuItemDangerText}>🗑️ Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {task.links && task.links.length > 0 && (
                                                <TouchableOpacity style={styles.taskActionButtonDark}>
                                                    <Text style={styles.taskActionIconDark}>📎</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Swipeable>
                            );
                        })}

                        {/* See more link */}
                        {displayedTasks.length > 3 && (
                            <TouchableOpacity style={styles.seeMoreContainer}>
                                <Text style={styles.seeMoreText}>
                                    See {displayedTasks.length - 3} more task{displayedTasks.length - 3 !== 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.seeMoreArrow}>→</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )
                }

                {/* Task Insights Section */}
                < View style={styles.insightsSection} >
                    <Text style={styles.sectionTitle}>📊 Task Insights</Text>
                    <View style={styles.insightsGrid}>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightValue}>{completedTasks.length}</Text>
                            <Text style={styles.insightLabel}>Completed</Text>
                        </View>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightValue}>{completionRate}%</Text>
                            <Text style={styles.insightLabel}>Rate</Text>
                        </View>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightValue}>{currentStreak} 🔥</Text>
                            <Text style={styles.insightLabel}>Day Streak</Text>
                        </View>
                    </View>
                </View>

                {/* Upcoming Deadlines Section */}
                <View style={styles.deadlinesSection}>
                    <View style={styles.deadlinesSectionHeader}>
                        <Text style={styles.sectionTitle}>⏰ Upcoming Deadlines</Text>
                        {upcomingDeadlines.length > 5 && (
                            <TouchableOpacity onPress={() => setShowAllDeadlines(!showAllDeadlines)}>
                                <Text style={styles.seeMoreLink}>
                                    {showAllDeadlines ? 'See less' : `See ${upcomingDeadlines.length - 5} more`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Urgency Filter Pills */}
                    <View style={styles.filterContainer}>
                        {[
                            { key: 'all', label: 'All', emoji: '' },
                            { key: 'urgent', label: 'Urgent', emoji: '🔴' },
                            { key: 'soon', label: 'Soon', emoji: '🟠' },
                            { key: 'later', label: 'Later', emoji: '🔵' },
                        ].map(filter => (
                            <TouchableOpacity
                                key={filter.key}
                                style={[
                                    styles.filterPill,
                                    urgencyFilter === filter.key && styles.filterPillActive
                                ]}
                                onPress={() => setUrgencyFilter(filter.key as any)}
                            >
                                <Text style={[
                                    styles.filterPillText,
                                    urgencyFilter === filter.key && styles.filterPillTextActive
                                ]}>
                                    {filter.emoji} {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {filteredDeadlines.length > 0 ? (
                        (showAllDeadlines ? filteredDeadlines : filteredDeadlines.slice(0, 5)).map((task) => {
                            const dueDate = new Date(task.due_date!);
                            const now = new Date();
                            const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                            // Urgency color
                            let urgencyColor = '#3B82F6'; // Blue (> 7 days)
                            if (hoursUntilDue < 24) urgencyColor = '#EF4444'; // Red
                            else if (hoursUntilDue < 72) urgencyColor = '#F59E0B'; // Orange

                            // Pulsing animation for very urgent (< 12 hours)
                            const isVeryUrgent = hoursUntilDue < 12 && hoursUntilDue > 0;

                            // Countdown text
                            const countdownText = getCountdownText(dueDate);

                            // Swipe actions - matching Calendar implementation
                            const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
                                const translateX = progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                });

                                return (
                                    <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                                        <TouchableOpacity
                                            style={[styles.swipeButton, styles.completeSwipeButton]}
                                            onPress={() => {
                                                console.log('🟢 [Swipe] Complete button pressed for task:', task.id);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                completeTask.mutate(task.id);
                                            }}
                                        >
                                            <Text style={styles.swipeIcon}>✅</Text>
                                            <Text style={styles.swipeText}>Complete</Text>
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
                                                            onPress: () => deleteTask.mutate(task.id),
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
                                >
                                    <TouchableOpacity
                                        style={[styles.deadlineItem, isVeryUrgent && styles.deadlineItemPulsing]}
                                        onPress={() => setSelectedTask(task)}
                                    >
                                        <View style={[styles.urgencyIndicator, { backgroundColor: urgencyColor }]} />
                                        <View style={styles.deadlineContent}>
                                            <Text style={styles.deadlineTitle} numberOfLines={1}>{task.title}</Text>
                                            {task.module && (
                                                <Text style={styles.deadlineModule}>{task.module}</Text>
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.deadlineDate,
                                            hoursUntilDue < 24 && styles.deadlineDateUrgent
                                        ]}>
                                            {countdownText}
                                        </Text>
                                    </TouchableOpacity>
                                </Swipeable>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyDeadlinesText}>No upcoming deadlines</Text>
                    )}
                </View>

                {/* Weekly Goal Section */}
                <View style={styles.weeklyGoalSection}>
                    <View style={styles.weeklyGoalHeader}>
                        <Text style={styles.sectionTitle}>🎯 Weekly Goal</Text>
                        <TouchableOpacity onPress={() => setShowEditGoalModal(true)}>
                            <Text style={styles.goalProgress}>{weeklyProgress}/{weeklyGoal}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${weeklyPercentage}%` }]} />
                    </View>

                    {/* Achievement badge and message */}
                    {weeklyProgress >= weeklyGoal ? (
                        <View style={styles.achievementContainer}>
                            <Text style={styles.achievementBadge}>
                                {getAchievementBadge()}
                            </Text>
                            <Text style={styles.achievementText}>
                                {getMotivationalQuote()}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.goalMessage}>
                            {weeklyGoal - weeklyProgress} more to reach your goal
                        </Text>
                    )}

                    {/* Daily Progress Dots */}
                    <View style={styles.dailyProgressContainer}>
                        <Text style={styles.dailyProgressLabel}>This Week:</Text>
                        <View style={styles.dailyProgressDots}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                <View key={day} style={styles.dayDotContainer}>
                                    <View style={[
                                        styles.dayDot,
                                        index < new Date().getDay() && styles.dayDotCompleted
                                    ]} />
                                    <Text style={styles.dayDotLabel}>{day[0]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* View Breakdown Button */}
                    <TouchableOpacity
                        style={styles.breakdownButton}
                        onPress={() => setShowWeeklyBreakdown(!showWeeklyBreakdown)}
                    >
                        <Text style={styles.breakdownButtonText}>
                            {showWeeklyBreakdown ? '▼ Hide Details' : '▶ View Breakdown'}
                        </Text>
                    </TouchableOpacity>

                    {/* Breakdown - Completed Tasks */}
                    {showWeeklyBreakdown && (
                        <View style={styles.breakdownContainer}>
                            {completedTasks.length > 0 ? (
                                completedTasks.map(task => (
                                    <View key={task.id} style={styles.breakdownItem}>
                                        <Text style={styles.breakdownCheck}>✓</Text>
                                        <Text style={styles.breakdownTitle} numberOfLines={1}>
                                            {task.title}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.breakdownEmpty}>No completed tasks this week</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Quick Add Modal */}
            <QuickAddTaskModal
                visible={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSubmit={handleCreateTask}
            />

            {/* Task Detail Modal */}
            <TaskDetailModal
                visible={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onComplete={(id) => completeTask.mutate(id)}
                onUncomplete={(id) => uncompleteTask.mutate(id)}
                onDelete={(id) => deleteTask.mutate(id)}
                onUpdate={(id, updates) => updateTask.mutate({ taskId: id, updates })}
            />

            <EditGoalModal
                visible={showEditGoalModal}
                currentGoal={weeklyGoal}
                onClose={() => setShowEditGoalModal(false)}
                onSave={(newGoal) => {
                    updateGoal(newGoal);
                    setShowEditGoalModal(false);
                }}
                isSaving={isUpdating}
            />

            <NotificationModal
                visible={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
                onNotificationPress={(notification) => {
                    if (notification.task_id && selectedTask?.id !== notification.task_id) {
                        // Find and open the task
                        const task = todaysTasks.find(t => t.id === notification.task_id);
                        if (task) {
                            setSelectedTask(task);
                        }
                    }
                    setShowNotificationModal(false);
                }}
            />

            <ProfileModal
                visible={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onEmailSetup={() => {
                    // If user already has connected email, skip walkthrough and go straight to connection screen
                    if (hasConnectedEmail) {
                        setShowEmailConnection(true);
                    } else {
                        // First time - show walkthrough
                        setShowEmailOnboarding(true);
                    }
                }}
            />

            {/* Email Onboarding Walkthrough */}
            <EmailOnboardingWalkthrough
                visible={showEmailOnboarding}
                onClose={() => setShowEmailOnboarding(false)}
                onComplete={() => {
                    setShowEmailOnboarding(false);
                    setShowEmailConnection(true);
                }}
            />

            {/* Email Connection Screen */}
            <EmailConnectionScreen
                visible={showEmailConnection}
                onClose={() => setShowEmailConnection(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },

    // Skeleton styles
    skeletonContainer: {
        padding: 20,
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    skeletonBox: {
        backgroundColor: '#E8E8E8',
        borderRadius: 8,
    },

    // Header styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#9BA0A8',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 12,
        marginRight: 12,
    },
    notificationIcon: {
        fontSize: 20,
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    avatarEmoji: {
        fontSize: 28,
    },
    avatarInitials: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialsText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    // Section title
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },

    // Tab container
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 26,
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#2D2D2D',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    tabBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
    },
    tabBadgeActive: {
        backgroundColor: '#FFFFFF',
    },
    tabBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    tabBadgeTextActive: {
        color: '#2D2D2D',
    },

    // Summary card
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#000000',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateIcon: {
        fontSize: 16,
    },
    dateText: {
        fontSize: 14,
        color: '#9BA0A8',
        fontWeight: '500',
    },
    summaryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonText: {
        fontSize: 18,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: '300',
    },
    currentTasksLabel: {
        fontSize: 14,
        color: '#9BA0A8',
        marginBottom: 8,
    },
    taskCountRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskCountText: {
        fontSize: 22,
        color: '#1A1A1A',
        fontWeight: '400',
    },
    taskCountNumber: {
        fontSize: 22,
        color: '#1A1A1A',
        fontWeight: '700',
    },
    priorityBadge: {
        backgroundColor: '#E8DCFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    priorityBadgeText: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
    },
    hashtagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    hashtag: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },

    // Task card
    taskCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#000000',
        alignItems: 'center',
        position: 'relative',
        zIndex: 100,
    },
    taskDateBadge: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 16,
        alignItems: 'center',
        minWidth: 50,
    },
    taskDateNum: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    taskDateDay: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    taskLiveIndicator: {
        fontSize: 10,
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#9BA0A8',
    },
    taskActions: {
        flexDirection: 'row',
        gap: 8,
        position: 'relative',
    },
    taskActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskActionIcon: {
        fontSize: 18,
        color: '#6B6B6B',
    },
    taskActionButtonDark: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Context Menu
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
    },
    contextMenu: {
        position: 'absolute',
        top: 45,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        minWidth: 180,
        zIndex: 9999,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    menuItemDanger: {
        borderBottomWidth: 0,
    },
    menuItemDangerText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '500',
    },
    taskActionIconDark: {
        fontSize: 16,
        color: '#FFFFFF',
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9BA0A8',
    },

    // Bottom Navigation
    bottomNav: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: '#2D2D2D',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    navItem: {
        alignItems: 'center',
        padding: 8,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    navIcon: {
        fontSize: 22,
        opacity: 0.5,
    },
    navIconActive: {
        fontSize: 22,
    },
    navLabelActive: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },

    // Error state
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#9BA0A8',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    seeMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 8,
        gap: 8,
    },
    seeMoreText: {
        fontSize: 14,
        color: '#6C63FF',
        fontWeight: '600',
    },
    seeMoreArrow: {
        fontSize: 14,
        color: '#6C63FF',
        fontWeight: '600',
    },
    // Task Insights Section
    insightsSection: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    insightsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    insightCard: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        minHeight: 80,
        justifyContent: 'center',
    },
    insightValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
        textAlign: 'center',
    },
    insightLabel: {
        fontSize: 11,
        color: '#6B6B6B',
        fontWeight: '500',
        textAlign: 'center',
    },
    // Upcoming Deadlines Section
    deadlinesSection: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    deadlineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    urgencyIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
    },
    deadlineContent: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    deadlineModule: {
        fontSize: 13,
        color: '#6B6B6B',
    },
    deadlineDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    emptyDeadlinesText: {
        fontSize: 14,
        color: '#9BA0A8',
        textAlign: 'center',
        paddingVertical: 24,
        fontStyle: 'italic',
    },
    deadlinesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeMoreLink: {
        fontSize: 14,
        color: '#6C63FF',
        fontWeight: '600',
    },
    deadlineItemPulsing: {
        backgroundColor: '#FFF5F5',
    },
    deadlineDateUrgent: {
        color: '#EF4444',
        fontWeight: '700',
    },
    // Filter Styles
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    filterPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterPillActive: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
    },
    // Weekly Goal Section
    weeklyGoalSection: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    weeklyGoalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    goalProgress: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6C63FF',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 4,
    },
    goalMessage: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
        fontWeight: '500',
    },
    // Achievement Styles
    achievementContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    achievementBadge: {
        fontSize: 32,
        marginBottom: 4,
    },
    achievementText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6C63FF',
        textAlign: 'center',
    },
    // Daily Progress Styles
    dailyProgressContainer: {
        marginTop: 20,
    },
    dailyProgressLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        marginBottom: 8,
        fontWeight: '600',
    },
    dailyProgressDots: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayDotContainer: {
        alignItems: 'center',
    },
    dayDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginBottom: 4,
    },
    dayDotCompleted: {
        backgroundColor: '#6C63FF',
    },
    dayDotLabel: {
        fontSize: 10,
        color: '#9BA0A8',
    },
    // Breakdown Styles
    breakdownButton: {
        marginTop: 16,
        paddingVertical: 8,
        alignItems: 'center',
    },
    breakdownButtonText: {
        fontSize: 13,
        color: '#6C63FF',
        fontWeight: '600',
    },
    breakdownContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    breakdownCheck: {
        fontSize: 16,
        color: '#10B981',
    },
    breakdownTitle: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
    },
    breakdownEmpty: {
        fontSize: 14,
        color: '#9BA0A8',
        textAlign: 'center',
        paddingVertical: 16,
        fontStyle: 'italic',
    },
    // Swipe actions - matching Calendar screen
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
    completeSwipeButton: {
        backgroundColor: '#10B981',
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

    // Connection Prompt Pill
    connectionPromptPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    connectionPromptIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    connectionPromptText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    connectionPromptArrow: {
        fontSize: 18,
        color: '#FFFFFF',
    },
});
