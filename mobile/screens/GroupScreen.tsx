import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroups, Group } from '../hooks/useGroups';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import GroupListSkeleton from '../components/GroupListSkeleton';

export default function GroupScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { data: groups, isLoading, isError, refetch } = useGroups();
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleGroupPress = (group: Group) => {
        // Navigate to details (to be implemented)
        console.log('Navigating to group:', group.id);
        navigation.navigate('GroupDetails', { groupId: group.id, groupName: group.name });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { marginTop: insets.top }]}>
                <View>
                    <Text style={styles.title}>Collaboration</Text>
                    <Text style={styles.subtitle}>My Projects</Text>
                </View>
                <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => setShowJoinModal(true)}
                >
                    <Text style={styles.joinButtonText}>Join via Code</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
                }
            >
                {isLoading && !refreshing ? (
                    <GroupListSkeleton />
                ) : isError ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>⚠️</Text>
                        <Text style={styles.emptyTitle}>Oops!</Text>
                        <Text style={styles.emptyText}>
                            {/* @ts-ignore */}
                            {typeof isError === 'object' ? (isError as any).message : 'Failed to load projects. Please try again.'}
                        </Text>
                    </View>
                ) : groups && groups.length > 0 ? (
                    <View style={styles.grid}>
                        {groups.map((group) => (
                            <TouchableOpacity
                                key={group.id}
                                style={styles.groupCard}
                                onPress={() => handleGroupPress(group)}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconPlaceholder}>
                                        <Text style={styles.iconText}>{group.name.charAt(0)}</Text>
                                    </View>
                                    {group.role === 'admin' && (
                                        <View style={styles.adminBadge}>
                                            <Text style={styles.adminText}>Admin</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.groupName} numberOfLines={2}>
                                    {group.name}
                                </Text>

                                <Text style={styles.groupDesc} numberOfLines={2}>
                                    {group.description || 'No description'}
                                </Text>

                                <View style={styles.cardFooter}>
                                    <View style={styles.memberPill}>
                                        <Text style={styles.memberIcon}>👥</Text>
                                        <Text style={styles.memberCount}>
                                            {group.member_count} Member{group.member_count !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🤝</Text>
                        <Text style={styles.emptyTitle}>No Projects Yet</Text>
                        <Text style={styles.emptyText}>
                            Create a group to start collaborating with your team on assignments and tasks.
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Text style={styles.createButtonText}>Create New Project</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* FAB for Create (visible when there are groups) */}
            {groups && groups.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 100 }]} // Above bottom tab bar
                    onPress={() => setShowCreateModal(true)}
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            )}

            <CreateGroupModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <JoinGroupModal
                visible={showJoinModal}
                onClose={() => setShowJoinModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B6B6B',
        fontWeight: '600',
    },
    joinButton: {
        backgroundColor: '#EAEAEC',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    joinButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    content: {
        padding: 20,
        paddingBottom: 120, // Space for bottom tab + FAB
    },
    grid: {
        gap: 16,
    },
    groupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F0F0FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6C63FF',
    },
    adminBadge: {
        backgroundColor: '#FFF4E5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    adminText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FF9500',
        textTransform: 'uppercase',
    },
    groupName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    groupDesc: {
        fontSize: 14,
        color: '#9BA0A8',
        marginBottom: 16,
        height: 40,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F7',
        paddingTop: 16,
    },
    memberPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    memberIcon: {
        fontSize: 14,
    },
    memberCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B6B6B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: '80%',
    },
    createButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        fontSize: 32,
        color: '#FFFFFF',
        marginTop: -4,
    },
});
