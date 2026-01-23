import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface EmailOnboardingWalkthroughProps {
    visible: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const STEPS = [
    {
        title: 'Connect Your School Email',
        description: 'Link your school email to automatically detect assignments, exams, and important deadlines.',
        icon: 'mail' as const,
        action: 'Connect Email',
    },
    {
        title: 'Upload Your Timetable',
        description: 'Import your class schedule so Relae can suggest optimal study times around your classes.',
        icon: 'calendar' as const,
        action: 'Upload Timetable',
    },
    {
        title: 'Let AI Do the Work',
        description: 'Relae will scan your emails, organize tasks, and send smart reminders to keep you on track.',
        icon: 'sparkles' as const,
        action: 'Get Started',
    },
];

export default function EmailOnboardingWalkthrough({ visible, onClose, onComplete }: EmailOnboardingWalkthroughProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            // Animate out
            Animated.timing(slideAnim, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep + 1);
                slideAnim.setValue(width);
                // Animate in
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            handleComplete();
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('email_onboarding_shown', 'true');
        onClose();
    };

    const handleComplete = async () => {
        await AsyncStorage.setItem('email_onboarding_shown', 'true');
        onComplete();
    };

    const step = STEPS[currentStep];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleSkip}
        >
            <View style={styles.container}>
                {/* Skip Button */}
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.content}>
                    <Animated.View style={[styles.stepContainer, { transform: [{ translateX: slideAnim }] }]}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Ionicons name={step.icon} size={80} color="#000" />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>{step.title}</Text>

                        {/* Description */}
                        <Text style={styles.description}>{step.description}</Text>
                    </Animated.View>
                </View>

                {/* Progress Dots */}
                <View style={styles.dotsContainer}>
                    {STEPS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentStep && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.actionButton} onPress={handleNext} activeOpacity={0.9}>
                    <Text style={styles.actionButtonText}>{step.action}</Text>
                </TouchableOpacity>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'SpaceGrotesk-Medium',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    stepContainer: {
        alignItems: 'center',
        width: width - 60,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: 'SpaceGrotesk-Bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk-Regular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#000',
        width: 24,
    },
    actionButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginHorizontal: 30,
        marginBottom: 20,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk-Bold',
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 40,
    },
});
