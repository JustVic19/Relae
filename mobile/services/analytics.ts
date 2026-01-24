import { init, track, identify, Identify, setUserId, reset } from '@amplitude/analytics-react-native';

const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';

export const Analytics = {
    /**
     * Initialize Analytics (call in App.tsx)
     */
    init: () => {
        if (AMPLITUDE_API_KEY) {
            init(AMPLITUDE_API_KEY, undefined, { disableCookies: true });
        } else {
            console.log('⚠️ Amplitude API Key missing. Analytics disabled.');
        }
    },

    /**
     * Identify a user (call on login)
     */
    identifyUser: (userId: string, traits?: Record<string, any>) => {
        setUserId(userId);
        if (traits) {
            const identifyObj = new Identify();
            Object.keys(traits).forEach((key) => {
                identifyObj.set(key, traits[key]);
            });
            identify(identifyObj);
        }
    },

    /**
     * Reset user (call on logout)
     */
    resetUser: () => {
        reset();
    },

    /**
     * Log a custom event
     */
    logEvent: (eventName: string, properties?: Record<string, any>) => {
        if (__DEV__) {
            console.log(`[Analytics] ${eventName}`, properties || '');
        }
        track(eventName, properties);
    },

    /**
     * Core Events Map (for consistency)
     */
    Events: {
        // Auth
        SIGN_UP_COMPLETED: 'Sign Up Completed',
        LOGIN_SUCCESS: 'Login Success',
        LOGOUT: 'Logout',

        // Tasks
        TASK_CREATED: 'Task Created',
        TASK_COMPLETED: 'Task Completed',
        TASK_DELETED: 'Task Deleted',

        // Groups
        GROUP_CREATED: 'Group Created',
        GROUP_JOINED: 'Group Joined',
        GROUP_MESSAGE_SENT: 'Group Message Sent',
        GROUP_TASK_CREATED: 'Group Task Created',

        // Integrations
        CALENDAR_CONNECTED: 'Calendar Connected',
    }
};
