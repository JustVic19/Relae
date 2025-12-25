import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    initializing: boolean;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<{ error: string | null }>;
    signInWithApple: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    isEmailVerified: () => boolean;
    resendVerificationEmail: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert AuthError to user-friendly message
function getErrorMessage(error: AuthError | Error): string {
    if ('message' in error) {
        const message = error.message.toLowerCase();

        // Common error messages
        if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
            return 'Invalid email or password. Please try again.';
        }
        if (message.includes('email not confirmed')) {
            return 'Please verify your email address before signing in.';
        }
        if (message.includes('user already registered')) {
            return 'An account with this email already exists.';
        }
        if (message.includes('password should be at least')) {
            return 'Password must be at least 6 characters long.';
        }
        if (message.includes('invalid email')) {
            return 'Please enter a valid email address.';
        }
        if (message.includes('network')) {
            return 'Network error. Please check your connection.';
        }

        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setInitializing(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setInitializing(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Use Supabase hosted URL for email confirmation
                    emailRedirectTo: `https://kikaavafovalupmhzmpc.supabase.co/auth/v1/verify`,
                },
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            // User is signed up and can use the app immediately
            // They will receive a verification email to confirm later
            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'relae://auth/callback',
                    skipBrowserRedirect: false,
                },
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            // Open the OAuth URL in browser
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    'relae://auth/callback'
                );

                if (result.type === 'cancel') {
                    return { error: 'Sign in was cancelled' };
                }
            }

            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const signInWithApple = async () => {
        setLoading(true);
        try {
            // Check if Apple Authentication is available
            if (Platform.OS !== 'ios') {
                return { error: 'Apple Sign-In is only available on iOS devices' };
            }

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Sign in with Supabase using the Apple ID token
            const { error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken!,
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            return { error: null };
        } catch (error: any) {
            if (error.code === 'ERR_REQUEST_CANCELED') {
                return { error: 'Sign in was cancelled' };
            }
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'relae://auth/reset-password',
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const isEmailVerified = () => {
        return user?.email_confirmed_at !== undefined;
    };

    const resendVerificationEmail = async () => {
        if (!user?.email) {
            return { error: 'No email address found' };
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: 'relae://auth/callback',
                },
            });

            if (error) {
                return { error: getErrorMessage(error) };
            }

            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error as Error) };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        session,
        user,
        loading,
        initializing,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        resetPassword,
        isEmailVerified,
        resendVerificationEmail,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
