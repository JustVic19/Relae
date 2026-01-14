import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { TaskType } from '../services/homescreenService';

interface QuickAddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (title: string, type: TaskType, dueDate?: string, module?: string) => void;
}

const TASK_TYPES: { value: TaskType; label: string; emoji: string; color: string }[] = [
    { value: 'DEADLINE', label: 'Deadline', emoji: '📌', color: '#EF4444' },
    { value: 'READING', label: 'Reading', emoji: '📚', color: '#3B82F6' },
    { value: 'ADMIN', label: 'Admin', emoji: '📋', color: '#8B5CF6' },
    { value: 'EVENT', label: 'Event', emoji: '📅', color: '#10B981' },
    { value: 'CHANGE', label: 'Change', emoji: '🔄', color: '#F59E0B' },
];

export default function QuickAddTaskModal({ visible, onClose, onSubmit }: QuickAddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [selectedType, setSelectedType] = useState<TaskType>('DEADLINE');
    const [module, setModule] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSubmit(
            title.trim(),
            selectedType,
            dueDate || undefined,
            module || undefined
        );

        // Reset form
        setTitle('');
        setSelectedType('DEADLINE');
        setModule('');
        setDueDate('');
        onClose();
    };

    const handleClose = () => {
        // Reset form on close
        setTitle('');
        setSelectedType('DEADLINE');
        setModule('');
        setDueDate('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Quick Add Task</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Task Type Selection */}
                        <Text style={styles.label}>Task Type</Text>
                        <View style={styles.typeGrid}>
                            {TASK_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeCard,
                                        selectedType === type.value && {
                                            backgroundColor: type.color + '20',
                                            borderColor: type.color,
                                        },
                                    ]}
                                    onPress={() => setSelectedType(type.value)}
                                >
                                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                                    <Text
                                        style={[
                                            styles.typeLabel,
                                            selectedType === type.value && { color: type.color, fontWeight: '600' },
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Title Input */}
                        <Text style={styles.label}>Task Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What needs to be done?"
                            placeholderTextColor="#9BA0A8"
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                            returnKeyType="next"
                        />

                        {/* Module Input */}
                        <Text style={styles.label}>Module/Course (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., CS101, Biology"
                            placeholderTextColor="#9BA0A8"
                            value={module}
                            onChangeText={setModule}
                            returnKeyType="next"
                        />

                        {/* Due Date Input */}
                        <Text style={styles.label}>Due Date (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD or use date picker"
                            placeholderTextColor="#9BA0A8"
                            value={dueDate}
                            onChangeText={setDueDate}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!title.trim()}
                        >
                            <Text style={styles.submitButtonText}>Add Task</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
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
        maxHeight: '85%',
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
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    placeholder: {
        width: 32,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
        marginTop: 16,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    typeCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    submitButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#E8E8E8',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
