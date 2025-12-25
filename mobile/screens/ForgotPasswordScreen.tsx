import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
    const { resetPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async () => {
        setError('');
        setSuccess(false);

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        const result = await resetPassword(email);
        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <View style={styles.content}>
                        {!success ? (
                            <>
                                {/* Title */}
                                <Text style={styles.title}>Forgot Password?</Text>
                                <Text style={styles.subtitle}>
                                    No worries! To reset you password. Please entre{'\n'}your email address
                                </Text>

                                {/* Email Input */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email address"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    returnKeyType="done"
                                    onSubmitEditing={handleResetPassword}
                                />

                                {/* Error Message */}
                                {error ? <Text style={styles.error}>{error}</Text> : null}

                                {/* Reset Password Button */}
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.resetButtonText}>Reset password</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Success Message */}
                                <View style={styles.successContainer}>
                                    <Text style={styles.successIcon}>✉️</Text>
                                    <Text style={styles.successTitle}>Check your email!</Text>
                                    <Text style={styles.successText}>
                                        We've sent a password reset link to{'\n'}{email}
                                    </Text>
                                </View>

                                {/* Back to Login Button */}
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.resetButtonText}>Back to Login</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Back Navigation */}
                        {!success && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF4F0',
    },
    inner: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 360,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 40,
    },
    input: {
        backgroundColor: '#000000',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 28,
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 24,
    },
    error: {
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    resetButton: {
        backgroundColor: '#A78BFA',
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
        marginBottom: 24,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '600',
    },
    successContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    successIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
    },
    successText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
    },
});
