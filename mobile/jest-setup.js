
// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    wrap: (Comp) => Comp,
}));

// Mock Amplitude
jest.mock('@amplitude/analytics-react-native', () => ({
    init: jest.fn(),
    track: jest.fn(),
    setUserId: jest.fn(),
    reset: jest.fn(),
    Identify: jest.fn().mockImplementation(() => ({
        set: jest.fn(),
    })),
    identify: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
    useNetInfo: jest.fn().mockReturnValue({ isConnected: true }),
}));
