import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskComments, useCreateComment } from '../hooks/useTaskComments';
import { useProfile } from '../hooks/useProfile';

interface TaskCommentsModalProps {
    visible: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
}

export default function TaskCommentsModal({ visible, onClose, taskId, taskTitle }: TaskCommentsModalProps) {
    const insets = useSafeAreaInsets();
    const { data: comments, isLoading } = useTaskComments(taskId);
    const createComment = useCreateComment();
    const { profile: userProfile } = useProfile();
    const [content, setContent] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // Scroll to bottom when new comments arrive
    useEffect(() => {
        if (comments && comments.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [comments]);

    const handleSend = () => {
        if (!content.trim()) return;

        createComment.mutate(
            { taskId, content },
            {
                onSuccess: () => {
                    setContent('');
                },
            }
        );
    };

    const renderComment = ({ item }: { item: any }) => {
        const isMyComment = item.user_id === userProfile?.id;

        return (
            <View style={[
                styles.commentRow,
                isMyComment ? styles.myCommentRow : styles.otherCommentRow
            ]}>
                {!isMyComment && (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.user.display_name?.charAt(0) || '?'}
                        </Text>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isMyComment ? styles.myBubble : styles.otherBubble
                ]}>
                    {!isMyComment && (
                        <Text style={styles.senderName}>{item.user.display_name}</Text>
                    )}
                    <Text style={[
                        styles.commentText,
                        isMyComment ? styles.myCommentText : styles.otherCommentText
                    ]}>{item.content}</Text>
                    <Text style={[
                        styles.timeText,
                        isMyComment ? styles.myTimeText : styles.otherTimeText
                    ]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={[styles.header, { paddingTop: 20 }]}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{taskTitle}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        style={styles.list}
                    />
                )}

                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write a comment..."
                        placeholderTextColor="#9BA0A8"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!content.trim()}
                    >
                        <Text style={styles.sendIcon}>↑</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEC',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 16,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6C63FF',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    commentRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    myCommentRow: {
        justifyContent: 'flex-end',
    },
    otherCommentRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6C63FF',
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: '#6C63FF',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6C63FF',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myCommentText: {
        color: '#FFFFFF',
    },
    otherCommentText: {
        color: '#1A1A1A',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherTimeText: {
        color: '#9BA0A8',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#EAEAEC',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 100,
        fontSize: 16,
        color: '#1A1A1A',
        marginRight: 12,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#EAEAEC',
    },
    sendIcon: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: '800',
    },
});
