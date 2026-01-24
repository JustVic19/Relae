import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCat';
import { useAuth } from '../contexts/AuthContext';

import { LinearGradient } from 'expo-linear-gradient';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
    const { refreshProStatus } = useAuth();
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        const offerings = await revenueCatService.getOfferings();
        if (offerings) {
            setOffering(offerings);
            // Auto-select annual if available, otherwise monthly
            if (offerings.annual) {
                setSelectedPackage(offerings.annual);
            } else if (offerings.monthly) {
                setSelectedPackage(offerings.monthly);
            } else if (offerings.availablePackages.length > 0) {
                setSelectedPackage(offerings.availablePackages[0]);
            }
        }
        setLoading(false);
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        setPurchasing(true);
        try {
            const result = await revenueCatService.purchasePackage(selectedPackage);
            if (result) {
                await refreshProStatus();
                Alert.alert('Success', 'Welcome to Pro! 🎉');
                onClose();
            }
        } catch (error: any) {
            if (!error.userCancelled) {
                Alert.alert('Error', error.message || 'Purchase failed');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        try {
            const customerInfo = await revenueCatService.restorePurchases();
            if (customerInfo?.entitlements.active['pro']) {
                await refreshProStatus();
                Alert.alert('Success', 'Purchases restored! Welcome back.');
                onClose();
            } else {
                Alert.alert('Info', 'No active subscriptions found to restore.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Restore failed');
        } finally {
            setPurchasing(false);
        }
    };

    const features = [
        '✨ Unlimited AI Task Breakdowns',
        '📅 Advanced Calendar Sync',
        '📊 Daily & Weekly Insights',
        '🎨 Custom Themes & App Icons',
        '🚀 Priority Support'
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroSection}>
                        <Text style={styles.limitLabel}>LIMIT REACHED</Text>
                        <Text style={styles.heroTitle}>Unlock Full Potential</Text>
                        <Text style={styles.heroSubtitle}>
                            Get unlimited access to all features and take your productivity to the next level.
                        </Text>
                    </View>

                    <View style={styles.featuresContainer}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
                    ) : offering ? (
                        <View style={styles.packagesContainer}>
                            {offering.availablePackages.map((pkg) => (
                                <TouchableOpacity
                                    key={pkg.identifier}
                                    style={[
                                        styles.packageCard,
                                        selectedPackage?.identifier === pkg.identifier && styles.packageCardSelected
                                    ]}
                                    onPress={() => setSelectedPackage(pkg)}
                                >
                                    <View style={styles.packageHeader}>
                                        <Text style={[
                                            styles.packageTitle,
                                            selectedPackage?.identifier === pkg.identifier && styles.packageTitleSelected
                                        ]}>
                                            {pkg.packageType === 'ANNUAL' ? 'Yearly' :
                                                pkg.packageType === 'MONTHLY' ? 'Monthly' : 'Lifettime'}
                                        </Text>
                                        {pkg.packageType === 'ANNUAL' && (
                                            <View style={styles.saveBadge}>
                                                <Text style={styles.saveText}>BEST VALUE</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.packagePrice,
                                        selectedPackage?.identifier === pkg.identifier && styles.packagePriceSelected
                                    ]}>
                                        {pkg.product.priceString}
                                    </Text>
                                    <Text style={[
                                        styles.packageDuration,
                                        selectedPackage?.identifier === pkg.identifier && styles.packageDurationSelected
                                    ]}>
                                        {pkg.packageType === 'ANNUAL' ? 'per year' : 'per month'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Unable to load packages. Please check your connection.</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.purchaseButton, (loading || purchasing || !selectedPackage) && styles.disabledButton]}
                        onPress={handlePurchase}
                        disabled={loading || purchasing || !selectedPackage}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.purchaseButtonText}>
                                {selectedPackage?.product.introPrice ? 'Start Free Trial' : 'Subscribe Now'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton} disabled={purchasing}>
                        <Text style={styles.restoreText}>Restore Purchases</Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        Recurring billing. Cancel anytime.
                    </Text>
                </View>
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
        padding: 16,
        alignItems: 'flex-end',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#1A1A1A',
        marginTop: -2,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    limitLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 8,
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#6B6B6B',
        textAlign: 'center',
        lineHeight: 24,
    },
    featuresContainer: {
        marginBottom: 32,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    loader: {
        marginTop: 40,
    },
    packagesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    packageCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    packageCardSelected: {
        borderColor: '#6C63FF',
        backgroundColor: '#F5F3FF',
        borderWidth: 2,
    },
    packageHeader: {
        marginBottom: 8,
        alignItems: 'center',
    },
    packageTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B6B6B',
        marginBottom: 4,
    },
    packageTitleSelected: {
        color: '#6C63FF',
    },
    saveBadge: {
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    saveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#03543F',
    },
    packagePrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    packagePriceSelected: {
        color: '#6C63FF',
    },
    packageDuration: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    packageDurationSelected: {
        color: '#7C3AED',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    purchaseButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#A5A6F6',
        opacity: 0.7,
    },
    purchaseButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    restoreButton: {
        alignItems: 'center',
        marginBottom: 16,
    },
    restoreText: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    disclaimer: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
    },
});
