import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { revenueCatService } from '../services/revenueCat';
import { useAuth } from '../contexts/AuthContext';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const { width } = Dimensions.get('window');

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
    const { user, refreshProStatus } = useAuth();
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            loadOfferings();
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        try {
            const data = await revenueCatService.getOfferings();
            setOffering(data);
        } catch (error) {
            console.error('Failed to load offerings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        // Use real package if available, otherwise just mock success if in potential dev mode
        const packageToPurchase = selectedPlan === 'annual' ? offering?.annual : offering?.monthly;

        // If we have a package, try to purchase it
        if (packageToPurchase) {
            setPurchasing(true);
            try {
                const result = await revenueCatService.purchasePackage(packageToPurchase);
                if (result) {
                    await refreshProStatus();
                    onClose();
                    Alert.alert('Welcome to Pro!', 'You have successfully unlocked all features. 🚀');
                }
            } catch (error: any) {
                if (!error.userCancelled) {
                    Alert.alert('Purchase Failed', error.message || 'Please try again later.');
                }
            } finally {
                setPurchasing(false);
            }
        } else {
            // Fallback for demo purposes if no offering loaded (e.g. invalid API key)
            Alert.alert('Demo Mode', 'No valid offering found. This is a preview of the UI.');
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        try {
            const customerInfo = await revenueCatService.restorePurchases();
            if (customerInfo?.entitlements.active['pro']) {
                await refreshProStatus();
                onClose();
                Alert.alert('Restored!', 'Your purchases have been restored.');
            } else {
                Alert.alert('No Purchases', 'We couldn\'t find any active subscriptions for this account.');
            }
        } catch (error: any) {
            Alert.alert('Restore Failed', error.message || 'Please try again later.');
        } finally {
            setPurchasing(false);
        }
    };

    const monthlyPackage = offering?.monthly;
    const annualPackage = offering?.annual;

    // --- Fallback Display Logic ---
    // If RevenueCat fails to load or hasn't loaded yet, show these default prices
    // so the UI doesn't look broken.
    const monthlyPriceString = monthlyPackage?.product.priceString ?? '$9.99';
    // UPDATED: Default fallback is now $99.99
    const annualPriceString = annualPackage?.product.priceString ?? '$99.99';

    const monthlyPriceVal = monthlyPackage?.product.price ?? 9.99;
    // UPDATED: Default fallback value is now 99.99
    const annualPriceVal = annualPackage?.product.price ?? 99.99;

    const annualMonthlyEquivalent = annualPriceVal / 12;

    // Calculated savings (likely smaller now)
    const savingsPercent = Math.round(
        ((monthlyPriceVal * 12 - annualPriceVal) / (monthlyPriceVal * 12)) * 100
    );

    const features = [
        { icon: 'scan-outline', title: 'AI Text Scan', desc: 'Instantly turn photos into tasks' },
        { icon: 'calendar-outline', title: 'Smart Sync', desc: 'Auto-sync with your calendar' },
        { icon: 'infinite-outline', title: 'Unlimited', desc: 'No limits on AI task creation' },
        { icon: 'analytics-outline', title: 'Deep Insights', desc: 'Track your productivity trends' },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <LinearGradient
                    colors={['#ffffff', '#f0f5ff']}
                    style={styles.background}
                />

                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.contentParams}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRestore}>
                                <Text style={styles.restoreText}>Restore</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#6366F1" />
                            </View>
                        ) : (
                            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                                {/* Hero Section */}
                                <View style={styles.heroSection}>
                                    <View style={styles.iconBadge}>
                                        <LinearGradient
                                            colors={['#6366F1', '#8B5CF6']}
                                            style={styles.iconGradient}
                                        >
                                            <Ionicons name="rocket" size={32} color="#FFF" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.title}>Unlock Full Access</Text>
                                    <Text style={styles.subtitle}>
                                        Join thousands of students achieving their goals faster with Relae Pro.
                                    </Text>
                                </View>

                                {/* Features Grid */}
                                <View style={styles.featuresGrid}>
                                    {features.map((item, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <View style={styles.featureIconContainer}>
                                                <Ionicons name={item.icon as any} size={22} color="#6366F1" />
                                            </View>
                                            <View>
                                                <Text style={styles.featureTitle}>{item.title}</Text>
                                                <Text style={styles.featureDesc}>{item.desc}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Plans Selection */}
                                <View style={styles.plansContainer}>
                                    {/* Annual Plan */}
                                    <TouchableOpacity
                                        style={[
                                            styles.planCard,
                                            selectedPlan === 'annual' && styles.planCardActive
                                        ]}
                                        onPress={() => setSelectedPlan('annual')}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.planHeader}>
                                            <Text style={styles.planName}>Yearly</Text>
                                            {/* UPDATED: Savings badge REMOVED */}
                                        </View>
                                        <Text style={styles.planPrice}>
                                            {annualPriceString}
                                            <Text style={styles.planInterval}>/year</Text>
                                        </Text>
                                        <Text style={styles.planSubtext}>
                                            That's just ${annualMonthlyEquivalent.toFixed(2)}/mo
                                        </Text>

                                        {selectedPlan === 'annual' && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Monthly Plan */}
                                    <TouchableOpacity
                                        style={[
                                            styles.planCard,
                                            selectedPlan === 'monthly' && styles.planCardActive
                                        ]}
                                        onPress={() => setSelectedPlan('monthly')}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.planHeader}>
                                            <Text style={styles.planName}>Monthly</Text>
                                        </View>
                                        <Text style={styles.planPrice}>
                                            {monthlyPriceString}
                                            <Text style={styles.planInterval}>/mo</Text>
                                        </Text>
                                        <Text style={styles.planSubtext}>
                                            Flexible, cancel anytime
                                        </Text>

                                        {selectedPlan === 'monthly' && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Bottom Disclaimer */}
                                <Text style={styles.disclaimer}>
                                    Subscription automatically renews. Cancel anytime in Settings > Apple ID.
                                </Text>

                                <View style={{ height: 100 }} />
                            </Animated.View>
                        )}
                    </ScrollView>
                </SafeAreaView>

                {/* Floating CTA Button */}
                {!loading && (
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={handlePurchase}
                            disabled={purchasing}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                {purchasing ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.ctaText}>
                                        Start {selectedPlan === 'annual' ? 'Yearly' : 'Monthly'} Plan
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.secureText}>
                            <Ionicons name="lock-closed" size={12} color="#6B7280" /> Secured with App Store
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentParams: {
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    iconBadge: {
        marginBottom: 20,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    featuresGrid: {
        marginBottom: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    featureIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    plansContainer: {
        gap: 16,
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    planCardActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    saveBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    saveText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '800',
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    planInterval: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    planSubtext: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    checkBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    disclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 20,
    },
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    ctaButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    ctaGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    secureText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
});
