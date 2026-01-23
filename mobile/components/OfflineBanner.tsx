import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner = () => {
    const netInfo = useNetInfo();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-100)).current;

    // Sometimes netInfo returns null initially, treat as connected until proven otherwise
    const isOffline = netInfo.isConnected === false;

    useEffect(() => {
        if (isOffline) {
            // Slide down
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide up
            Animated.timing(slideAnim, {
                toValue: -100, // Hide above screen
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isOffline]);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: insets.top,
                    transform: [{ translateY: slideAnim }],
                    // Ensure it stays on top
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                }
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.icon}>📡</Text>
                <Text style={styles.text}>No Internet Connection</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1A1A1A',
        paddingBottom: 8,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    icon: {
        marginRight: 8,
        fontSize: 14,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
