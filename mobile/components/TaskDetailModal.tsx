import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { Task, TaskType } from '../services/homescreenService';

interface TaskDetailModalProps {
    visible: boolean;
    task: Task | null;
    onClose: () => void;
    onComplete: (taskId: string) => void;
    onUncomplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const TASK_TYPES: { value: TaskType; label: string; emoji: string; color: string }[] = [
    { value: 'DEADLINE', label: 'Deadline', emoji: '📌', color: '#EF4444' },
    { value: 'READING', label: 'Reading', emoji: '📚', color: '#3B82F6' },
    { value: 'ADMIN', label: 'Admin', emoji: '📋', color: '#8B5CF6' },
    { value: 'EVENT', label: 'Event', emoji: '📅', color: '#10B981' },
    { value: 'CHANGE', label: 'Change', emoji: '🔄', color: '#F59E0B' },
];

export default function TaskDetailModal({
    visible,
    task,
    onClose,
    onComplete,
    onUncomplete,
    onDelete,
    onUpdate,
}: TaskDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedModule, setEditedModule] = useState('');
    const [editedNotes, setEditedNotes] = useState('');
    const [editedDueDate, setEditedDueDate] = useState('');
    const [editedType, setEditedType] = useState<TaskType>('DEADLINE');
    const [newLink, setNewLink] = useState('');

    React.useEffect(() => {
        if (task) {
            setEditedTitle(task.title);
            setEditedModule(task.module || '');
            setEditedNotes(task.notes || '');
            setEditedDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
            setEditedType(task.type);
        }
    }, [task]);

    if (!task) return null;

    const taskTypeInfo = TASK_TYPES.find(t => t.value === task.type) || TASK_TYPES[0];
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const isPending = task.status === 'pending';
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const createdDate = new Date(task.created_at);

