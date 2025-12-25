# UI Integration Guide for Authentication Screens

This guide shows you how to integrate your custom UI designs with the authentication system that's now set up.

## Available Authentication Methods

The `useAuth()` hook provides these methods:

```typescript
const {
    user,              // Current user object (null if not logged in)
    session,           // Current session
    loading,           // True when auth operation in progress
    initializing,      // True when checking initial auth state
    signUp,            // (email, password) => Promise<{ error: string | null }>
    signIn,            // (email, password) => Promise<{ error: string | null }>
    signInWithGoogle,  // () => Promise<{ error: string | null }>
    signInWithApple,   // () => Promise<{ error: string | null }>
    signOut,           // () => Promise<void>
    resetPassword,     // (email) => Promise<{ error: string | null }>
    isEmailVerified,   // () => boolean
    resendVerificationEmail, // () => Promise<{ error: string | null }>
} = useAuth();
```

---

## LoginScreen Template

Replace the placeholder `LoginScreen.tsx` with your design. Here's the structure:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const { signIn, signInWithGoogle, signInWithApple, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        const result = await signIn(email, password);
        if (result.error) {
            setError(result.error);
        }
        // If successful, user will automatically be navigated to Feed screen
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.error) {
            setError(result.error);
        }
    };

    const handleAppleSignIn = async () => {
        setError('');
        const result = await signInWithApple();
        if (result.error) {
            setError(result.error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Your beautiful UI here */}
            
            {/* Email Input */}
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
            />

            {/* Password Input */}
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                autoComplete="password"
            />

            {/* Error Message */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text>Log In</Text>
                )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Social Login Buttons */}
            <TouchableOpacity onPress={handleGoogleSignIn} disabled={loading}>
                <Text>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAppleSignIn} disabled={loading}>
                <Text>Continue with Apple</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    error: { color: '#ff6b6b' },
});
```

---

## SignUpScreen Template

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen({ navigation }: { navigation: any }) {
    const { signUp, signInWithGoogle, signInWithApple, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignUp = async () => {
        setError('');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await signUp(email, password);
        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            // User is now logged in and will be redirected to Feed
        }
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
        <View style={styles.container}>
            {/* Your beautiful UI here */}

            {/* Email Input */}
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
            />

            {/* Password Input */}
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                autoComplete="password-new"
            />

            {/* Confirm Password Input */}
            <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                secureTextEntry
            />

            {/* Error Message */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Success Message */}
            {success ? <Text style={styles.success}>Account created! Logging you in...</Text> : null}

            {/* Sign Up Button */}
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text>Sign Up</Text>
                )}
            </TouchableOpacity>

            {/* Social Sign Up Buttons */}
            <TouchableOpacity onPress={handleGoogleSignUp} disabled={loading}>
                <Text>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAppleSignUp} disabled={loading}>
                <Text>Sign up with Apple</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text>Already have an account? Log In</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    error: { color: '#ff6b6b' },
    success: { color: '#51cf66' },
});
```

---

## ForgotPasswordScreen Template

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
        <View style={styles.container}>
            {/* Your beautiful UI here */}

            {!success ? (
                <>
                    <Text>Enter your email to receive a password reset link</Text>

                    {/* Email Input */}
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    {/* Error Message */}
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Submit Button */}
                    <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.success}>
                        Password reset link sent! Check your email.
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text>Back to Login</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Back to Login */}
            {!success && (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text>Back</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    error: { color: '#ff6b6b' },
    success: { color: '#51cf66' },
});
```

---

## Key Points

1. **All authentication methods return `{ error: string | null }`** - Check for errors and display them
2. **The `loading` state** shows when an auth operation is in progress - use it to disable buttons and show spinners
3. **Navigation happens automatically** - When a user successfully logs in, they're automatically redirected to the Feed screen
4. **Social login opens a browser** - Google OAuth opens in a web browser, then returns to the app
5. **Error messages are user-friendly** - The AuthContext already converts technical errors to readable messages

---

## Testing Your Screens

Once you've designed your screens:

1. **Email/Password**:
   - Sign up with a new email
   - Check that you're logged in (redirected to Feed)
   - Sign out and try logging in again

2. **Google OAuth**:
   - Tap the Google button
   - Complete the OAuth flow in the browser
   - You should return to the app and be logged in

3. **Apple Sign-In**:
   - Only works on iOS devices/simulators
   - Tap the Apple button
   - Complete Face ID/Touch ID
   - You should be logged in

4. **Password Reset**:
   - Tap "Forgot Password"
   - Enter email
   - Check your email for the reset link
