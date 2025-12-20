import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TaskCard } from '../components/TaskCard';
import { mockTasks, TaskCandidate } from '../data/mockData';
import { typography, spacing, borders } from '../theme/tokens';

export default function FeedScreen() {
    const { colors, colorScheme, toggleTheme } = useTheme();
    const [tasks, setTasks] = useState(mockTasks);

    const newTasks = tasks.filter((t) => t.status === 'new');
    const confirmedTasks = tasks.filter((t) => t.status === 'confirmed');

    const handleConfirm = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: 'confirmed' as const } : t))
        );
    };

    const handleEdit = (taskId: string) => {
        // Navigate to edit screen (will implement with navigation)
        console.log('Edit task:', taskId);
    };

    const handleIgnore = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: 'ignored' as const } : t))
        );
    };

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
                {newTasks.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border.default }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                NEW TO CONFIRM
                            </Text>
                        </View>

                        {newTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onConfirm={() => handleConfirm(task.id)}
                                onEdit={() => handleEdit(task.id)}
                                onIgnore={() => handleIgnore(task.id)}
                            />
                        ))}
                    </>
                )}

                {/* Upcoming Section */}
                {confirmedTasks.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { borderBottomColor: colors.border.default }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                UPCOMING
                            </Text>
                        </View>

                        {confirmedTasks.map((task) => (
                            <View
                                key={task.id}
                                style={[styles.upcomingItem, { borderBottomColor: colors.border.subtle }]}
                            >
                                <Text style={[styles.upcomingTitle, { color: colors.text.primary }]}>
                                    {task.title}
                                </Text>
                                <Text style={[styles.upcomingMeta, { color: colors.text.secondary }]}>
                                    {task.module} • {task.dueDate} {task.dueTime}
                                </Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});
