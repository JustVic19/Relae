import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const maxDimension = Math.max(width, height) * 2;

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const rotation = useRef(new Animated.Value(0)).current;
    const dotScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // 1. Initial pause - let user see the logo
            Animated.delay(1300),
            // 2. Rotate logo 45°
            Animated.timing(rotation, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // 3. Brief pause
            Animated.delay(300),
            // 4. Expand dot from center to fill screen
            Animated.timing(dotScale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFinish();
        });
    }, [onFinish, rotation, dotScale]);

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <Animated.Image
                source={require('../assets/logo-black.png')}
                style={[
                    styles.logo,
                    {
                        transform: [{ rotate: rotateInterpolate }],
                    },
                ]}
                resizeMode="contain"
            />

            {/* Expanding black dot */}
            <Animated.View
                style={[
                    styles.dot,
                    {
                        transform: [{ scale: dotScale }],
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF4F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 180,
    },
    dot: {
        position: 'absolute',
        width: maxDimension,
        height: maxDimension,
        borderRadius: maxDimension / 2,
        backgroundColor: '#000000',
    },
});
