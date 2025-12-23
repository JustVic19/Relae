import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TaskCard } from '../components/TaskCard';
import { typography, spacing, borders } from '../theme/tokens';
import { useAuth } from '../contexts/AuthContext';
import * as API from '../services/api';

export default function FeedScreen() {
    const { colors, colorScheme, toggleTheme } = useTheme();
    const { user } = useAuth();

    const [candidates, setCandidates] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch feed data on mount
    useEffect(() => {
        fetchFeedData();
    }, []);

    const fetchFeedData = async () => {
        try {
            setLoading(true);
            setError(null);

            const feedData = await API.getFeed();
            setCandidates(feedData.candidates.filter((c: any) => c.status === 'new'));
            setTasks(feedData.tasks.filter((t: any) => t.status === 'pending'));
        } catch (err: any) {
            console.error('Failed to fetch feed:', err);
            setError(err.message || 'Failed to load feed');

            // Show user-friendly error
            Alert.alert('Error', 'Could not load your tasks. Please check your connection.');
        } finally {
            setLoading(false);
        }
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
        // TODO: Navigate to edit screen
        console.log('Edit candidate:', candidateId);
        Alert.alert('Edit', 'Edit functionality coming soon!');
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

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg.primary }]}>
                <ActivityIndicator size="large" color={colors.text.primary} />
                <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                    Loading your tasks...
                </Text>
            </View>
        );
    }

    // Error state
    if (error && candidates.length === 0 && tasks.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg.primary }]}>
                <Text style={[styles.errorText, { color: colors.text.primary }]}>
                    {error}
                </Text>
                <TouchableOpacity
                    onPress={fetchFeedData}
                    style={[styles.retryButton, { borderColor: colors.border.default }]}
                >
                    <Text style={[styles.retryButtonText, { color: colors.text.primary }]}>
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
            <StatusBar
                barStyle={colorScheme === 'light' ? 'dark-content' : 'light-content'}
            />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
                <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                    FEED
                </Text>
                <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
                    <Text style={[styles.themeToggleText, { color: colors.text.primary }]}>
                        {colorScheme === 'light' ? '🌙' : '☀️'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* New to Confirm Section */}
                {candidates.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border.default }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                NEW TO CONFIRM ({candidates.length})
                            </Text>
                        </View>

                        {candidates.map((candidate) => (
                            <TaskCard
                                key={candidate.id}
                                task={{
                                    id: candidate.id,
                                    title: candidate.title,
                                    module: candidate.module || 'General',
                                    dueDate: candidate.due_date ? new Date(candidate.due_date).toLocaleDateString() : 'No date',
                                    dueTime: candidate.due_date ? new Date(candidate.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                                    type: candidate.type,
                                    confidence: candidate.confidence,
                                    status: 'new' as const,
                                    source: {
                                        from: 'System',
                                        timestamp: candidate.created_at || new Date().toISOString(),
                                    },
                                }}
                                onConfirm={() => handleConfirm(candidate.id)}
                                onEdit={() => handleEdit(candidate.id)}
                                onIgnore={() => handleIgnore(candidate.id)}
                            />
                        ))}
                    </>
                )}

                {/* Upcoming Section */}
                {tasks.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border.default }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                UPCOMING ({tasks.length})
                            </Text>
                        </View>

                        {tasks.map((task) => (
                            <View
                                key={task.id}
                                style={[styles.upcomingItem, { borderBottomColor: colors.border.subtle }]}
                            >
                                <Text style={[styles.upcomingTitle, { color: colors.text.primary }]}>
                                    {task.title}
                                </Text>
                                <Text style={[styles.upcomingMeta, { color: colors.text.secondary }]}>
                                    {task.module || 'General'} • {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                </Text>
                            </View>
                        ))}
                    </>
                )}

                {/* Empty state */}
                {candidates.length === 0 && tasks.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                            No tasks to show
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.text.muted }]}>
                            Your inbox is empty! 🎉
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing[4],
        fontSize: typography.fontSize.base,
    },
    errorText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        textAlign: 'center',
        paddingHorizontal: spacing[6],
    },
    retryButton: {
        marginTop: spacing[6],
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        borderWidth: borders.width.thick,
    },
    retryButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingTop: spacing[12],
        paddingBottom: spacing[4],
        borderBottomWidth: borders.width.thick,
    },
    headerTitle: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.black,
    },
    themeToggle: {
        padding: spacing[2],
    },
    themeToggleText: {
        fontSize: typography.fontSize.xl,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing[4],
    },
    sectionHeader: {
        borderBottomWidth: borders.width.thick,
        paddingBottom: spacing[2],
        marginBottom: spacing[4],
        marginTop: spacing[2],
    },
    sectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.black,
        letterSpacing: 1,
    },
    upcomingItem: {
        paddingVertical: spacing[3],
        borderBottomWidth: borders.width.thin,
    },
    upcomingTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing[1],
    },
    upcomingMeta: {
        fontSize: typography.fontSize.sm,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing[12],
    },
    emptyStateText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
    },
    emptyStateSubtext: {
        fontSize: typography.fontSize.sm,
        marginTop: spacing[2],
    },
});
