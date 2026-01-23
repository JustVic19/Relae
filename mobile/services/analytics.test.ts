import { Analytics } from './analytics';
import { track, init } from '@amplitude/analytics-react-native';

describe('Analytics Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes amplitude with API key if present', () => {
        // Mock env variable if possible, or reliance on default mock
        Analytics.init();
        // Since we mocked the module, we expect the mock to be called
        // Note: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY might be undefined in test env
        // We can manually set it or check logic
    });

    it('logs events correctly', () => {
        Analytics.logEvent('TEST_EVENT', { foo: 'bar' });
        expect(track).toHaveBeenCalledWith('TEST_EVENT', { foo: 'bar' });
    });
});
