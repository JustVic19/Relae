import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ColorScheme, colors, ThemeColors } from './tokens';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeContextType = {
    colorScheme: ColorScheme;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const deviceScheme = useDeviceColorScheme();
    const [colorScheme, setColorScheme] = useState<ColorScheme>(deviceScheme || 'light');

    const toggleTheme = () => {
        setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (scheme: ColorScheme) => {
        setColorScheme(scheme);
    };

    const themeColors = colors[colorScheme];

    return (
        <ThemeContext.Provider
            value={{
                colorScheme,
                colors: themeColors,
                toggleTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
