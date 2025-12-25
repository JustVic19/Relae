import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const { signIn, signInWithGoogle, signInWithApple, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        const result = await signIn(email, password);
        if (result.error) {
            setError(result.error);
        } else {
            // Save remember me preference
            if (rememberMe) {
                await AsyncStorage.setItem('hasLoggedIn', 'true');
            }
        }
        // If successful, user will automatically be redirected to Feed screen
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.error) {
            setError(result.error);
        } else if (rememberMe) {
            await AsyncStorage.setItem('hasLoggedIn', 'true');
        }
    };

    const handleAppleSignIn = async () => {
        setError('');
        const result = await signInWithApple();
        if (result.error) {
            setError(result.error);
        } else if (rememberMe) {
            await AsyncStorage.setItem('hasLoggedIn', 'true');
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
                        {/* Title */}
                        <Text style={styles.title}>Hi There!</Text>
                        <Text style={styles.subtitle}>Please enter your details</Text>

                        {/* Social Login Buttons */}
                        <View style={styles.socialButtons}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleSignIn}
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
                                onPress={handleAppleSignIn}
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
                        />

                        {/* Password Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />

                        {/* Forgot Password Link */}
                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Error Message */}
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        {/* Remember Me */}
                        <TouchableOpacity
                            style={styles.rememberMeContainer}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.rememberMeText}>Remember me</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>Log In</Text>
                            )}
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Create an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                <Text style={styles.footerLink}>Sign Up</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 240,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '600',
    },
    error: {
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#A78BFA',
        borderColor: '#A78BFA',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#000000',
    },
    loginButton: {
        backgroundColor: '#A78BFA',
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
        marginBottom: 24,
    },
    loginButtonText: {
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
