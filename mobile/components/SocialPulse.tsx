import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// For now, we have no friends connected. 
// In the future, this will fetch from a useFriends() hook.
const friends: any[] = [];

export default function SocialPulse() {
    const handleNudge = (name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('👋 Nudged!', `You sent a nudge to ${name}.`);
    };

    return (
        <View style={styles.container}>
            {/* Header / Pulse Stat */}
            <View style={styles.header}>
                <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.headerText}>
                        <Text style={styles.boldText}>142 students</Text> are focusing now
                    </Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Campus Pulse', 'See what everyone is working on (Coming Soon)')}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            </View>

            {/* Friends Horizontal Scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Always show Invite Button first */}
                <TouchableOpacity style={styles.addFriendButton} onPress={() => Alert.alert('Invite', 'Invite friends to Relae')}>
                    <View style={styles.plusIconContainer}>
                        <Text style={styles.plusIcon}>+</Text>
                    </View>
                    <Text style={styles.nameText}>Invite</Text>
                </TouchableOpacity>

                {friends.length === 0 ? (
                    // Empty State Message (Optional, or just show Invite button)
                    <View style={styles.emptyFriendState}>
                        <Text style={styles.emptyFriendText}>Add friends to see activity</Text>
                    </View>
                ) : (
                    friends.map((friend) => (
                        <TouchableOpacity
                            key={friend.id}
                            style={styles.friendItem}
                            onPress={() => handleNudge(friend.name)}
                        >
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                                <View style={[styles.statusBadge, friend.status === 'studying' || friend.status === 'focus' ? styles.statusGreen : styles.statusGray]} />
                            </View>
                            <Text style={styles.nameText}>{friend.name}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    headerText: {
        fontSize: 14,
        color: '#6B6B6B',
    },
    boldText: {
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAllText: {
        fontSize: 13,
        color: '#007AFF', // Or brand color
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 4,
        gap: 16,
    },
    friendItem: {
        alignItems: 'center',
        gap: 8,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    statusGreen: {
        backgroundColor: '#10B981',
    },
    statusGray: {
        backgroundColor: '#9CA3AF',
    },
    nameText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    addFriendButton: {
        alignItems: 'center',
        gap: 8,
    },
    plusIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F5F5F7', // Light gray
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#C0C0C0',
    },
    plusIcon: {
        fontSize: 24,
        color: '#6B6B6B',
        fontWeight: '300',
    },
    emptyFriendState: {
        justifyContent: 'center',
        paddingLeft: 8,
    },
    emptyFriendText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});
