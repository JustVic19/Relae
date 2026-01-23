import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useGroupMutations } from '../hooks/useGroups';

interface CreateGroupTaskModalProps {
    visible: boolean;
    onClose: () => void;
    groupId: string;
    members: any[];
}

export default function CreateGroupTaskModal({ visible, onClose, groupId, members }: CreateGroupTaskModalProps) {
    const { createGroupTask } = useGroupMutations();
    const [title, setTitle] = useState('');
    const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
    // Simple date handling for MVP - could use a date picker later
    const [dueDate, setDueDate] = useState<string>('');

    const handleCreate = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        createGroupTask.mutate(
            {
                groupId,
                task: {
                    title,
                    assigned_to: assignedTo,
                    // Basic due date validation or formatting could go here
                }
            },
            {
                onSuccess: () => {
                    setTitle('');
                    setAssignedTo(undefined);
                    setDueDate('');
                    onClose();
                },
                onError: (error: any) => {
                    Alert.alert('Error', error.message || 'Failed to create task');
                },
            }
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>New Shared Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Task Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="What needs to be done?"
                                placeholderTextColor="#9BA0A8"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Assign To (Optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assignmentScroll}>
                                <TouchableOpacity
                                    style={[
                                        styles.assigneeChip,
                                        !assignedTo && styles.assigneeChipActive
                                    ]}
                                    onPress={() => setAssignedTo(undefined)}
                                >
                                    <Text style={[
                                        styles.assigneeText,
                                        !assignedTo && styles.assigneeTextActive
                                    ]}>
                                        Anyone
                                    </Text>
                                </TouchableOpacity>
                                {members.map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[
                                            styles.assigneeChip,
                                            assignedTo === member.id && styles.assigneeChipActive
                                        ]}
                                        onPress={() => setAssignedTo(member.id)}
                                    >
                                        <Text style={[
                                            styles.assigneeText,
                                            assignedTo === member.id && styles.assigneeTextActive
                                        ]}>
                                            {member.display_name?.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreate}
                            disabled={createGroupTask.isPending}
                        >
                            {createGroupTask.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>Add Task</Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '60%',
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeText: {
        fontSize: 24,
        color: '#6B6B6B',
        fontWeight: '300',
    },
    content: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
    },
    assignmentScroll: {
        flexDirection: 'row',
    },
    assigneeChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    assigneeChipActive: {
        backgroundColor: '#ECEBFF',
        borderColor: '#6C63FF',
    },
    assigneeText: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    assigneeTextActive: {
        color: '#6C63FF',
        fontWeight: '700',
    },
    footer: {
        marginTop: 16,
    },
    createButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