    const handleSave = () => {
        onUpdate(task.id, {
            title: editedTitle,
            module: editedModule || undefined,
            notes: editedNotes || undefined,
            due_date: editedDueDate || undefined,
            type: editedType,
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDelete(task.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleSnooze = (days: number) => {
        if (dueDate) {
            const newDate = new Date(dueDate);
            newDate.setDate(newDate.getDate() + days);
            onUpdate(task.id, { due_date: newDate.toISOString() });
        }
    };

    const handleAddLink = () => {
        if (newLink.trim()) {
            const currentLinks = task.links || [];
            onUpdate(task.id, { links: [...currentLinks, newLink.trim()] });
            setNewLink('');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Task Details</Text>
                        <TouchableOpacity
                            onPress={() => setIsEditing(!isEditing)}
                            style={styles.editButton}
                        >
                            <Text style={styles.editIcon}>{isEditing ? '✓' : '✏️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Task Type Badge */}
                        <View style={[styles.typeBadge, { backgroundColor: taskTypeInfo.color + '20' }]}>
                            <Text style={styles.typeEmoji}>{taskTypeInfo.emoji}</Text>
                            <Text style={[styles.typeLabel, { color: taskTypeInfo.color }]}>
                                {taskTypeInfo.label}
                            </Text>
                        </View>

                        {/* Title */}
                        {isEditing ? (
                            <TextInput
                                style={styles.titleInput}
                                value={editedTitle}
                                onChangeText={setEditedTitle}
                                placeholder="Task title"
                                multiline
                            />
                        ) : (
                            <Text style={styles.title}>{task.title}</Text>
                        )}

                        {/* Module */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Module</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={editedModule}
                                    onChangeText={setEditedModule}
                                    placeholder="Module/Course"
                                />
                            ) : (
                                <Text style={styles.infoValue}>{task.module || 'No module'}</Text>
                            )}
                        </View>

                        {/* Due Date */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Due Date</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={editedDueDate}
                                    onChangeText={setEditedDueDate}
                                    placeholder="YYYY-MM-DD"
                                />
                            ) : (
                                <Text style={styles.infoValue}>
                                    {dueDate ? dueDate.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : 'No due date'}
                                </Text>
                            )}
                        </View>

                        {/* Change Type (when editing) */}
                        {isEditing && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Task Type</Text>
                                <View style={styles.typeGrid}>
                                    {TASK_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            style={[
                                                styles.typeOption,
                                                editedType === type.value && {
                                                    backgroundColor: type.color + '20',
                                                    borderColor: type.color,
                                                },
                                            ]}
                                            onPress={() => setEditedType(type.value)}
                                        >
                                            <Text style={styles.typeOptionEmoji}>{type.emoji}</Text>
                                            <Text style={styles.typeOptionLabel}>{type.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Status */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={[
                                styles.statusBadge,
                                isCompleted && styles.statusBadgeCompleted,
                                isInProgress && styles.statusBadgeInProgress
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    isCompleted && styles.statusTextCompleted,
                                    isInProgress && styles.statusTextInProgress
                                ]}>
                                    {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                                </Text>
                            </View>
                        </View>

                        {/* Created Date */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Created</Text>
                            <Text style={styles.infoValue}>
                                {createdDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>

                        {/* Notes */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.notesInput}
                                    value={editedNotes}
                                    onChangeText={setEditedNotes}
                                    placeholder="Add notes..."
                                    multiline
                                    numberOfLines={4}
                                />
                            ) : (
                                <Text style={styles.notesText}>
                                    {task.notes || 'No notes added'}
                                </Text>
                            )}
                        </View>

                        {/* Attachments */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Attachments</Text>
                            {task.links && task.links.length > 0 ? (
                                task.links.map((link, index) => (
                                    <View key={index} style={styles.linkItem}>
                                        <Text style={styles.linkIcon}>🔗</Text>
                                        <Text style={styles.linkText} numberOfLines={1}>
                                            {link}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No attachments</Text>
                            )}
                            <View style={styles.addLinkContainer}>
                                <TextInput
                                    style={styles.linkInput}
                                    value={newLink}
                                    onChangeText={setNewLink}
                                    placeholder="Paste link..."
                                    placeholderTextColor="#9BA0A8"
                                />
                                <TouchableOpacity
                                    style={styles.addLinkButton}
                                    onPress={handleAddLink}
                                    disabled={!newLink.trim()}
                                >
                                    <Text style={styles.addLinkButtonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionsSection}>
                            {/* Primary Actions */}
                            {isPending && (
                                <TouchableOpacity
                                    style={styles.inProgressButton}
                                    onPress={() => onUpdate(task.id, { status: 'in_progress' })}
                                >
                                    <Text style={styles.inProgressButtonText}>
                                        🔄 In Review
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {isInProgress && (
                                <TouchableOpacity
                                    style={styles.pendingButton}
                                    onPress={() => onUpdate(task.id, { status: 'pending' })}
                                >
                                    <Text style={styles.pendingButtonText}>
                                        ⬅️ Move to Pending
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.primaryButton, isCompleted && styles.uncompleteButton]}
                                onPress={() => isCompleted ? onUncomplete(task.id) : onComplete(task.id)}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {isCompleted ? '↩️ Mark Incomplete' : '✓ Mark Complete'}
                                </Text>
                            </TouchableOpacity>

                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.primaryButtonText}>💾 Save Changes</Text>
                                </TouchableOpacity>
                            )}

                            {/* Snooze Options */}
                            {!isCompleted && (
                                <View style={styles.snoozeContainer}>
                                    <Text style={styles.sectionTitle}>Snooze</Text>
                                    <View style={styles.snoozeButtons}>
                                        <TouchableOpacity
                                            style={styles.snoozeButton}
                                            onPress={() => handleSnooze(1)}
                                        >
                                            <Text style={styles.snoozeButtonText}>Tomorrow</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.snoozeButton}
                                            onPress={() => handleSnooze(7)}
                                        >
                                            <Text style={styles.snoozeButtonText}>Next Week</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Delete Button */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                            >
                                <Text style={styles.deleteButtonText}>🗑️ Delete Task</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 28,
        color: '#1A1A1A',
        fontWeight: '300',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        fontSize: 16,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        gap: 8,
    },
    typeEmoji: {
        fontSize: 18,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 20,
        lineHeight: 32,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#F5F5F7',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    infoInput: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '600',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F5F5F7',
        minWidth: 150,
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeCompleted: {
        backgroundColor: '#D1FAE5',
    },
    statusBadgeInProgress: {
        backgroundColor: '#DBEAFE',
    },
    statusText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
    },
    statusTextCompleted: {
        color: '#10B981',
    },
    statusTextInProgress: {
        color: '#3B82F6',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeOption: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeOptionEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    typeOptionLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    notesInput: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    notesText: {
        fontSize: 14,
        color: '#6B6B6B',
        lineHeight: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#9BA0A8',
        fontStyle: 'italic',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 8,
    },
    linkIcon: {
        fontSize: 16,
    },
    linkText: {
        flex: 1,
        fontSize: 14,
        color: '#3B82F6',
    },
    addLinkContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    linkInput: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    addLinkButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addLinkButtonText: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: '300',
    },
    actionsSection: {
        marginTop: 24,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    inProgressButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    pendingButton: {
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    uncompleteButton: {
        backgroundColor: '#6B6B6B',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    inProgressButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    pendingButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    snoozeContainer: {
        marginTop: 12,
    },
    snoozeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    snoozeButton: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    snoozeButtonText: {
        color: '#1A1A1A',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
});
