import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from '../components/ProgressBar';
import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';
import OnboardingScreen4 from './OnboardingScreen4';

const { width } = Dimensions.get('window');

interface OnboardingContainerProps {
    navigation: any;
}

export default function OnboardingContainer({ navigation }: OnboardingContainerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

    const screens = [
        { id: '1', component: OnboardingScreen1 },
        { id: '2', component: OnboardingScreen2 },
        { id: '3', component: OnboardingScreen3 },
        { id: '4', component: OnboardingScreen4 },
    ];

    // Check if user has logged in before
    useEffect(() => {
        checkLoginHistory();
    }, []);

    const checkLoginHistory = async () => {
        try {
            const loginHistory = await AsyncStorage.getItem('hasLoggedIn');
            setHasLoggedInBefore(loginHistory === 'true');
        } catch (error) {
            console.error('Error checking login history:', error);
        }
    };

    // Auto advance after 7 seconds
    useEffect(() => {
        if (currentIndex < 3) { // Changed from 4 to 3 since we only have 4 screens now
            autoAdvanceTimer.current = setTimeout(() => {
                goToNext();
            }, 7000);
        }

        return () => {
            if (autoAdvanceTimer.current) {
                clearTimeout(autoAdvanceTimer.current);
            }
        };
    }, [currentIndex]);

    const goToNext = () => {
        if (currentIndex < screens.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== currentIndex && index >= 0 && index < screens.length) {
            setCurrentIndex(index);

            // Clear auto-advance timer when user manually swipes
            if (autoAdvanceTimer.current) {
                clearTimeout(autoAdvanceTimer.current);
            }
        }
    };

    const handleGetStarted = () => {
        // Smart routing: returning users go to Login, new users go to SignUp
        if (hasLoggedInBefore) {
            navigation.navigate('Login');
        } else {
            navigation.navigate('SignUp');
        }
    };

    const renderScreen = ({ item, index }: { item: typeof screens[0]; index: number }) => {
        const ScreenComponent = item.component;

        return (
            <View style={styles.screen}>
                <ScreenComponent onNext={index === 3 ? handleGetStarted : goToNext} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ProgressBar currentStep={currentIndex + 1} totalSteps={4} />

            <FlatList
                ref={flatListRef}
                data={screens}
                renderItem={renderScreen}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                bounces={false}
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="center"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    screen: {
        width: width,
        flex: 1,
    },
});
