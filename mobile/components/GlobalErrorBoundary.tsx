import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import * as Updates from 'expo-updates';

interface FallbackProps {
    error: any;
    resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Fallback for dev mode where reloadAsync might not work or if configured differently
            resetErrorBoundary();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>💥</Text>
                <Text style={styles.title}>Oops! Something went wrong.</Text>
                <Text style={styles.subtitle}>
                    We're sorry, but the app encountered an unexpected error.
                </Text>

                <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorContent}>
                    <Text style={styles.errorText}>{error.message}</Text>
                    {__DEV__ && (
                        <Text style={styles.stack}>{error.stack}</Text>
                    )}
                </ScrollView>

                <TouchableOpacity style={styles.button} onPress={handleRestart}>
                    <Text style={styles.buttonText}>Restart App</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={resetErrorBoundary}>
                    <Text style={styles.secondaryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorBox: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        width: '100%',
        maxHeight: 200,
        marginBottom: 24,
    },
    errorContent: {
        padding: 12,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        fontFamily: 'Courier',
        marginBottom: 8,
    },
    stack: {
        fontSize: 10,
        color: '#9BA0A8',
        fontFamily: 'Courier',
    },
    button: {
        backgroundColor: '#6C63FF',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        paddingVertical: 12,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6C63FF',
    },
});
