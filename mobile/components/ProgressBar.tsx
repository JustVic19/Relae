import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
    const insets = useSafeAreaInsets();
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: currentStep,
            useNativeDriver: false,
            tension: 50,
            friction: 7,
        }).start();
    }, [currentStep]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, totalSteps],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <View style={styles.track}>
                <Animated.View
                    style={[
                        styles.fill,
                        { width: progressWidth }
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        zIndex: 10,
    },
    track: {
        height: 8,
        backgroundColor: '#333333',
        borderRadius: 8,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: '#A78BFA',
        borderRadius: 8,
    },
});
