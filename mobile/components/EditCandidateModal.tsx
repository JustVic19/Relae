import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EditCandidateModalProps {
    visible: boolean;
    candidate: {
        id: string;
        title: string;
        module?: string;
        type?: string;
        due_date?: string;
    } | null;
    onClose: () => void;
    onSave: (candidateId: string, updates: {
        title: string;
        module: string;
        type: string;
        due_date: string;
    }) => void;
}

export default function EditCandidateModal({ visible, candidate, onClose, onSave }: EditCandidateModalProps) {
    const [title, setTitle] = useState('');
    const [module, setModule] = useState('');
    const [type, setType] = useState('assignment');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Reset form when candidate changes
    useEffect(() => {
        if (candidate) {
            setTitle(candidate.title || '');
            setModule(candidate.module || '');
            setType(candidate.type || 'assignment');
            setDueDate(candidate.due_date ? new Date(candidate.due_date) : new Date());
        }
    }, [candidate]);

    const handleSave = () => {
        if (!candidate) return;

        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        onSave(candidate.id, {
            title: title.trim(),
            module: module.trim(),
            type,
            due_date: dueDate.toISOString(),
        });
        onClose();
    };

    const taskTypes = [
        { value: 'assignment', label: 'Assignment' },
        { value: 'exam', label: 'Exam' },
        { value: 'project', label: 'Project' },
        { value: 'reading', label: 'Reading' },
        { value: 'other', label: 'Other' },
    ];

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit Task</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter task title"
                                placeholderTextColor="#9BA0A8"
                            />
                        </View>

                        {/* Module */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Module/Class (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={module}
                                onChangeText={setModule}
                                placeholder="e.g., CS101, Biology"
                                placeholderTextColor="#9BA0A8"
                            />
                        </View>

                        {/* Type */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeContainer}>
                                {taskTypes.map((taskType) => (
                                    <TouchableOpacity
                                        key={taskType.value}
                                        style={[
                                            styles.typeButton,
                                            type === taskType.value && styles.typeButtonActive,
                                        ]}
                                        onPress={() => setType(taskType.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.typeButtonText,
                                                type === taskType.value && styles.typeButtonTextActive,
                                            ]}
                                        >
                                            {taskType.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Due Date */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Due Date & Time</Text>
                            <View style={styles.dateTimeRow}>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateTimeIcon}>📅</Text>
                                    <Text style={styles.dateTimeText}>{formatDate(dueDate)}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.dateTimeIcon}>🕐</Text>
                                    <Text style={styles.dateTimeText}>{formatTime(dueDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event: any, selectedDate: Date | undefined) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (selectedDate) setDueDate(selectedDate);
                            }}
                        />
                    )}

                    {/* Time Picker */}
                    {showTimePicker && (
                        <DateTimePicker
                            value={dueDate}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event: any, selectedDate: Date | undefined) => {
                                setShowTimePicker(Platform.OS === 'ios');
                                if (selectedDate) setDueDate(selectedDate);
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 18,
        color: '#6B6B6B',
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#F5F5F7',
    },
    typeButtonActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    typeButtonTextActive: {
        color: '#FFFFFF',
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    dateTimeIcon: {
        fontSize: 20,
    },
    dateTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F7',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
