import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen({ navigation }: { navigation: any }) {
    const { signUp, signInWithGoogle, signInWithApple, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSubmit = () => {
        if (email) {
            setShowPassword(true);
        }
    };

    const handleSignUp = async () => {
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!password) {
            setError('Please enter a password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await signUp(email, password);
        if (result.error) {
            setError(result.error);
        }
        // If successful, user will automatically be logged in and redirected to Feed
        // They will also receive a verification email
    };

    const handleGoogleSignUp = async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.error) {
            setError(result.error);
        }
    };

    const handleAppleSignUp = async () => {
        setError('');
        const result = await signInWithApple();
        if (result.error) {
            setError(result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.content}>
                        {/* Title */}
                        <Text style={styles.title}>Create An Account</Text>
                        <Text style={styles.subtitle}>
                            To create an account provide your details, verify,{'\n'}and set a password
                        </Text>

                        {/* Social Login Buttons */}
                        <View style={styles.socialButtons}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleSignUp}
                                disabled={loading}
                            >
                                <Image
                                    source={require('../assets/google-logo.png')}
                                    style={styles.socialLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleAppleSignUp}
                                disabled={loading}
                            >
                                <Image
                                    source={require('../assets/apple-logo.png')}
                                    style={styles.socialLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or</Text>
                            <View style={styles.dividerLine} />
                        </View>

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
                            returnKeyType="next"
                            onSubmitEditing={handleEmailSubmit}
                        />

                        {/* Password Input - Shows after email is entered */}
                        {showPassword && (
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password-new"
                                returnKeyType="done"
                                onSubmitEditing={handleSignUp}
                            />
                        )}

                        {/* Error Message */}
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={showPassword ? handleSignUp : handleEmailSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.continueButtonText}>
                                    {showPassword ? 'Create Account' : 'Continue'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>
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
    backButton: {
        paddingTop: 60,
        paddingLeft: 32,
        paddingBottom: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 220,
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
    socialButtons: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        backgroundColor: '#000000',
        paddingVertical: 16,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    socialLogo: {
        width: 20,
        height: 20,
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        gap: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#CCCCCC',
    },
    dividerText: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#000000',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 28,
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 16,
    },
    error: {
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    continueButton: {
        backgroundColor: '#A78BFA',
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
        marginBottom: 24,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#999999',
    },
    footerLink: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '700',
    },
});
