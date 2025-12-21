/**
 * StudentOS Design Tokens
 * Digital Brutalism Design System
 */

export const colors = {
    // Light mode
    light: {
        bg: {
            primary: '#FFFFFF',
            secondary: '#F5F5F5',
        },
        surface: {
            card: '#FFFFFF',
            elevated: '#FAFAFA',
        },
        text: {
            primary: '#000000',
            secondary: '#666666',
            muted: '#999999',
        },
        border: {
            default: '#000000',
            strong: '#000000',
            subtle: '#CCCCCC',
        },
        accent: {
            primary: '#000000',
            success: '#00CC66',
            warning: '#FFAA00',
            error: '#FF3333',
            info: '#0066FF',
        },
        confidence: {
            high: '#00CC66',
            medium: '#FFAA00',
            low: '#999999',
        },
    },

    // Dark mode
    dark: {
        bg: {
            primary: '#000000',
            secondary: '#0A0A0A',
        },
        surface: {
            card: '#1A1A1A',
            elevated: '#222222',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#AAAAAA',
            muted: '#666666',
        },
        border: {
            default: '#333333',
            strong: '#555555',
            subtle: '#222222',
        },
        accent: {
            primary: '#FFFFFF',
            success: '#00FF7F',
            warning: '#FFB800',
            error: '#FF4444',
            info: '#0088FF',
        },
        confidence: {
            high: '#00FF7F',
            medium: '#FFB800',
            low: '#666666',
        },
    },
};

export const typography = {
    fontFamily: {
        // Will use Inter or Space Grotesk
        primary: 'System',
        mono: 'Courier',
    },
    fontSize: {
        xs: 11,
        sm: 13,
        base: 15,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        black: '900' as const,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
};

export const borders = {
    width: {
        thin: 1,
        default: 2,
        thick: 3,
        heavy: 4,
    },
    radius: {
        none: 0,
        sm: 8,
        md: 12,
        lg: 16,
    },
};

export const shadows = {
    // Modern design with visible shadows for depth
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    button: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
};

export const layout = {
    screenPadding: spacing[4],
    cardPadding: spacing[4],
    cardGap: spacing[3],
    sectionGap: spacing[6],
};

// Type exports for TypeScript
export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
