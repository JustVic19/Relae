import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, Animated, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as API from '../services/api';
import EditCandidateModal from '../components/EditCandidateModal';
import SocialPulse from '../components/SocialPulse';

// Helper function to get source badge
const getSourceBadge = (source?: string) => {
    switch (source) {
        case 'gmail':
            return { icon: '📧', label: 'Gmail', color: '#EA4335' };
        case 'outlook':
            return { icon: '📮', label: 'Outlook', color: '#0078D4' };
        case 'gcal':
            return { icon: '📅', label: 'Google Calendar', color: '#4285F4' };
        case 'outlook_cal':
            return { icon: '📆', label: 'Outlook Calendar', color: '#0078D4' };
        case 'apple_calendar':
            return { icon: '🍎', label: 'Apple Calendar', color: '#000000' };
        default:
            return null;
    }
};

export default function FeedScreen() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'high-confidence' | 'low-confidence' | 'urgent' | 'this-week'>('all');
    const [testMode, setTestMode] = useState(false);

    // Calculate quick stats
    const stats = useMemo(() => {
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const pendingCount = candidates.length;
        // For demo purposes in test mode, we might want to fake some "confirmed this week"
        const confirmedCount = tasks.length;

        const urgentCount = tasks.filter(t => {
            if (!t.due_date) return false;
            const due = new Date(t.due_date);
            return due <= twoDaysFromNow && due >= now;
        }).length;

        return { pendingCount, confirmedCount, urgentCount };
    }, [candidates, tasks]);

    // Mock test candidates for testing filters and source badges
    const mockCandidates = [
        {
            id: 'test-1',
            title: 'Complete Machine Learning Assignment',
            module: 'CS301',
            type: 'assignment',
            due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now (urgent)
            confidence: 0.92,
            source: 'gmail',
            status: 'new',
        },
        {
            id: 'test-2',
            title: 'Team Meeting - Project Discussion',
            module: 'Business Studies',
            type: 'other',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            confidence: 0.45,
            source: 'gcal',
            status: 'new',
        },
        {
            id: 'test-3',
            title: 'Submit Research Paper Draft',
            module: 'English Literature',
            type: 'project',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            confidence: 0.88,
            source: 'outlook',
            status: 'new',
        },
        {
            id: 'test-4',
            title: 'Study Group Session',
            due_date: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // 20 hours from now
            confidence: 0.35,
            source: 'outlook_cal',
            status: 'new',
        },
        {
            id: 'test-5',
            title: 'Doctor Appointment',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            confidence: 0.95,
            source: 'apple_calendar',
            status: 'new',
        },
    ];

    // Fetch feed data on mount
    useEffect(() => {
        fetchFeedData();
    }, []);

    const fetchFeedData = async () => {
        try {
            setLoading(true);
            setError(null);

            const feedData = await API.getFeed();
            const realCandidates = feedData.candidates.filter((c: any) => c.status === 'new');

            // Add mock candidates if test mode is on
            setCandidates(testMode ? [...realCandidates, ...mockCandidates] : realCandidates);
            setTasks(feedData.tasks.filter((t: any) => t.status === 'pending'));
        } catch (err: any) {
            console.error('Failed to fetch feed:', err);
            setError(err.message || 'Failed to load feed');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFeedData();
        setRefreshing(false);
    };

    const handleConfirm = async (candidateId: string) => {
        try {
            // Optimistic update
            setCandidates(prev => prev.filter(c => c.id !== candidateId));

            const { task } = await API.confirmCandidate(candidateId);

            // Add to tasks list
            setTasks(prev => [...prev, task]);

            Alert.alert('Success', 'Task confirmed!');
        } catch (err: any) {
            console.error('Failed to confirm:', err);
            Alert.alert('Error', err.message || 'Failed to confirm task');

            // Revert optimistic update on error
            fetchFeedData();
        }
    };

    const handleEdit = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            setSelectedCandidate(candidate);
            setShowEditModal(true);
        }
    };

    const handleSaveEdit = async (candidateId: string, updates: any) => {
        try {
            // Update via API
            await API.editCandidate(candidateId, updates);

            // Update local state
            setCandidates(prev =>
                prev.map(c => c.id === candidateId ? { ...c, ...updates } : c)
            );

            Alert.alert('Success', 'Task updated successfully!');
        } catch (err: any) {
            console.error('Failed to edit candidate:', err);
            Alert.alert('Error', err.message || 'Failed to update task');
        }
    };

    const handleIgnore = async (candidateId: string) => {
        try {
            // Optimistic update
            setCandidates(prev => prev.filter(c => c.id !== candidateId));

            await API.ignoreCandidate(candidateId, 'not_a_task');

        } catch (err: any) {
            console.error('Failed to ignore:', err);
            Alert.alert('Error', err.message || 'Failed to ignore task');

            // Revert optimistic update on error
            fetchFeedData();
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== taskId));

            await API.completeTask(taskId);

            Alert.alert('Success', 'Task completed!');
        } catch (err: any) {
            console.error('Failed to complete task:', err);
            Alert.alert('Error', err.message || 'Failed to complete task');
            fetchFeedData();
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== taskId));

            await API.deleteTask(taskId);

        } catch (err: any) {
            console.error('Failed to delete task:', err);
            Alert.alert('Error', err.message || 'Failed to delete task');
            fetchFeedData();
        }
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#1A1A1A" />
                <Text style={styles.loadingText}>Loading your tasks...</Text>
            </View>
        );
    }

    // Error state
    if (error && candidates.length === 0 && tasks.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchFeedData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Render swipe actions for confirm (right swipe)
    const renderRightActions = (candidateId: string, progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
        });

        return (
            <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.confirmSwipeButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        handleConfirm(candidateId);
                    }}
                >
                    <Text style={styles.swipeIcon}>✅</Text>
                    <Text style={styles.swipeText}>Confirm</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Render swipe actions for ignore (left swipe)
    const renderLeftActions = (candidateId: string, progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0],
        });

        return (
            <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.ignoreSwipeButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        handleIgnore(candidateId);
                    }}
                >
                    <Text style={styles.swipeIcon}>❌</Text>
                    <Text style={styles.swipeText}>Ignore</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Render swipe actions for upcoming tasks - complete (right swipe)
    const renderUpcomingRightActions = (taskId: string, progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
        });

        return (
            <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.completeSwipeButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        handleCompleteTask(taskId);
                    }}
                >
                    <Text style={styles.swipeIcon}>✅</Text>
                    <Text style={styles.swipeText}>Complete</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Render swipe actions for upcoming tasks - delete (left swipe)
    const renderUpcomingLeftActions = (taskId: string, progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0],
        });

        return (
            <Animated.View style={[styles.swipeAction, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.deleteSwipeButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        handleDeleteTask(taskId);
                    }}
                >
                    <Text style={styles.swipeIcon}>🗑️</Text>
                    <Text style={styles.swipeText}>Delete</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Feed</Text>
                    <Text style={styles.subtitle}>Review & Confirm</Text>
                </View>
                {/* Test Mode Toggle */}
                <TouchableOpacity
                    style={[styles.testModeButton, testMode && styles.testModeButtonActive]}
                    onPress={() => {
                        setTestMode(!testMode);
                        // Refresh data after toggling
                        setTimeout(fetchFeedData, 100);
                    }}
                >
                    <Text style={[styles.testModeText, testMode && styles.testModeTextActive]}>
                        {testMode ? '✅ Test Mode' : '🧪 Test Mode'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#1A1A1A"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Stats Card */}
                <View style={styles.statsContainer}>
                    <LinearGradient
                        colors={['#1A1A1A', '#2D2D2D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCard}
                    >
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.confirmedCount}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.pendingCount}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, stats.urgentCount > 0 && styles.statUrgent]}>
                                {stats.urgentCount}
                            </Text>
                            <Text style={styles.statLabel}>Urgent</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Social Pulse Section */}
                <SocialPulse />

                {/* New to Confirm Section */}
                {candidates.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>To Confirm</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {candidates.filter(c => {
                                        if (activeFilter === 'all') return true;
                                        if (activeFilter === 'high-confidence') return (c.confidence || 0) >= 0.8;
                                        if (activeFilter === 'low-confidence') return (c.confidence || 0) < 0.5;
                                        if (activeFilter === 'urgent') {
                                            const dueDate = c.due_date ? new Date(c.due_date) : null;
                                            if (!dueDate) return false;
                                            const hoursUntilDue = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                            return hoursUntilDue <= 24;
                                        }
                                        if (activeFilter === 'this-week') {
                                            const dueDate = c.due_date ? new Date(c.due_date) : null;
                                            if (!dueDate) return false;
                                            const hoursUntilDue = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                            return hoursUntilDue <= 168; // 7 days
                                        }
                                        return true;
                                    }).length}
                                </Text>
                            </View>
                        </View>

                        {/* Filter Pills */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterContainer}
                            contentContainerStyle={styles.filterContent}
                        >
                            <TouchableOpacity
                                style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
                                onPress={() => setActiveFilter('all')}
                            >
                                <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterPill, activeFilter === 'high-confidence' && styles.filterPillActive]}
                                onPress={() => setActiveFilter('high-confidence')}
                            >
                                <Text style={[styles.filterPillText, activeFilter === 'high-confidence' && styles.filterPillTextActive]}>
                                    🎯 High Confidence
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterPill, activeFilter === 'low-confidence' && styles.filterPillActive]}
                                onPress={() => setActiveFilter('low-confidence')}
                            >
                                <Text style={[styles.filterPillText, activeFilter === 'low-confidence' && styles.filterPillTextActive]}>
                                    ⚠️ Needs Review
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterPill, activeFilter === 'urgent' && styles.filterPillActive]}
                                onPress={() => setActiveFilter('urgent')}
                            >
                                <Text style={[styles.filterPillText, activeFilter === 'urgent' && styles.filterPillTextActive]}>
                                    🔴 Urgent (24h)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterPill, activeFilter === 'this-week' && styles.filterPillActive]}
                                onPress={() => setActiveFilter('this-week')}
                            >
                                <Text style={[styles.filterPillText, activeFilter === 'this-week' && styles.filterPillTextActive]}>
                                    📅 This Week
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {candidates.filter(candidate => {
                            // Apply active filter
                            if (activeFilter === 'all') return true;
                            if (activeFilter === 'high-confidence') return (candidate.confidence || 0) >= 0.8;
                            if (activeFilter === 'low-confidence') return (candidate.confidence || 0) < 0.5;
                            if (activeFilter === 'urgent') {
                                const dueDate = candidate.due_date ? new Date(candidate.due_date) : null;
                                if (!dueDate) return false;
                                const hoursUntilDue = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                return hoursUntilDue <= 24;
                            }
                            if (activeFilter === 'this-week') {
                                const dueDate = candidate.due_date ? new Date(candidate.due_date) : null;
                                if (!dueDate) return false;
                                const hoursUntilDue = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                return hoursUntilDue <= 168; // 7 days
                            }
                            return true;
                        }).sort((a, b) => {
                            // Smart Sorting Logic
                            const now = new Date().getTime();

                            // 1. Urgency Score (Critical < 24h, High < 3d)
                            const getUrgencyScore = (c: any) => {
                                if (!c.due_date) return 0;
                                const diff = new Date(c.due_date).getTime() - now;
                                if (diff < 24 * 60 * 60 * 1000) return 2; // Critical
                                if (diff < 72 * 60 * 60 * 1000) return 1; // High
                                return 0;
                            };

                            const urgencyA = getUrgencyScore(a);
                            const urgencyB = getUrgencyScore(b);
                            if (urgencyA !== urgencyB) return urgencyB - urgencyA;

                            // 2. Confidence Score (Higher is better)
                            const confA = a.confidence || 0;
                            const confB = b.confidence || 0;
                            if (Math.abs(confA - confB) > 0.1) return confB - confA; // Only sort if difference is significant (>10%)

                            // 3. Due Date (Sooner is better)
                            const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                            const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                            return dateA - dateB;
                        }).map((candidate) => {
                            const confidence = candidate.confidence || 0;
                            const confidenceColor = confidence >= 0.8 ? '#10B981' : confidence >= 0.5 ? '#F59E0B' : '#EF4444';

                            return (
                                <Swipeable
                                    key={candidate.id}
                                    renderRightActions={(progress) => renderRightActions(candidate.id, progress)}
                                    renderLeftActions={(progress) => renderLeftActions(candidate.id, progress)}
                                    overshootLeft={false}
                                    overshootRight={false}
                                >
                                    <View style={styles.candidateCard}>
                                        {/* Header with Confidence + Source */}
                                        <View style={styles.candidateHeader}>
                                            {/* Confidence Badge */}
                                            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
                                                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                                                <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                                                    {Math.round(confidence * 100)}% confident
                                                </Text>
                                            </View>

                                            {/* Source Badge */}
                                            {(() => {
                                                const sourceBadge = getSourceBadge(candidate.source);
                                                if (sourceBadge) {
                                                    return (
                                                        <View style={[styles.sourceBadge, { borderColor: sourceBadge.color }]}>
                                                            <Text style={styles.sourceIcon}>{sourceBadge.icon}</Text>
                                                            <Text style={[styles.sourceText, { color: sourceBadge.color }]}>
                                                                {sourceBadge.label}
                                                            </Text>
                                                        </View>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </View>

                                        {/* Content */}
                                        <Text style={styles.candidateTitle}>{candidate.title}</Text>

                                        <View style={styles.candidateMeta}>
                                            {candidate.module && (
                                                <View style={styles.metaItem}>
                                                    <Text style={styles.metaLabel}>Module</Text>
                                                    <Text style={styles.metaValue}>{candidate.module}</Text>
                                                </View>
                                            )}
                                            {candidate.type && (
                                                <View style={styles.metaItem}>
                                                    <Text style={styles.metaLabel}>Type</Text>
                                                    <Text style={styles.metaValue}>{candidate.type}</Text>
                                                </View>
                                            )}
                                            {candidate.due_date && (
                                                <View style={styles.metaItem}>
                                                    <Text style={styles.metaLabel}>Due</Text>
                                                    <Text style={styles.metaValue}>
                                                        {new Date(candidate.due_date).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Actions */}
                                        <View style={styles.actions}>
                                            <TouchableOpacity
                                                style={styles.actionButtonSecondary}
                                                onPress={() => handleIgnore(candidate.id)}
                                            >
                                                <Text style={styles.actionButtonSecondaryText}>Ignore</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButtonSecondary}
                                                onPress={() => handleEdit(candidate.id)}
                                            >
                                                <Text style={styles.actionButtonSecondaryText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButtonPrimary}
                                                onPress={() => handleConfirm(candidate.id)}
                                            >
                                                <Text style={styles.actionButtonPrimaryText}>Confirm</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Swipeable>
                            );
                        })}
                    </View>
                )}

                {/* Upcoming Section */}
                {tasks.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Upcoming</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{tasks.length}</Text>
                            </View>
                        </View>

                        {tasks.map((task) => (
                            <Swipeable
                                key={task.id}
                                renderRightActions={(progress) => renderUpcomingRightActions(task.id, progress)}
                                renderLeftActions={(progress) => renderUpcomingLeftActions(task.id, progress)}
                                overshootLeft={false}
                                overshootRight={false}
                            >
                                <View style={styles.upcomingCard}>
                                    <Text style={styles.upcomingTitle}>{task.title}</Text>
                                    <View style={styles.upcomingMeta}>
                                        {task.module && (
                                            <Text style={styles.upcomingMetaText}>📚 {task.module}</Text>
                                        )}
                                        {task.due_date && (
                                            <Text style={styles.upcomingMetaText}>
                                                📅 {new Date(task.due_date).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Swipeable>
                        ))}
                    </View>
                )}

                {/* Empty state */}
                {candidates.length === 0 && tasks.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>✨</Text>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptyText}>
                            No new tasks to review. Connect your email or calendar to get AI-extracted tasks here.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Edit Modal */}
            <EditCandidateModal
                visible={showEditModal}
                candidate={selectedCandidate}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedCandidate(null);
                }}
                onSave={handleSaveEdit}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B6B6B',
    },
    errorEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    testModeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    testModeButtonActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    testModeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
    },
    testModeTextActive: {
        color: '#2E7D32',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    statsContainer: {
        marginBottom: 24,
    },
    statsCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statUrgent: {
        color: '#EF4444',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterContent: {
        paddingRight: 20,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#F5F5F7',
    },
    filterPillActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    badge: {
        backgroundColor: '#F5F5F7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    candidateCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F5F5F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    candidateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
        gap: 6,
    },
    confidenceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        gap: 4,
    },
    sourceIcon: {
        fontSize: 14,
    },
    sourceText: {
        fontSize: 11,
        fontWeight: '600',
    },
    candidateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        lineHeight: 24,
    },
    candidateMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9BA0A8',
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    actionButtonSecondary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    actionButtonSecondaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    actionButtonPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    actionButtonPrimaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    upcomingCard: {
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    upcomingMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    upcomingMetaText: {
        fontSize: 14,
        color: '#6B6B6B',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B6B6B',
        textAlign: 'center',
        lineHeight: 24,
    },
    swipeAction: {
        justifyContent: 'center',
        marginBottom: 16,
    },
    swipeButton: {
        width: 100,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    confirmSwipeButton: {
        backgroundColor: '#10B981',
    },
    ignoreSwipeButton: {
        backgroundColor: '#EF4444',
    },
    completeSwipeButton: {
        backgroundColor: '#10B981',
    },
    deleteSwipeButton: {
        backgroundColor: '#6B6B6B',
    },
    swipeIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    swipeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
