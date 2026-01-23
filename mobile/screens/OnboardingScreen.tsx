import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
    onNext: () => void;
    onLogin: () => void;
}

const PILLS = [
    { label: 'New Event', color: '#FFD4B8', top: height * 0.10, left: width * 0.05, rotate: '-15deg' },
    { label: 'To do list', color: '#FBC4DA', top: height * 0.15, right: width * 0.05, rotate: '15deg' },
    { label: 'Shopping', color: '#D0C4F4', top: height * 0.25, left: width * 0.10, rotate: '-5deg' },
    { label: 'Meeting', color: '#C6F1C6', top: height * 0.35, left: width * 0.10, rotate: '-8deg' },
    { label: 'Schedule', color: '#FFC6FF', top: height * 0.32, right: width * 0.15, rotate: '10deg' },
    { label: 'Holidays', color: '#FFCCB3', top: height * 0.45, left: width * 0.15, rotate: '-5deg' },
    { label: 'Birthday', color: '#BDD4FC', top: height * 0.48, right: width * 0.20, rotate: '5deg' },
];

export default function OnboardingScreen({ onNext, onLogin }: OnboardingScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.pillsContainer}>
                {PILLS.map((pill, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.pill,
                            {
                                backgroundColor: pill.color,
                                top: pill.top,
                                left: pill.left,
                                right: pill.right,
                                transform: [{ rotate: pill.rotate }],
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <Text style={styles.pillText}>{pill.label}</Text>
                    </Animated.View>
                ))}
            </View>

            <View style={styles.bottomContent}>
                <Text style={styles.title}>
                    Manage all{'\n'}your activities{'\n'}here
                </Text>
                <Text style={styles.subtitle}>
                    The easy way to get full control of all your task
                </Text>

                <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.9}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
                    <Text style={styles.loginText}>
                        Already have account? <Text style={styles.loginHighlight}>Log in</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    pillsContainer: {
        flex: 1,
        position: 'relative',
    },
    pill: {
        position: 'absolute',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pillText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'SpaceGrotesk-SemiBold',
    },
    bottomContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 16,
        lineHeight: 48,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0A0A0',
        marginBottom: 32,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },
    loginLink: {
        alignItems: 'center',
    },
    loginText: {
        color: '#A0A0A0',
        fontSize: 14,
    },
    loginHighlight: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
