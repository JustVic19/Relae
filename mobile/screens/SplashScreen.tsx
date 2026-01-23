import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = require('react-native').Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const dotScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const sequence = Animated.sequence([
            // Initial pause showing just the icon
            Animated.delay(1500),

            // Expand black dot to fill screen
            Animated.timing(dotScale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]);

        sequence.start(() => {
            onFinish();
        });
    }, []);

    // Calculate scale needed to cover entire screen
    const screenDiagonal = Math.sqrt(width * width + height * height);
    const finalScale = screenDiagonal / 10; // Start from 10px dot

    const dotScaleInterpolated = dotScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0, finalScale],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Icon centered */}
            <Image
                source={require('../assets/icon-only.png')}
                style={styles.icon}
                resizeMode="contain"
            />

            {/* Expanding black dot */}
            <Animated.View
                style={[
                    styles.blackDot,
                    {
                        transform: [{ scale: dotScaleInterpolated }],
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 150,
        height: 150,
    },
    blackDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#000000',
        top: height / 2 - 5,
        left: width / 2 - 5,
    },
});
