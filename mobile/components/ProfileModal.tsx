import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useProfile, useProfileMutations, useUserStats, useAchievements } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import NotificationModal from './NotificationModal';
import PremiumBanner from './PremiumBanner';
import PaywallModal from './PaywallModal';
import { pickImage } from '../services/profileService';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onEmailSetup?: () => void; // Optional callback to trigger email setup
}

type Tab = 'info' | 'stats' | 'achievements' | 'settings';

const EMOJI_AVATARS = ['👤', '🌟', '🚀', '💡', '🎯', '🔥', '🎨', '🌈'];
const AVATAR_COLORS = ['#6C63FF', '#FF6B9D', '#FEC84B', '#12B76A', '#2E90FA', '#7C3AED'];

const ACHIEVEMENT_INFO: Record<string, { name: string; icon: string; description: string; color: string }> = {
    first_task: { name: 'First Steps', icon: '🎯', description: 'Complete your first task', color: '#12B76A' },
    early_bird: { name: 'Early Bird', icon: '🌅', description: 'Complete 5 tasks before 9 AM', color: '#FEC84B' },
    night_owl: { name: 'Night Owl', icon: '🦉', description: 'Complete 5 tasks after 9 PM', color: '#6C63FF' },
    consistent: { name: 'Consistent', icon: '🔥', description: '7-day streak', color: '#FF6B9D' },
    dedicated: { name: 'Dedicated', icon: '💎', description: '30-day streak', color: '#7C3AED' },
    speed_demon: { name: 'Speed Demon', icon: '⚡', description: '10 tasks in one day', color: '#FEC84B' },
    half_century: { name: 'Half Century', icon: '🏅', description: '50 total tasks', color: '#2E90FA' },
    century: { name: 'Century', icon: '🏆', description: '100 total tasks', color: '#12B76A' },
    weekly_warrior: { name: 'Weekly Warrior', icon: '👑', description: '4 weeks in a row', color: '#FF6B9D' },
};

