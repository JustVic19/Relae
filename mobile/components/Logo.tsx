import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface LogoProps {
    size?: number;
    style?: StyleProp<ImageStyle>;
}

/**
 * Theme-aware Logo component
 * Automatically switches between light and dark logo variants based on the current theme
 */
export function Logo({ size = 48, style }: LogoProps) {
    const { colorScheme } = useTheme();

    // Use appropriate logo based on theme
    const logoSource = colorScheme === 'dark'
        ? require('../assets/logo-dark.png')
        : require('../assets/logo-light.png');

    return (
        <Image
            source={logoSource}
            style={[
                {
                    width: size,
                    height: size,
                },
                style,
            ]}
            resizeMode="contain"
        />
    );
}
