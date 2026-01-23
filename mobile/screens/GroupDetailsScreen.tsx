import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Keyboard,
    Platform,
    KeyboardAvoidingView,
    TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupDetails, useGroupMutations } from '../hooks/useGroups';
import { useGroupRealtime } from '../hooks/useGroupRealtime';
import { useGroupChat } from '../hooks/useGroupChat';
import { useAuth } from '../contexts/AuthContext';
import CreateTaskModal from '../components/CreateGroupTaskModal';
import TaskCommentsModal from '../components/TaskCommentsModal';

type Tab = 'tasks' | 'team' | 'chat';

export default function GroupDetailsScreen({ route, navigation }: any) {
    const { groupId, groupName } = route.params;
    const insets = useSafeAreaInsets();
    const { data: group, isLoading, refetch } = useGroupDetails(groupId);
    const { updateTaskStatus } = useGroupMutations();
    const { messages, sendMessage } = useGroupChat(groupId);
    const { user } = useAuth();

    // Enable real-time updates
    useGroupRealtime(groupId);

    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [messageText, setMessageText] = useState('');

    // Chat / Comments State
    const [showComments, setShowComments] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Manual Keyboard Handling
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, (e) => {
            // Adjust for safe area if needed, but usually raw height is safer to start
            // On iOS, we might need to subtract insets.bottom if we are already in SafeAreaView
            // But let's try raw height minus a small adjustment or just raw height first.
            // Actually, since we are in SafeAreaView, the bottom inset is already 'padded'. 
            // The keyboard covers the bottom inset.
            // So we need to pad by (KeyboardHeight - Insets.Bottom).
            setKeyboardHeight(e.endCoordinates.height - (Platform.OS === 'ios' ? insets.bottom : 0));
        });
        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [insets.bottom]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleToggleTask = (task: any) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTaskStatus.mutate({ taskId: task.id, status: newStatus }, {
            onError: (err: any) => {
                Alert.alert('Error', 'Failed to update task status');
            }
        });
    };

    const handleChatPress = (task: any) => {
        setSelectedTask(task);
        setShowComments(true);
    };

    const handleSendMessage = () => {
        if (!messageText.trim()) return;
        sendMessage.mutate(messageText);
        setMessageText('');
    };

    // Calculate progress
    const progress = useMemo(() => {
        if (!group?.tasks || group.tasks.length === 0) return 0;
        const completed = group.tasks.filter((t: any) => t.status === 'completed').length;
        return Math.round((completed / group.tasks.length) * 100);
    }, [group?.tasks]);

    const handleSettingsPress = () => {
        Alert.alert(
            'Project Settings',
            `Manage ${groupName}`,
            [
                {
                    text: 'Copy Invite Code',
                    onPress: async () => {
                        if (group?.code) {
                            await Clipboard.setStringAsync(group.code);
                            Alert.alert('Copied', 'Invite code copied to clipboard');
                        }
                    }
                },
                {
                    text: 'Leave Project',
                    style: 'destructive',
                    onPress: () => Alert.alert('Leave Project', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Leave',
                            style: 'destructive',
                            onPress: () => {
                                // TODO: Implement leave logic
                                Alert.alert('Coming Soon', 'Leave functionality coming in next update');
                            }
                        }
                    ])
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    if (isLoading && !group) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{groupName}</Text>
                </View>
                <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { marginTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
                        <Text style={styles.headerCode}>Code: {group?.code || '...'}</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Project Progress</Text>
                        <Text style={styles.progressValue}>{progress}%</Text>
                    </View>
                    <View style={styles.track}>
                        <View style={[styles.bar, { width: `${progress}%` }]} />
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                    onPress={() => setActiveTab('tasks')}
                >
                    <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                    onPress={() => setActiveTab('chat')}
                >
                    <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'team' && styles.activeTab]}
                    onPress={() => setActiveTab('team')}
                >
                    <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>Team</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                {activeTab === 'chat' ? (
                    <View
                        style={[styles.chatContainer, { paddingBottom: keyboardHeight }]}
                    >
                        <ScrollView
                            style={styles.messageList}
                            contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
                        >
                            {messages?.map((msg) => {
                                const isMe = msg.user_id === user?.id;
                                return (
                                    <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                                        {!isMe && (
                                            <View style={styles.messageAvatar}>
                                                <Text style={styles.messageAvatarText}>
                                                    {msg.user?.display_name?.charAt(0) || '?'}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                                            {!isMe && <Text style={styles.messageAuthor}>{msg.user?.display_name}</Text>}
                                            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                                                {msg.content}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                            {(!messages || messages.length === 0) && (
                                <View style={styles.emptyChat}>
                                    <Text style={styles.emptyChatText}>No messages yet. Say hi! 👋</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.inputBar}>
                            <TextInput
                                style={styles.input}
                                value={messageText}
                                onChangeText={setMessageText}
                                placeholder="Type a message..."
                                placeholderTextColor="#9BA0A8"
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                                onPress={handleSendMessage}
                                disabled={!messageText.trim()}
                            >
                                <Text style={styles.sendButtonText}>➤</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.content}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
                    >
                        {activeTab === 'tasks' ? (
                            <View style={styles.taskList}>
                                {group?.tasks && group.tasks.length > 0 ? (
                                    group.tasks.map((task: any) => (
                                        <View key={task.id} style={styles.taskCard}>
                                            <TouchableOpacity
                                                style={[styles.checkbox, task.status === 'completed' && styles.checkboxChecked]}
                                                onPress={() => handleToggleTask(task)}
                                            >
                                                {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
                                            </TouchableOpacity>

                                            <View style={styles.taskContent}>
                                                <Text style={[
                                                    styles.taskTitle,
                                                    task.status === 'completed' && styles.taskTitleCompleted
                                                ]}>
                                                    {task.title}
                                                </Text>

                                                <View style={styles.taskMetaRow}>
                                                    {task.due_date && (
                                                        <Text style={styles.taskDate}>
                                                            Due {new Date(task.due_date).toLocaleDateString()}
                                                        </Text>
                                                    )}

                                                    <TouchableOpacity
                                                        style={styles.chatButton}
                                                        onPress={() => handleChatPress(task)}
                                                    >
                                                        <Text style={styles.chatIcon}>💬</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* Assignee Avatar */}
                                            {task.assignee ? (
                                                <View style={styles.assigneeAvatar}>
                                                    <Text style={styles.assigneeInitials}>
                                                        {task.assignee.display_name?.charAt(0) || '?'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.unassignedBadge}>
                                                    <Text style={styles.unassignedText}>?</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyIcon}>📋</Text>
                                        <Text style={styles.emptyText}>No shared tasks yet</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.addTaskButton}
                                    onPress={() => setShowCreateTask(true)}
                                >
                                    <Text style={styles.addTaskButtonText}>+ Add Shared Task</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.teamList}>
                                {group?.members?.map((member: any) => (
                                    <View key={member.id} style={styles.memberRow}>
                                        <View style={styles.memberAvatar}>
                                            <Text style={styles.memberAvatarText}>
                                                {member.display_name?.charAt(0) || '?'}
                                            </Text>
                                        </View>
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{member.display_name}</Text>
                                            <Text style={styles.memberRole}>{member.role}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <CreateTaskModal
                visible={showCreateTask}
                onClose={() => setShowCreateTask(false)}
                groupId={groupId}
                members={group?.members || []}
            />

            {selectedTask && (
                <TaskCommentsModal
                    visible={showComments}
                    onClose={() => setShowComments(false)}
                    taskId={selectedTask.id}
                    taskTitle={selectedTask.title}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#1A1A1A',
        fontWeight: '300',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerCode: {
        fontSize: 12,
        color: '#6C63FF',
        fontWeight: '600',
        marginTop: 2,
    },
    settingsButton: {
        padding: 8,
    },
    settingsIcon: {
        fontSize: 20,
    },
    progressContainer: {
        paddingHorizontal: 8,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6C63FF',
    },
    track: {
        height: 6,
        backgroundColor: '#F0F0FF',
        borderRadius: 3,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 3,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#6C63FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9BA0A8',
    },
    activeTabText: {
        color: '#6C63FF',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    taskList: {
        gap: 12,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9FA',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        color: '#1A1A1A',
        marginBottom: 4,
    },
    taskTitleCompleted: {
        color: '#9BA0A8',
        textDecorationLine: 'line-through',
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingRight: 8,
    },
    taskDate: {
        fontSize: 12,
        color: '#9BA0A8',
    },
    chatButton: {
        padding: 4,
    },
    chatIcon: {
        fontSize: 16,
    },
    assigneeAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    assigneeInitials: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6C63FF',
    },
    unassignedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    unassignedText: {
        fontSize: 14,
        color: '#9BA0A8',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#9BA0A8',
    },
    addTaskButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#6C63FF',
        borderStyle: 'dashed',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    addTaskButtonText: {
        color: '#6C63FF',
        fontWeight: '600',
        fontSize: 14,
    },
    teamList: {
        gap: 0,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6C63FF',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    memberRole: {
        fontSize: 12,
        color: '#9BA0A8',
        textTransform: 'capitalize',
    },
    // Chat Styles
    chatContainer: {
        flex: 1,
        // height: 500, // Fixed height for now, ideally flex 1 if container logic allows
    },
    messageList: {
        gap: 12,
        marginBottom: 16,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E0FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageAvatarText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6C63FF',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '75%',
    },
    messageBubbleMe: {
        backgroundColor: '#6C63FF',
        borderBottomRightRadius: 2,
    },
    messageBubbleOther: {
        backgroundColor: '#F5F5F7',
        borderBottomLeftRadius: 2,
    },
    messageAuthor: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B6B6B',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    messageTextMe: {
        color: '#FFFFFF',
    },
    messageTextOther: {
        color: '#1A1A1A',
    },
    emptyChat: {
        padding: 40,
        alignItems: 'center',
    },
    emptyChatText: {
        color: '#9BA0A8',
        fontSize: 14,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F7',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1A1A1A',
        maxHeight: 100,
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
        backgroundColor: '#E0E0E0',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
});