export default function ProfileModal({ visible, onClose, onEmailSetup }: ProfileModalProps) {
    const { profile, isLoading } = useProfile();
    const { stats, isLoading: statsLoading } = useUserStats();
    const { achievements, isLoading: achievementsLoading } = useAchievements();
    const { updateDisplayName, updateAvatar, uploadImage, logout, isUpdating, isLoggingOut } = useProfileMutations();

    const { isPro } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    const handleSaveName = () => {
        if (tempName.trim()) {
            updateDisplayName(tempName.trim());
            setEditingName(false);
        }
    };

    const handleSelectEmoji = (emoji: string) => {
        updateAvatar(`emoji:${emoji}`);
        setShowAvatarPicker(false);
    };

    const handleSelectInitials = (color: string) => {
        const initials = profile?.display_name?.slice(0, 2).toUpperCase() || 'U';
        updateAvatar(`initials:${initials}:${color}`);
        setShowAvatarPicker(false);
    };

    const handleUploadPhoto = async () => {
        try {
            const uri = await pickImage();
            if (uri) {
                console.log('Image selected:', uri);
                // Wait for upload to complete before closing picker
                await uploadImage(uri);
                setShowAvatarPicker(false);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Error', error.message || 'Failed to upload image');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        onClose();
                    },
                },
            ]
        );
    };

    const renderAvatar = () => {
        if (!profile?.avatar_url) {
            return <Text style={styles.avatarText}>{profile?.display_name?.charAt(0).toUpperCase() || 'U'}</Text>;
        }

        if (profile.avatar_url.startsWith('emoji:')) {
            const emoji = profile.avatar_url.replace('emoji:', '');
            return <Text style={styles.avatarEmoji}>{emoji}</Text>;
        }

        if (profile.avatar_url.startsWith('initials:')) {
            const [, initials, color] = profile.avatar_url.split(':');
            return (
                <View style={[styles.avatarInitials, { backgroundColor: color }]}>
                    <Text style={styles.avatarInitialsText}>{initials}</Text>
                </View>
            );
        }

        // It's an image URL
        console.log('Rendering image avatar:', profile.avatar_url);
        return (
            <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                onError={(error) => {
                    console.error('Image failed to load:', error.nativeEvent);
                }}
                onLoad={() => {
                    console.log('Image loaded successfully');
                }}
            />
        );
    };

    if (isLoading) {
        return (
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabs}>
                    {[
                        { key: 'info', label: 'Info', icon: '👤' },
                        { key: 'stats', label: 'Stats', icon: '📊' },
                        { key: 'achievements', label: 'Badges', icon: '🏆' },
                        { key: 'settings', label: 'Settings', icon: '⚙️' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key as Tab)}
                        >
                            <Text style={styles.tabIcon}>{tab.icon}</Text>
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <ScrollView style={styles.content}>
                    {activeTab === 'info' && (
                        <View style={styles.infoTab}>
                            {/* Avatar */}
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={() => setShowAvatarPicker(true)}
                            >
                                <View style={styles.avatar}>{renderAvatar()}</View>
                                <View style={styles.avatarEditBadge}>
                                    <Text style={styles.avatarEditIcon}>✏️</Text>
                                </View>
                            </TouchableOpacity>

                            {/* PREMIUM BANNER - Only show if not pro */}
                            {!isPro && (
                                <PremiumBanner
                                    onPress={() => setShowPaywall(true)}
                                    compact
                                    style={{ marginBottom: 24 }}
                                />
                            )}

                            {/* Display Name */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Display Name</Text>
                                {editingName ? (
                                    <View style={styles.editContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={tempName}
                                            onChangeText={setTempName}
                                            placeholder="Enter name"
                                            autoFocus
                                        />
                                        <View style={styles.editActions}>
                                            <TouchableOpacity
                                                onPress={() => setEditingName(false)}
                                                style={styles.editButton}
                                            >
                                                <Text style={styles.editButtonText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={handleSaveName}
                                                style={[styles.editButton, styles.editButtonPrimary]}
                                                disabled={isUpdating}
                                            >
                                                <Text style={styles.editButtonTextPrimary}>
                                                    {isUpdating ? 'Saving...' : 'Save'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.fieldValue}
                                        onPress={() => {
                                            setTempName(profile?.display_name || '');
                                            setEditingName(true);
                                        }}
                                    >
                                        <Text style={styles.value}>{profile?.display_name}</Text>
                                        <Text style={styles.editIcon}>✏️</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Email */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.value}>{profile?.email}</Text>
                            </View>

                            {/* Logout Button */}
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                                disabled={isLoggingOut}
                            >
                                <Text style={styles.logoutButtonText}>
                                    {isLoggingOut ? 'Logging out...' : '🚪 Logout'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'stats' && (
                        <View style={styles.infoTab}>
                            {statsLoading ? (
                                <ActivityIndicator size="large" color="#6C63FF" />
                            ) : stats ? (
                                <>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statIcon}>✅</Text>
                                            <Text style={styles.statValue}>{stats.total_completed}</Text>
                                            <Text style={styles.statLabel}>Total Tasks</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statIcon}>🔥</Text>
                                            <Text style={styles.statValue}>{stats.current_streak}</Text>
                                            <Text style={styles.statLabel}>Current Streak</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statIcon}>🏆</Text>
                                            <Text style={styles.statValue}>{stats.best_streak}</Text>
                                            <Text style={styles.statLabel}>Best Streak</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statIcon}>🎯</Text>
                                            <Text style={styles.statValue}>{achievements.length}</Text>
                                            <Text style={styles.statLabel}>Achievements</Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.placeholderText}>No stats available</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'achievements' && (
                        <View style={styles.infoTab}>
                            {achievementsLoading ? (
                                <ActivityIndicator size="large" color="#6C63FF" />
                            ) : achievements.length > 0 ? (
                                <View style={styles.achievementsGrid}>
                                    {achievements.map((achievement) => {
                                        const info = ACHIEVEMENT_INFO[achievement.achievement_type];
                                        if (!info) return null;
                                        return (
                                            <View key={achievement.id} style={[styles.achievementCard, { borderColor: info.color }]}>
                                                <Text style={styles.achievementIcon}>{info.icon}</Text>
                                                <Text style={styles.achievementName}>{info.name}</Text>
                                                <Text style={styles.achievementDesc}>{info.description}</Text>
                                                <Text style={styles.achievementDate}>
                                                    {new Date(achievement.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.placeholderTab}>
                                    <Text style={styles.placeholderIcon}>🏆</Text>
                                    <Text style={styles.placeholderText}>Complete tasks to unlock achievements!</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'settings' && (
                        <View style={styles.infoTab}>
                            {/* Notification Preferences */}
                            <View style={styles.settingsSection}>
                                <Text style={styles.sectionTitle}>Preferences</Text>
                                <TouchableOpacity
                                    style={styles.settingRow}
                                    onPress={() => setShowNotificationModal(true)}
                                >
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>🔔</Text>
                                        <Text style={styles.settingLabel}>Notifications</Text>
                                    </View>
                                    <Text style={styles.settingChevron}>›</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.settingRow}
                                    onPress={() => {
                                        if (onEmailSetup) {
                                            onClose();
                                            onEmailSetup();
                                        }
                                    }}
                                >
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>📧</Text>
                                        <Text style={styles.settingLabel}>Email & Timetable</Text>
                                    </View>
                                    <Text style={styles.settingChevron}>›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* About */}
                            <View style={styles.settingsSection}>
                                <Text style={styles.sectionTitle}>About</Text>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>📱</Text>
                                        <Text style={styles.settingLabel}>App Version</Text>
                                    </View>
                                    <Text style={styles.settingValue}>1.0.0</Text>
                                </View>
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>❓</Text>
                                        <Text style={styles.settingLabel}>Help & Support</Text>
                                    </View>
                                    <Text style={styles.settingChevron}>›</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>🔒</Text>
                                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                                    </View>
                                    <Text style={styles.settingChevron}>›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Danger Zone */}
                            <View style={styles.settingsSection}>
                                <Text style={styles.sectionTitle}>Account</Text>
                                <TouchableOpacity
                                    style={[styles.settingRow, styles.dangerRow]}
                                    onPress={() => {
                                        Alert.alert(
                                            'Delete Account',
                                            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Delete',
                                                    style: 'destructive',
                                                    onPress: () => {
                                                        // TODO: Implement account deletion
                                                        Alert.alert('Coming Soon', 'Account deletion will be available soon.');
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingIcon}>⚠️</Text>
                                        <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
                                    </View>
                                    <Text style={styles.settingChevron}>›</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Avatar Picker Modal */}
                <Modal
                    visible={showAvatarPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAvatarPicker(false)}
                >
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerTitle}>Choose Avatar</Text>

                            <Text style={styles.pickerSection}>Emoji</Text>
                            <View style={styles.emojiGrid}>
                                {EMOJI_AVATARS.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={styles.emojiOption}
                                        onPress={() => handleSelectEmoji(emoji)}
                                    >
                                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.pickerSection}>Initials</Text>
                            <View style={styles.colorGrid}>
                                {AVATAR_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorOption, { backgroundColor: color }]}
                                        onPress={() => handleSelectInitials(color)}
                                    >
                                        <Text style={styles.colorOptionText}>
                                            {profile?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
                                <Text style={styles.uploadButtonText}>📸 Upload Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAvatarPicker(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <NotificationModal
                    visible={showNotificationModal}
                    onClose={() => setShowNotificationModal(false)}
                />

                <PaywallModal
                    visible={showPaywall}
                    onClose={() => setShowPaywall(false)}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeButton: {
        fontSize: 28,
        color: '#9BA0A8',
        padding: 4,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#6C63FF',
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    tabText: {
        fontSize: 12,
        color: '#9BA0A8',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#6C63FF',
    },
    content: {
        flex: 1,
    },
    infoTab: {
        padding: 20,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarEmoji: {
        fontSize: 64,
    },
    avatarInitials: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialsText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#F5F5F7',
    },
    avatarEditIcon: {
        fontSize: 16,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
        marginBottom: 8,
    },
    fieldValue: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
    },
    value: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    editIcon: {
        fontSize: 16,
    },
    editContainer: {
        gap: 12,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    editButtonPrimary: {
        backgroundColor: '#6C63FF',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    editButtonTextPrimary: {
        color: '#FFFFFF',
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    placeholderTab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 18,
        color: '#9BA0A8',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 24,
        textAlign: 'center',
    },
    pickerSection: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
        marginTop: 16,
        marginBottom: 12,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    emojiOption: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
    },
    emojiOptionText: {
        fontSize: 32,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    colorOptionText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    uploadButton: {
        backgroundColor: '#6C63FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9BA0A8',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 8,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
    },
    achievementsGrid: {
        gap: 16,
        marginTop: 8,
    },
    achievementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    achievementIcon: {
        fontSize: 40,
    },
    achievementName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
        flex: 1,
    },
    achievementDesc: {
        fontSize: 14,
        color: '#6B6B6B',
        flex: 1,
    },
    achievementDate: {
        fontSize: 12,
        color: '#9BA0A8',
        position: 'absolute',
        top: 20,
        right: 20,
    },
    settingsSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B6B6B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingIcon: {
        fontSize: 20,
    },
    settingLabel: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    settingValue: {
        fontSize: 16,
        color: '#6B6B6B',
    },
    settingChevron: {
        fontSize: 24,
        color: '#9BA0A8',
    },
    dangerRow: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    dangerText: {
        color: '#EF4444',
        fontWeight: '600',
    },
});
