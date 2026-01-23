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
} from 'react-native';
import { useGroupMutations } from '../hooks/useGroups';

interface JoinGroupModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function JoinGroupModal({ visible, onClose }: JoinGroupModalProps) {
    const { joinGroup } = useGroupMutations();
    const [code, setCode] = useState('');

    const handleJoin = () => {
        if (code.length < 6) {
            Alert.alert('Error', 'Code must be 6 characters');
            return;
        }

        joinGroup.mutate(code.toUpperCase(), {
            onSuccess: () => {
                setCode('');
                onClose();
            },
            onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to join group');
            },
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Join Project</Text>
                    <Text style={styles.subtitle}>Enter the 6-character code shared by your friend</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Join Code</Text>
                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={(text) => setCode(text.toUpperCase())}
                            placeholder="e.g. A1B2C3"
                            placeholderTextColor="#9BA0A8"
                            maxLength={6}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={handleJoin}
                            disabled={joinGroup.isPending}
                        >
                            {joinGroup.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.joinButtonText}>Join Group</Text>
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
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B6B6B',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        color: '#1A1A1A',
        textAlign: 'center',
        fontFamily: 'Courier',
        letterSpacing: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    joinButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
    },
    joinButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
