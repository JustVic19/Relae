import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './OnboardingScreen';

const { width } = Dimensions.get('window');

interface OnboardingContainerProps {
    navigation: any;
}

export default function OnboardingContainer({ navigation }: OnboardingContainerProps) {
    const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

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

    const handleGetStarted = () => {
        navigation.navigate('SignUp');
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <OnboardingScreen onNext={handleGetStarted} onLogin={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
});

