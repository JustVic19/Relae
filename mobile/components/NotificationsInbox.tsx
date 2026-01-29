import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNotifications, useNotificationMutations } from '../hooks/useNotifications';

interface NotificationsInboxProps {
    visible: boolean;
    onClose: () => void;
    onOpenSettings?: () => void;
}

export default function NotificationsInbox({ visible, onClose, onOpenSettings }: NotificationsInboxProps) {
    const { notifications, isLoading, refetch } = useNotifications();
    const { markAsRead, markAllAsRead, deleteNotification } = useNotificationMutations();

    const unreadNotifications = notifications.filter(n => !n.read);
    const readNotifications = notifications.filter(n => n.read);

    const handleNotificationPress = (notificationId: string) => {
        markAsRead(notificationId);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_reminder':
                return '📋';
            case 'task_due_soon':
                return '⏰';
            case 'task_overdue':
                return '🚨';
            case 'achievement':
                return '🏆';
            case 'weekly_report':
                return '📊';
            case 'daily_briefing':
                return '☀️';
            default:
                return '🔔';
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now.getTime() - notifTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifTime.toLocaleDateString();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    <View style={styles.headerActions}>
                        {onOpenSettings && (
                            <TouchableOpacity onPress={onOpenSettings} style={styles.settingsButton}>
                                <Text style={styles.settingsIcon}>⚙️</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mark all as read button */}
                {unreadNotifications.length > 0 && (
                    <View style={styles.actionsBar}>
                        <TouchableOpacity onPress={() => markAllAsRead()}>
                            <Text style={styles.markAllButton}>Mark all as read</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C63FF" />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🔔</Text>
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptySubtitle}>
                            We'll notify you about important updates
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.content}>
                        {/* Unread Notifications */}
                        {unreadNotifications.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>NEW</Text>
                                {unreadNotifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[styles.notificationCard, styles.unreadCard]}
                                        onPress={() => handleNotificationPress(notification.id)}
                                    >
                                        <View style={styles.notificationContent}>
                                            <View style={styles.notificationHeader}>
                                                <Text style={styles.notificationIcon}>
                                                    {getNotificationIcon(notification.type)}
                                                </Text>
                                                <View style={styles.unreadDot} />
                                            </View>
                                            <Text style={styles.notificationTitle}>
                                                {notification.title}
                                            </Text>
                                            <Text style={styles.notificationBody}>
                                                {notification.message}
                                            </Text>
                                            <Text style={styles.notificationTime}>
                                                {getTimeAgo(notification.created_at)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            style={styles.deleteButton}
                                        >
                                            <Text style={styles.deleteIcon}>🗑️</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Read Notifications */}
                        {readNotifications.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>EARLIER</Text>
                                {readNotifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={styles.notificationCard}
                                        onPress={() => handleNotificationPress(notification.id)}
                                    >
                                        <View style={styles.notificationContent}>
                                            <View style={styles.notificationHeader}>
                                                <Text style={styles.notificationIcon}>
                                                    {getNotificationIcon(notification.type)}
                                                </Text>
                                            </View>
                                            <Text style={[styles.notificationTitle, styles.readTitle]}>
                                                {notification.title}
                                            </Text>
                                            <Text style={[styles.notificationBody, styles.readBody]}>
                                                {notification.message}
                                            </Text>
                                            <Text style={styles.notificationTime}>
                                                {getTimeAgo(notification.created_at)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            style={styles.deleteButton}
                                        >
                                            <Text style={styles.deleteIcon}>🗑️</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsButton: {
        padding: 4,
    },
    settingsIcon: {
        fontSize: 20,
    },
    closeButton: {
        fontSize: 24,
        color: '#9BA0A8',
        padding: 4,
    },
    actionsBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    markAllButton: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6C63FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9BA0A8',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B6B6B',
        marginBottom: 8,
        marginLeft: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    unreadCard: {
        backgroundColor: '#F8F7FF',
        borderColor: '#6C63FF',
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    notificationIcon: {
        fontSize: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6C63FF',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    readTitle: {
        color: '#6B6B6B',
    },
    notificationBody: {
        fontSize: 14,
        color: '#4A4A4A',
        lineHeight: 20,
        marginBottom: 8,
    },
    readBody: {
        color: '#9BA0A8',
    },
    notificationTime: {
        fontSize: 12,
        color: '#9BA0A8',
    },
    deleteButton: {
        padding: 8,
    },
    deleteIcon: {
        fontSize: 16,
    },
});
