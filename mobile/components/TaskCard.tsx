import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TaskCandidate } from '../data/mockData';
import { typography, spacing, borders } from '../theme/tokens';

interface TaskCardProps {
    task: TaskCandidate;
    onConfirm: () => void;
    onEdit: () => void;
    onIgnore: () => void;
}

export function TaskCard({ task, onConfirm, onEdit, onIgnore }: TaskCardProps) {
    const { colors, colorScheme } = useTheme();

    const confidenceColor = colors.confidence[task.confidence.toLowerCase() as 'high' | 'medium' | 'low'];

    return (
        <View style={[styles.card, {
            backgroundColor: colors.surface.card,
            borderColor: colors.border.default,
        }]}>
            {/* Confidence Badge */}
            <View style={[styles.confidenceBadge, {
                backgroundColor: confidenceColor,
                borderColor: colors.border.default,
            }]}>
                <Text style={[styles.confidenceText, {
                    color: colorScheme === 'light' ? '#000' : '#000',
                }]}>
                    {task.confidence}
                </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
                {task.title}
            </Text>

            {/* Tags Row */}
            <View style={styles.tagsRow}>
                {task.module && (
                    <View style={[styles.tag, { borderColor: colors.border.default }]}>
                        <Text style={[styles.tagText, { color: colors.text.primary }]}>
                            {task.module}
                        </Text>
                    </View>
                )}
                <View style={[styles.tag, { borderColor: colors.border.default }]}>
                    <Text style={[styles.tagText, { color: colors.text.primary }]}>
                        {task.type}
                    </Text>
                </View>
            </View>

            {/* Due Date */}
            {task.dueDate && (
                <Text style={[styles.dueDate, { color: colors.text.primary }]}>
                    {task.dueDate}{task.dueTime ? `, ${task.dueTime}` : ''}
                </Text>
            )}

            {/* Source */}
            <Text style={[styles.source, { color: colors.text.muted }]}>
                From: {task.source.from} • {task.source.timestamp}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.confirmButton, {
                        backgroundColor: colors.accent.primary,
                        borderColor: colors.border.default,
                    }]}
                    onPress={onConfirm}
                >
                    <Text style={[styles.buttonText, {
                        color: colorScheme === 'light' ? '#FFF' : '#000',
                    }]}>
                        CONFIRM
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.editButton, {
                        backgroundColor: colors.surface.card,
                        borderColor: colors.border.default,
                    }]}
                    onPress={onEdit}
                >
                    <Text style={[styles.buttonText, { color: colors.text.primary }]}>
                        EDIT
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.ignoreButton, {
                        backgroundColor: colors.bg.secondary,
                        borderColor: colors.border.subtle,
                    }]}
                    onPress={onIgnore}
                >
                    <Text style={[styles.buttonText, { color: colors.text.secondary }]}>
                        IGNORE
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: borders.width.thick,
        borderRadius: borders.radius.sm,
        padding: spacing[4],
        marginBottom: spacing[3],
    },
    confidenceBadge: {
        position: 'absolute',
        top: spacing[3],
        right: spacing[3],
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderWidth: borders.width.default,
        borderRadius: borders.radius.sm,
    },
    confidenceText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing[3],
        paddingRight: spacing[12], // Space for confidence badge
    },
    tagsRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    tag: {
        borderWidth: borders.width.default,
        borderRadius: borders.radius.sm,
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
    },
    tagText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
    },
    dueDate: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing[2],
    },
    source: {
        fontSize: typography.fontSize.sm,
        marginBottom: spacing[4],
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    button: {
        flex: 1,
        paddingVertical: spacing[2],
        borderWidth: borders.width.default,
        borderRadius: borders.radius.sm,
        alignItems: 'center',
    },
    confirmButton: {},
    editButton: {},
    ignoreButton: {},
    buttonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
});
