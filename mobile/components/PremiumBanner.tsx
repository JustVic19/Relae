import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PremiumBannerProps {
    onPress: () => void;
    style?: any;
    compact?: boolean;
}

export default function PremiumBanner({ onPress, style, compact = false }: PremiumBannerProps) {
    if (compact) {
        return (
            <TouchableOpacity onPress={onPress} style={[styles.compactContainer, style]}>
                <LinearGradient
                    colors={['#6C63FF', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.compactGradient}
                >
                    <Text style={styles.compactIcon}>✨</Text>
                    <View style={styles.compactContent}>
                        <Text style={styles.compactTitle}>Upgrade to Pro</Text>
                        <Text style={styles.compactSubtitle}>Unlock all features</Text>
                    </View>
                    <View style={styles.compactButton}>
                        <Text style={styles.compactButtonText}>GET</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
            <LinearGradient
                colors={['#F5F3FF', '#EFF6FF']}
                style={styles.gradient}
            >
                <View style={styles.row}>
                    <View style={styles.content}>
                        <View style={styles.badgeContainer}>
                            <LinearGradient
                                colors={['#6C63FF', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.badge}
                            >
                                <Text style={styles.badgeText}>PRO</Text>
                            </LinearGradient>
                            <Text style={styles.offerText}>50% OFF YEARLY</Text>
                        </View>
                        <Text style={styles.title}>Unlock Full Potential</Text>
                        <Text style={styles.subtitle}>
                            Unlimited AI tasks, advanced insights, and custom themes.
                        </Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🚀</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    gradient: {
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        paddingRight: 16,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    offerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6C63FF',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B6B6B',
        lineHeight: 18,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    icon: {
        fontSize: 24,
    },

    // Compact styles
    compactContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    compactGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
    },
    compactIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    compactContent: {
        flex: 1,
    },
    compactTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    compactSubtitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    compactButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    compactButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6C63FF',
    },
});
