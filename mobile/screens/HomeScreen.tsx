import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomescreenData, useRefreshHomescreen, useTaskMutations } from '../hooks/useHomescreen';
import { useAuth } from '../contexts/AuthContext';
import QuickAddTaskModal from '../components/QuickAddTaskModal';
import { TaskType } from '../services/homescreenService';

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

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { data, isLoading, isError, error } = useHomescreenData();
    const refreshHomescreen = useRefreshHomescreen();
    const { createTask } = useTaskMutations();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'progress' | 'review'>('progress');
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refreshHomescreen();
        setRefreshing(false);
    }, [refreshHomescreen]);

    const handleCreateTask = React.useCallback((title: string, type: TaskType, dueDate?: string, module?: string) => {
        const today = new Date();
        const taskDate = dueDate || today.toISOString();

        createTask.mutate({
            title,
            type,
            due_date: taskDate,
            module,
        });
    }, [createTask]);

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

    // Mock data for In Progress / In Review (you can calculate this from task types or status)
    const inProgressCount = todaysTasks.filter(t => t.status === 'pending').length;
    const inReviewCount = 0; // You'll need to add review status logic

    // Get today's date for display
    const today = new Date();
    const dayNum = today.getDate();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });

    // Extract unique hashtags from modules/types (for demo)
    const hashtags = Array.from(new Set(
        todaysTasks
            .map(t => t.module || t.type.toLowerCase())
            .filter(Boolean)
            .slice(0, 3)
    ));

    // Count high priority tasks
    const highPriorityCount = todaysTasks.filter(t =>
        t.type === 'DEADLINE' || t.type === 'ADMIN'
    ).length;

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
                        <TouchableOpacity style={styles.notificationButton}>
                            <Text style={styles.notificationIcon}>🔔</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatar}>
                            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Manage your task section */}
                <Text style={styles.sectionTitle}>Manage your task</Text>
                <View style={styles.tabContainer}>
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
                        <Text style={styles.taskCountNumber}>{todaysTasks.length}</Text>
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
                {todaysTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>🎉</Text>
                        <Text style={styles.emptyStateText}>No tasks for today!</Text>
                        <Text style={styles.emptyStateSubtext}>Tap + to add a new task</Text>
                    </View>
                ) : (
                    todaysTasks.map((task) => {
                        const taskDate = task.due_date ? new Date(task.due_date) : new Date();
                        const taskDayNum = taskDate.getDate();
                        const taskDayName = taskDate.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <View key={task.id} style={styles.taskCard}>
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
                                    <TouchableOpacity style={styles.taskActionButton}>
                                        <Text style={styles.taskActionIcon}>⋯</Text>
                                    </TouchableOpacity>
                                    {task.links && task.links.length > 0 && (
                                        <TouchableOpacity style={styles.taskActionButtonDark}>
                                            <Text style={styles.taskActionIconDark}>📎</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Bottom Navigation Bar (placeholder) */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItemActive}>
                    <Text style={styles.navIconActive}>🏠</Text>
                    <Text style={styles.navLabelActive}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIcon}>📝</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIcon}>📅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Add Modal */}
            <QuickAddTaskModal
                visible={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSubmit={handleCreateTask}
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    notificationIcon: {
        fontSize: 20,
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
        borderColor: '#E8E8E8',
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
        borderColor: '#E8E8E8',
        alignItems: 'center',
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
});
