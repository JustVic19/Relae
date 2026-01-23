import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

interface EditGoalModalProps {
    visible: boolean;
    currentGoal: number;
    onClose: () => void;
    onSave: (newGoal: number) => void;
    isSaving?: boolean;
}

export default function EditGoalModal({ visible, currentGoal, onClose, onSave, isSaving }: EditGoalModalProps) {
    const [goalInput, setGoalInput] = useState(currentGoal.toString());
    const [error, setError] = useState('');

    const handleSave = () => {
        const newGoal = parseInt(goalInput, 10);

        // Validation
        if (isNaN(newGoal)) {
            setError('Please enter a valid number');
            return;
        }
        if (newGoal < 1) {
            setError('Goal must be at least 1');
            return;
        }
        if (newGoal > 100) {
            setError('Goal cannot exceed 100');
            return;
        }

        setError('');
        onSave(newGoal);
    };

    const handleClose = () => {
        setError('');
        setGoalInput(currentGoal.toString());
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>🎯 Edit Weekly Goal</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        Set your weekly task completion target
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Tasks per week</Text>
                        <TextInput
                            style={[styles.input, error ? styles.inputError : null]}
                            value={goalInput}
                            onChangeText={(text) => {
                                setGoalInput(text);
                                setError('');
                            }}
                            keyboardType="number-pad"
                            placeholder="10"
                            placeholderTextColor="#9BA0A8"
                            maxLength={3}
                            autoFocus
                        />
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </View>

                    <View style={styles.suggestionContainer}>
                        <Text style={styles.suggestionLabel}>Quick select:</Text>
                        <View style={styles.suggestionButtons}>
                            {[5, 10, 15, 20].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.suggestionButton,
                                        goalInput === num.toString() && styles.suggestionButtonActive
                                    ]}
                                    onPress={() => {
                                        setGoalInput(num.toString());
                                        setError('');
                                    }}
                                >
                                    <Text style={[
                                        styles.suggestionButtonText,
                                        goalInput === num.toString() && styles.suggestionButtonTextActive
                                    ]}>
                                        {num}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleClose}
                            disabled={isSaving}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSaving ? 'Saving...' : 'Save Goal'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeButton: {
        fontSize: 24,
        color: '#9BA0A8',
        padding: 4,
    },
    description: {
        fontSize: 14,
        color: '#6B6B6B',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    suggestionContainer: {
        marginBottom: 24,
    },
    suggestionLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        marginBottom: 8,
        fontWeight: '500',
    },
    suggestionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    suggestionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    suggestionButtonActive: {
        backgroundColor: '#6C63FF',
    },
    suggestionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    suggestionButtonTextActive: {
        color: '#FFFFFF',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F7',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    saveButton: {
        backgroundColor: '#6C63FF',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
