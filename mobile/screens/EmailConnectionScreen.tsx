import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useEmailIntegrations } from '../hooks/useEmailIntegrations';
import { apiRequest } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../hooks/useProfile';

// Constants
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface EmailConnectionScreenProps {
    visible: boolean;
    onClose: () => void;
}

WebBrowser.maybeCompleteAuthSession();

export default function EmailConnectionScreen({ visible, onClose }: EmailConnectionScreenProps) {
    const [connecting, setConnecting] = useState<'google' | 'microsoft' | 'apple_calendar' | null>(null);
    const [appleCalendarConnected, setAppleCalendarConnected] = useState(false);
    const { integrations, refetch } = useEmailIntegrations();
    const { profile: user } = useProfile();

    // Check Apple Calendar status on mount
    useEffect(() => {
        checkAppleCalendarStatus();
    }, []);

    const checkAppleCalendarStatus = async () => {
        try {
            const status = await AsyncStorage.getItem('apple_calendar_connected');
            if (status === 'true') {
                setAppleCalendarConnected(true);
            }
        } catch (e) {
            console.error('Failed to load calendar status', e);
        }
    };

    const handleGoogleConnect = async () => {
        try {
            setConnecting('google');

            // Get OAuth URL from backend
            const response = await apiRequest<{ authUrl: string; state: string }>('/api/email/connect/google');
            const { authUrl } = response;

            // Open OAuth flow in browser
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                Linking.createURL('/--/email-connected')
            );

            if (result.type === 'success') {
                // Refresh integrations list and wait for it
                await refetch();
                // Give React Query time to update the cache
                await new Promise(resolve => setTimeout(resolve, 500));
                Alert.alert('Success', 'Gmail connected successfully!');
                onClose();
            }
        } catch (error: any) {
            console.error('Google connection error:', error);
            Alert.alert('Connection Failed', error.message || 'Failed to connect Gmail account');
        } finally {
            setConnecting(null);
        }
    };

    const handleMicrosoftConnect = async () => {
        try {
            setConnecting('microsoft');
            const authUrl = `${BACKEND_URL}/api/email/connect/microsoft?userId=${user?.id}`;

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                Linking.createURL('/--/email-connected')
            );

            if (result.type === 'success') {
                await refetch();
                setTimeout(() => {
                    Alert.alert('Success', 'Outlook connected successfully!');
                    onClose();
                }, 500);
            }
        } catch (error: any) {
            console.error('Microsoft connection error:', error);
            Alert.alert('Error', 'Failed to connect Outlook account');
        } finally {
            setConnecting(null);
        }
    };

    const handleAppleCalendarConnect = async () => {
        try {
            setConnecting('apple_calendar');

            // Dynamic import to avoid issues if package isn't linked yet
            const Calendar = require('expo-calendar');

            const { status } = await Calendar.requestCalendarPermissionsAsync();

            if (status === 'granted') {
                await AsyncStorage.setItem('apple_calendar_connected', 'true');
                setAppleCalendarConnected(true);
                Alert.alert('Success', 'Apple Calendar connected! Relae will now sync your events.');
                onClose();
            } else {
                Alert.alert('Permission needed', 'Please allow calendar access to sync your events.');
            }
        } catch (error: any) {
            console.error('Apple Calendar Error:', error);
            Alert.alert('Error', 'Failed to connect Apple Calendar');
        } finally {
            setConnecting(null);
        }
    };

    const connectedGoogle = integrations.some(i => i.provider === 'gmail');
    const connectedMicrosoft = integrations.some(i => i.provider === 'outlook');

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
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {integrations.length > 0 ? 'Add Another Account' : 'Connect Your Email'}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero Subtitle */}
                    <Text style={styles.heroSubtitle}>
                        {integrations.length > 0
                            ? 'Connect additional email accounts to sync all your tasks'
                            : 'Let Relae scan your emails to automatically find assignments, exams, and deadlines'
                        }
                    </Text>

                    {/* Connected Accounts Section */}
                    {(integrations.length > 0 || appleCalendarConnected) && (
                        <View style={styles.connectedSection}>
                            <Text style={styles.sectionTitle}>Connected Accounts</Text>

                            {/* Apple Calendar Connected Item */}
                            {appleCalendarConnected && (
                                <View key="apple-cal" style={styles.connectedCard}>
                                    <View style={styles.connectedLeft}>
                                        <View style={[
                                            styles.connectedIconContainer,
                                            { backgroundColor: '#000000' }
                                        ]}>
                                            <Ionicons name="calendar" size={24} color="#FFF" />
                                        </View>
                                        <View style={styles.connectedInfo}>
                                            <Text style={styles.connectedName}>Apple Calendar</Text>
                                            <Text style={styles.connectedEmail}>On this iPhone</Text>
                                        </View>
                                    </View>
                                    <View style={styles.connectedStatus}>
                                        <Ionicons name="checkmark-circle" size={24} color="#12B76A" />
                                    </View>
                                </View>
                            )}

                            {integrations.map((integration) => (
                                <View key={integration.id} style={styles.connectedCard}>
                                    <View style={styles.connectedLeft}>
                                        <View style={[
                                            styles.connectedIconContainer,
                                            { backgroundColor: integration.provider === 'gmail' ? '#DB4437' : '#0078D4' }
                                        ]}>
                                            <Ionicons
                                                name={integration.provider === 'gmail' ? "logo-google" : "mail"}
                                                size={24}
                                                color="#FFF"
                                            />
                                        </View>
                                        <View style={styles.connectedInfo}>
                                            <Text style={styles.connectedName}>
                                                {integration.provider === 'gmail' ? 'Google' : 'Outlook'}
                                            </Text>
                                            <Text style={styles.connectedEmail}>{integration.email_address}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.connectedStatus}>
                                        <Ionicons name="checkmark-circle" size={24} color="#12B76A" />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Email Providers */}
                    <View style={styles.providersSection}>
                        <Text style={styles.sectionTitle}>Choose Your Email Provider</Text>

                        {/* Gmail */}
                        <TouchableOpacity
                            style={[
                                styles.providerCard,
                                connectedGoogle && styles.providerCardConnected
                            ]}
                            onPress={handleGoogleConnect}
                            disabled={connecting !== null}
                            activeOpacity={0.7}
                        >
                            <View style={styles.providerLeft}>
                                <View style={[styles.providerIconContainer, { backgroundColor: '#EA4335' }]}>
                                    <Ionicons name="logo-google" size={28} color="#FFF" />
                                </View>
                                <View style={styles.providerInfo}>
                                    <Text style={styles.providerName}>Gmail</Text>
                                    <Text style={styles.providerDescription}>
                                        {connectedGoogle ? 'Tap to add another account' : 'Connect your Google account'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.providerRight}>
                                {connecting === 'google' ? (
                                    <ActivityIndicator color="#000" />
                                ) : connectedGoogle ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#12B76A" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={24} color="#999" />
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Outlook */}
                        <TouchableOpacity
                            style={[
                                styles.providerCard,
                                connectedMicrosoft && styles.providerCardConnected
                            ]}
                            onPress={handleMicrosoftConnect}
                            disabled={connecting !== null}
                            activeOpacity={0.7}
                        >
                            <View style={styles.providerLeft}>
                                <View style={[styles.providerIconContainer, { backgroundColor: '#0078D4' }]}>
                                    <Ionicons name="mail" size={28} color="#FFF" />
                                </View>
                                <View style={styles.providerInfo}>
                                    <Text style={styles.providerName}>Outlook</Text>
                                    <Text style={styles.providerDescription}>
                                        {connectedMicrosoft ? 'Tap to add another account' : 'Connect your Microsoft account'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.providerRight}>
                                {connecting === 'microsoft' ? (
                                    <ActivityIndicator color="#000" />
                                ) : connectedMicrosoft ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#12B76A" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={24} color="#999" />
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Apple Calendar */}
                        <TouchableOpacity
                            style={[
                                styles.providerCard,
                                styles.providerCardApple,
                                appleCalendarConnected && styles.providerCardConnected
                            ]}
                            onPress={handleAppleCalendarConnect}
                            disabled={connecting !== null}
                            activeOpacity={0.7}
                        >
                            <View style={styles.providerLeft}>
                                <View style={[styles.providerIconContainer, { backgroundColor: '#000000' }]}>
                                    <Ionicons name="calendar" size={28} color="#FFF" />
                                </View>
                                <View style={styles.providerInfo}>
                                    <Text style={styles.providerName}>Apple Calendar</Text>
                                    <Text style={styles.providerDescription}>
                                        {appleCalendarConnected ? 'Tap to manage settings' : 'Sync with your iPhone calendar'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.providerRight}>
                                {connecting === 'apple_calendar' ? (
                                    <ActivityIndicator color="#000" />
                                ) : appleCalendarConnected ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#12B76A" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={24} color="#999" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Privacy Notice */}
                    <View style={styles.privacyNotice}>
                        <Ionicons name="lock-closed" size={20} color="#666" />
                        <Text style={styles.privacyText}>
                            Your privacy matters. Relae only reads emails to find tasks and never stores your passwords.
                        </Text>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>What Relae Will Do</Text>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>✅</Text>
                            <Text style={styles.featureText}>Automatically detect assignments and deadlines</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📅</Text>
                            <Text style={styles.featureText}>Add exam dates to your calendar</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🔔</Text>
                            <Text style={styles.featureText}>Send smart reminders before due dates</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🎯</Text>
                            <Text style={styles.featureText}>Prioritize your most urgent tasks</Text>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
    },
    headerSpacer: {
        width: 36,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    connectedSection: {
        marginTop: 20,
        marginBottom: 10,
    },
    connectedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#12B76A',
    },
    connectedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    connectedIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    connectedInfo: {
        flex: 1,
    },
    connectedName: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
        marginBottom: 2,
    },
    connectedEmail: {
        fontSize: 14,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#666',
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    heroIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
        marginBottom: 12,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    providersSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
        marginBottom: 16,
    },
    providerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F8F8',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    providerCardConnected: {
        borderColor: '#12B76A',
        backgroundColor: '#F0FDF4',
    },
    providerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    providerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
        marginBottom: 4,
    },
    providerDescription: {
        fontSize: 14,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#666',
    },
    providerRight: {
        marginLeft: 12,
    },
    privacyNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
    },
    privacyText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#666',
        marginLeft: 12,
        lineHeight: 20,
    },
    featuresSection: {
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#333',
    },
});
