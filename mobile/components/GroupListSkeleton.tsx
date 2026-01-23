import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SkeletonItem = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [opacity]);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Animated.View style={[styles.icon, { opacity }]} />
                <Animated.View style={[styles.badge, { opacity }]} />
            </View>
            <Animated.View style={[styles.title, { opacity }]} />
            <Animated.View style={[styles.desc, { opacity }]} />
            <Animated.View style={[styles.footer, { opacity }]} />
        </View>
    );
};

export default function GroupListSkeleton() {
    return (
        <View style={styles.container}>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        height: 160,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F0F0F5',
    },
    badge: {
        width: 60,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#F0F0F5',
    },
    title: {
        width: '60%',
        height: 24,
        borderRadius: 6,
        backgroundColor: '#F0F0F5',
        marginBottom: 12,
    },
    desc: {
        width: '90%',
        height: 16,
        borderRadius: 4,
        backgroundColor: '#F0F0F5',
        marginBottom: 24,
    },
    footer: {
        width: '30%',
        height: 16,
        borderRadius: 4,
        backgroundColor: '#F0F0F5',
    },
});
