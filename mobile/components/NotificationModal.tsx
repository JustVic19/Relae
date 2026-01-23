
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Switch,
    ScrollView,
} from 'react-native';
import { useWeeklyGoal } from '../hooks/useWeeklyGoal';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
}

interface NotificationSettings {
    daily_briefing: boolean;
    weekly_report: boolean;
    task_reminders: boolean;
    achievements: boolean;
    marketing: boolean;
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
    const { preferences, updateNotificationSettings } = useWeeklyGoal();
    const [settings, setSettings] = useState<NotificationSettings>(
        preferences?.notification_settings || {
            daily_briefing: true,
            weekly_report: true,
            task_reminders: true,
            achievements: true,
            marketing: false,
        }
    );

    // Update local state when preferences load
    useEffect(() => {
        if (preferences?.notification_settings) {
            setSettings(preferences.notification_settings);
        }
    }, [preferences]);

    const handleToggle = (key: keyof NotificationSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        updateNotificationSettings(newSettings);
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
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Productivity</Text>

                        <View style={styles.row}>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Daily Briefing</Text>
                                <Text style={styles.description}>Get a summary of your tasks every morning.</Text>
                            </View>
                            <Switch
                                value={settings.daily_briefing}
                                onValueChange={() => handleToggle('daily_briefing')}
                                trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Weekly Report</Text>
                                <Text style={styles.description}>Weekly insights on your productivity and goals.</Text>
                            </View>
                            <Switch
                                value={settings.weekly_report}
                                onValueChange={() => handleToggle('weekly_report')}
                                trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Task Reminders</Text>
                                <Text style={styles.description}>Reminders for due dates and upcoming deadlines.</Text>
                            </View>
                            <Switch
                                value={settings.task_reminders}
                                onValueChange={() => handleToggle('task_reminders')}
                                trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Updates & Rewards</Text>

                        <View style={styles.row}>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Achievements</Text>
                                <Text style={styles.description}>Get notified when you unlock new badges.</Text>
                            </View>
                            <Switch
                                value={settings.achievements}
                                onValueChange={() => handleToggle('achievements')}
                                trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Product Updates</Text>
                                <Text style={styles.description}>News about new features and improvements.</Text>
                            </View>
                            <Switch
                                value={settings.marketing}
                                onValueChange={() => handleToggle('marketing')}
                                trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>
                    </View>
                </ScrollView>
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
    closeButton: {
        fontSize: 24,
        color: '#9BA0A8',
        padding: 4,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#9BA0A8',
        lineHeight: 20,
    },
});
