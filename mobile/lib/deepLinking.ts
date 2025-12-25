import { Linking } from 'react-native';
import { supabase } from './supabase';

/**
 * Configure deep linking for OAuth callbacks and email verification
 * Call this function in your App.tsx or main entry point
 */
export function setupDeepLinking() {
    // Handle deep links when app is already open
    Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when app is opened from closed state
    Linking.getInitialURL().then((url) => {
        if (url) {
            handleDeepLink({ url });
        }
    });
}

/**
 * Handle incoming deep links for OAuth and email verification
 */
function handleDeepLink(event: { url: string }) {
    const url = event.url;

    // Handle OAuth callback
    if (url.includes('auth/callback')) {
        // Extract the URL params (access_token, refresh_token, etc.)
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.hash.substring(1)); // Remove # and parse

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
            // Set the session in Supabase
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
            });
        }
    }

    // Handle password reset
    if (url.includes('auth/reset-password')) {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
            // User can now update their password
            // You might want to navigate to a password update screen here
        }
    }
}

/**
 * Clean up deep link listeners
 */
export function cleanupDeepLinking() {
    Linking.removeAllListeners('url');
}
