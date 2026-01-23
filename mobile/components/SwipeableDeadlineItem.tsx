import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Task } from '../services/homescreenService';

interface SwipeableDeadlineItemProps {
    task: Task;
    urgencyColor: string;
    countdownText: string;
    isVeryUrgent: boolean;
    hoursUntilDue: number;
    onPress: () => void;
    onComplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
}

export default function SwipeableDeadlineItem({
    task,
    urgencyColor,
    countdownText,
    isVeryUrgent,
    hoursUntilDue,
    onPress,
    onComplete,
    onDelete,
}: SwipeableDeadlineItemProps) {
    const swipeableRef = useRef<Swipeable>(null);

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
        });

        return (
            <Animated.View style={[styles.actionContainer, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        swipeableRef.current?.close();
                        onComplete(task.id);
                    }}
                >
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionText}>Complete</Text>
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
            <Animated.View style={[styles.actionContainer, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        swipeableRef.current?.close();
                        onDelete(task.id);
                    }}
                >
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            overshootRight={false}
            overshootLeft={false}
            friction={2}
        >
            <TouchableOpacity
                style={[
                    styles.deadlineItem,
                    isVeryUrgent && styles.deadlineItemPulsing,
                ]}
                onPress={onPress}
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
}

const styles = StyleSheet.create({
    deadlineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    deadlineItemPulsing: {
        backgroundColor: '#FFF5F5',
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
    deadlineDateUrgent: {
        color: '#EF4444',
        fontWeight: '700',
    },
    actionContainer: {
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionButton: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    completeButton: {
        backgroundColor: '#10B981',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});
